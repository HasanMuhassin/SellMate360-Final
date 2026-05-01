import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Modular imports ────────────────────────────────────────────────────────────
import { detectIntent, generateFallbackResponse, buildConversationContext } from "./ai/gemini.ts";
import { getState, resetState, getMessageHistory } from "./state/conversation.ts";
import { handleQuery } from "./handlers/queryHandler.ts";
import {
  handleOrderDraft,
  handleCancel,
  handleProductSelection,
  executeOrder,
} from "./handlers/orderHandler.ts";
import { sendText } from "./services/whatsapp.ts";

// ── DB client (service role — full access, no RLS) ────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Main Processor ────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const record = (payload.record ?? payload) as {
    id:             string;
    from_phone:     string;
    body:           string | null;
    button_payload: string | null;
    message_type:   string;
    processed:      boolean;
  };

  const phone         = record.from_phone;
  const messageText   = record.body ?? "";
  const buttonPayload = record.button_payload;

  if (!phone) {
    console.error("No phone number in record");
    return new Response("ok", { status: 200 });
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  // Atomic idempotency guard — skip if already processed
  const { data: updateResult } = await db
    .from("whatsapp_messages")
    .update({ processed: true })
    .eq("id", record.id)
    .eq("processed", false)
    .select("id");

  if (!updateResult || updateResult.length === 0) {
    console.log(`[${phone}] Message ${record.id} already processed — skipping.`);
    return new Response("ok", { status: 200 });
  }

  try {
    // ── Load conversation context ──────────────────────────────────────────────
    const [state, history] = await Promise.all([
      getState(db, phone),
      getMessageHistory(db, phone, 8),  // limit to 8 to avoid stale context bleeding
    ]);

    const conversationContext = buildConversationContext(history, phone);

    console.log(`[${phone}] Step: ${state.current_step} | Button: ${buttonPayload ?? "none"} | Msg: "${messageText.slice(0, 40)}"`);

    // ── PRIORITY ROUTING: Button payloads (deterministic — no AI) ────────────

    if (buttonPayload) {

      // ── CONFIRM ORDER ──────────────────────────────────────────────────────
      if (buttonPayload === "CONFIRM_ORDER") {
        await executeOrder(db, phone, state);
        return new Response("ok", { status: 200 });
      }

      // ── CANCEL ORDER ──────────────────────────────────────────────────────
      // FIX: WhatsApp cannot edit/disable buttons after sending.
      // If the order was already placed, the cancel button is stale — guard here.
      if (buttonPayload === "CANCEL_ORDER") {
        if (state.current_step === "order_placed") {
          await sendText(
            phone,
            "Your order has already been placed ✅\n\n" +
            "To cancel or modify it, please contact our support team directly. " +
            "We'll be happy to help! 🙏"
          );
        } else {
          await handleCancel(db, phone);
        }
        return new Response("ok", { status: 200 });
      }

      // ── PRODUCT SELECTION ─────────────────────────────────────────────────
      if (buttonPayload.startsWith("SELECT_PRODUCT_")) {
        const productId = buttonPayload.replace("SELECT_PRODUCT_", "");
        await handleProductSelection(db, phone, productId, state);
        return new Response("ok", { status: 200 });
      }
    }

    // ── Non-text messages (voice notes, images, documents) ────────────────────
    if (!messageText.trim()) {
      await sendText(
        phone,
        "Hi! 👋 I can only process text messages right now. Please type your question or what you'd like to order."
      );
      return new Response("ok", { status: 200 });
    }

    // ── AI INTENT DETECTION ───────────────────────────────────────────────────
    const intent = await detectIntent(messageText, conversationContext);
    console.log(`[${phone}] Intent: ${intent.intent} (${intent.confidence}) | ProductName: ${intent.productName ?? "none"}`);

    // ── CONTEXTUAL STEP OVERRIDES ─────────────────────────────────────────────
    // These run BEFORE intent routing. Mid-order messages must be interpreted
    // by their context (what step we're on), not by what the AI classified them.
    //
    // BUG FIXED: collecting_qty now intercepts ANY intent, not just CASUAL.
    // When the user types "3", the AI often classifies it as ORDER with the
    // product name from history — which then wrongly triggered the
    // "different product" reset. We now check step first, AI intent second.

    if (state.current_step === "collecting_qty" && /\d+/.test(messageText)) {
      const qty = parseInt(messageText.match(/\d+/)![0], 10);
      console.log(`[${phone}] collecting_qty override — qty: ${qty}`);
      await handleOrderDraft(db, phone, { ...intent, intent: "ORDER", quantity: qty }, state);
      return new Response("ok", { status: 200 });
    }

    if (state.current_step === "collecting_location" && intent.intent === "CASUAL") {
      await handleOrderDraft(db, phone, { ...intent, intent: "ORDER", location: messageText }, state);
      return new Response("ok", { status: 200 });
    }

    // ── FIX: Clear stale ORDER draft when user starts a fresh QUERY ───────────
    // If the user had an in-progress order for Product A, left, and now queries
    // about Product B, clear the old draft so the new query isn't contaminated.
    if (
      intent.intent === "QUERY" &&
      state.current_step !== "idle" &&
      state.current_step !== "awaiting_confirmation"  // preserve confirmed orders
    ) {
      console.log(`[${phone}] New QUERY detected mid-order draft — resetting stale state.`);
      await resetState(db, phone);
    }

    // ── INTENT ROUTING ────────────────────────────────────────────────────────
    switch (intent.intent) {
      case "QUERY":
        await handleQuery(db, phone, intent.productName, messageText);
        break;

      case "ORDER": {
        // Only reset the draft if the user is at idle AND explicitly ordering
        // a clearly different product. Never reset mid-order — the AI frequently
        // echoes the product name from history even for qty/location messages.
        //
        // BUG FIXED: old check split by first word ('digital') and compared
        // against 'air fryer' — they didn't match, so it wrongly reset.
        // New check: bidirectional substring match, only from idle step.
        const draftName  = (state.draft_product_name ?? "").toLowerCase();
        const intentName = (intent.productName ?? "").toLowerCase();
        const isDifferentProduct =
          state.current_step === "idle" &&   // never reset mid-order
          intent.productName &&
          state.draft_product_name &&
          !draftName.includes(intentName) &&  // "digital air fryer 5l" includes "air fryer" ✓
          !intentName.includes(draftName);    // also check reverse

        if (isDifferentProduct) {
          console.log(`[${phone}] New ORDER for different product ("${intentName}" vs "${draftName}") — resetting draft.`);
          await resetState(db, phone);
          const freshState = await getState(db, phone);
          await handleOrderDraft(db, phone, intent, freshState);
        } else {
          await handleOrderDraft(db, phone, intent, state);
        }
        break;
      }

      case "CASUAL":
      case "UNKNOWN":
      default: {
        // If user is mid-order and sends something vague, remind them instead
        // of sending a generic fallback that breaks the flow.
        if (state.current_step !== "idle" && state.current_step !== "order_placed") {
          await sendText(
            phone,
            "Just to let you know, you have an order in progress! 🛒\n\n" +
            "Type *cancel* to stop, or continue answering the question above."
          );
        } else {
          const fallback = await generateFallbackResponse(messageText);
          await sendText(phone, fallback);
        }
        break;
      }
    }

  } catch (err) {
    console.error(`Processor error for ${phone}:`, err);
    await sendText(
      phone,
      "Sorry, I ran into a technical issue. 😔 Please try again in a moment or contact our support."
    ).catch(() => {});
  }

  return new Response("ok", { status: 200 });
});
