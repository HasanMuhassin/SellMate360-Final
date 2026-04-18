import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Modular imports ────────────────────────────────────────────────────────────
import { detectIntent, generateFallbackResponse, buildConversationContext } from "./ai/gemini.ts";
import { getState, updateState, getMessageHistory } from "./state/conversation.ts";
import { handleQuery } from "./handlers/queryHandler.ts";
import {
  handleOrderDraft,
  handleCancel,
  handleProductSelection,
  executeOrder,
} from "./handlers/orderHandler.ts";
import { sendText } from "./services/whatsapp.ts";

// ── DB client (service role — full access, no RLS) ────────────────────────────
const SUPABASE_URL = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Main Processor ────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // This function is triggered by the Supabase Database Webhook
  // whenever a new row is inserted into whatsapp_messages.
  // The payload contains the new row's data.

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Extract the new row from the Database Webhook payload
  // Supabase sends { type, table, record, schema, old_record }
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

  // Mark the message as processed (prevent re-processing if function is called twice)
  await db
    .from("whatsapp_messages")
    .update({ processed: true })
    .eq("id", record.id)
    .eq("processed", false); // Atomic guard

  try {
    // ── Load conversation context ──────────────────────────────────────────────
    const [state, history] = await Promise.all([
      getState(db, phone),
      getMessageHistory(db, phone, 10),
    ]);

    const conversationContext = buildConversationContext(history, phone);

    // ── PRIORITY ROUTING: Button payloads (deterministic — no AI) ────────────
    // Button press events have a specific payload string and must be
    // routed BEFORE any AI processing to guarantee exactness.

    if (buttonPayload) {

      // Customer confirmed the order
      if (buttonPayload.startsWith("CONFIRM_ORDER_")) {
        await executeOrder(db, phone, state);
        return new Response("ok", { status: 200 });
      }

      // Customer cancelled the order
      if (buttonPayload === "CANCEL_ORDER") {
        await handleCancel(db, phone);
        return new Response("ok", { status: 200 });
      }

      // Customer selected a product from a disambiguation list
      if (buttonPayload.startsWith("SELECT_PRODUCT_")) {
        const productId = buttonPayload.replace("SELECT_PRODUCT_", "");
        await handleProductSelection(db, phone, productId, state);
        return new Response("ok", { status: 200 });
      }
    }

    // ── AI PROCESSING: Text messages ──────────────────────────────────────────
    // Only runs for plain text messages (not button presses)

    if (!messageText.trim()) {
      // Non-text message types (voice notes, images, etc.)
      await sendText(
        phone,
        "Hi! 👋 I can only process text messages right now. Please type your question or what you'd like to order."
      );
      return new Response("ok", { status: 200 });
    }

    // ── Step 1: Intent Detection (AI Call) ────────────────────────────────────
    const intent = await detectIntent(messageText, conversationContext);

    console.log(`[${phone}] Intent: ${intent.intent} (${intent.confidence}) | Step: ${state.current_step}`);

    // ── Step 2: Contextual step override ──────────────────────────────────────
    // If the user is in the middle of a multi-step order and sends a text,
    // we might need to interpret the message as a field answer even if the
    // AI classified it as CASUAL.
    if (
      state.current_step === "collecting_qty" &&
      intent.intent === "CASUAL" &&
      /\d+/.test(messageText)
    ) {
      // Customer typed a number — treat as quantity answer
      const qty = parseInt(messageText.match(/\d+/)![0], 10);
      await handleOrderDraft(db, phone, { ...intent, intent: "ORDER", quantity: qty }, state);
      return new Response("ok", { status: 200 });
    }

    if (
      state.current_step === "collecting_location" &&
      intent.intent === "CASUAL"
    ) {
      // Customer typed a location string — treat as location answer
      await handleOrderDraft(db, phone, { ...intent, intent: "ORDER", location: messageText }, state);
      return new Response("ok", { status: 200 });
    }

    // ── Step 3: Route by intent ───────────────────────────────────────────────
    switch (intent.intent) {
      case "QUERY":
        await handleQuery(db, phone, intent.productName, messageText);
        break;

      case "ORDER":
        await handleOrderDraft(db, phone, intent, state);
        break;

      case "CASUAL":
      case "UNKNOWN":
      default: {
        const fallback = await generateFallbackResponse(messageText);
        await sendText(phone, fallback);
        break;
      }
    }

  } catch (err) {
    console.error(`Processor error for ${phone}:`, err);
    // Always send a user-facing error message so the customer knows something went wrong
    await sendText(
      phone,
      "Sorry, I ran into a technical issue. 😔 Please try again in a moment or contact our support."
    ).catch(() => {}); // Never let the error response itself throw
  }

  return new Response("ok", { status: 200 });
});
