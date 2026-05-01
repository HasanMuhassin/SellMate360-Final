import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createGoogleGenerativeAI } from "npm:@ai-sdk/google";
import { generateText } from "npm:ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface FlashSale {
  id: string;
  name: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  starts_at: string;
  ends_at: string;
  badge_text?: string;
  status: string;
}

// ─── AI: Generate the broadcast message ───────────────────────────────────────
// NOTE: google client is intentionally created INSIDE the handler (lazy init),
// exactly matching the working whatsapp-processor pattern to avoid cold-start crashes.
async function generateFlashSaleMessage(sale: FlashSale): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
  console.log("[GEMINI] API key present:", !!apiKey);

  const google = createGoogleGenerativeAI({ apiKey: apiKey! });

  const discountLabel =
    sale.discount_type === "percentage"
      ? `${sale.discount_value}% off`
      : `Rs. ${sale.discount_value} off`;

  const startsAt = new Date(sale.starts_at).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  const endsAt = new Date(sale.ends_at).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

  console.log("[GEMINI] Calling generateText for sale:", sale.name);

  let text: string;
  try {
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: `You are a WhatsApp marketing copywriter for SellMate, a Sri Lankan e-commerce store.
Write a concise, exciting flash sale announcement for WhatsApp.

Rules:
- Maximum 5 sentences
- Use 2-4 emojis, placed naturally (not all at the start)
- Plain text only — no markdown, no asterisks, no formatting codes
- Mention the discount, sale name, and end time clearly
- Last sentence must be a call to action directing them to visit https://sellmate.lk to grab the deal now
- Sound human and excited, not robotic or template-like`,
      prompt: `Generate a WhatsApp flash sale message for:
Sale Name: ${sale.name}
Discount: ${discountLabel}
Description: ${sale.description || "Limited time offer on selected products"}
Starts: ${startsAt}
Ends: ${endsAt}`,
    });
    text = result.text.trim();
    console.log("[GEMINI] Response received, length:", text.length);
  } catch (aiErr: any) {
    const reason = aiErr instanceof Error ? aiErr.message : String(aiErr);
    console.warn("[GEMINI] Failed, using fallback message. Reason:", reason);
    text = `Hey SellMate family! 🎉 We have an exciting flash sale running right now! ${sale.name} — ${discountLabel} off! This offer ends on ${endsAt}, so don’t miss out. Visit https://sellmate.lk to grab the deal now! 🛒`;
  }

  return text;
}

// ─── WhatsApp: Send a text message ────────────────────────────────────────────
async function sendWhatsAppMessage(
  to: string,
  body: string,
  phoneId: string,
  token: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type":  "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type:    "individual",
          to,
          type: "text",
          text: { preview_url: false, body },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[WA SEND] Failed for ${to.slice(0, 7)}*** HTTP ${res.status}:`, errBody);
    }

    return res.ok;
  } catch (err) {
    console.error(`[WA SEND] Exception for ${to.slice(0, 7)}***:`, err);
    return false;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  console.log("[BROADCAST] Handler invoked");

  // Read all env vars INSIDE the handler (same pattern as working processor)
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const waToken     = Deno.env.get("WHATSAPP_API_TOKEN")!;
  const waPhoneId   = Deno.env.get("WHATSAPP_PHONE_ID")!;

  console.log("[ENV]", {
    supabaseUrl: supabaseUrl ? `set (${supabaseUrl})` : "MISSING",
    serviceKey:  serviceKey  ? `set (prefix: ${serviceKey.slice(0, 12)}...)` : "MISSING",
    waToken:     waToken     ? `set (prefix: ${waToken.slice(0, 10)}...)` : "MISSING",
    waPhoneId:   waPhoneId   ? `set (${waPhoneId})` : "MISSING",
  });

  try {
    const { sale }: { sale: FlashSale } = await req.json();
    console.log(`[BROADCAST] Sale received: "${sale?.name}" id=${sale?.id}`);

    if (!sale?.id || !sale?.name) {
      return new Response(JSON.stringify({ error: "Invalid sale payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(supabaseUrl, serviceKey);

    // ── Step 1: Fetch WhatsApp customer phones ────────────────────────────────
    console.log("[DB] Querying wa_customers...");
    const { data: customers, error: custError } = await db
      .from("wa_customers")
      .select("phone, name")
      .not("phone", "is", null);

    if (custError) {
      console.error("[DB] wa_customers error:", JSON.stringify(custError));
      throw new Error(custError.message ?? JSON.stringify(custError));
    }

    console.log(`[DB] wa_customers: ${customers?.length ?? 0} rows`);

    if (!customers || customers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, total: 0, reason: "No WhatsApp customers found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: Generate AI message ───────────────────────────────────────────
    console.log("[BROADCAST] Generating AI message...");
    const message = await generateFlashSaleMessage(sale);
    console.log(`[BROADCAST] Message (${message.length} chars): "${message.slice(0, 80)}..."`);

    // ── Step 3: Send to each customer ─────────────────────────────────────────
    let sent = 0;
    let failed = 0;

    for (const customer of customers) {
      const ok = await sendWhatsAppMessage(customer.phone, message, waPhoneId, waToken);
      if (ok) { sent++; } else { failed++; }
      await new Promise((r) => setTimeout(r, 150));
    }

    console.log(`[BROADCAST] Done — sent: ${sent}, failed: ${failed}`);

    // ── Return 200 immediately — audit log is fire-and-forget ─────────────────
    // supabase-js v2 never rejects promises, so .catch() is used defensively.
    // We do NOT await this — return the success response first.
    void db.from("audit_logs").insert({
      action:      "whatsapp_flash_sale_broadcast",
      resource:    "promotions",
      resource_id: sale.id,
      details:     { sale_name: sale.name, sent, failed, total: customers.length, message_preview: message.slice(0, 120) },
      level:       "info",
      user_name:   "System",
      user_role:   "admin",
    });

    console.log("[BROADCAST] Returning 200 success response");
    return new Response(
      JSON.stringify({ success: true, sent, failed, total: customers.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[BROADCAST] Unhandled error:", msg);
    console.error("[BROADCAST] Stack:", err?.stack ?? "no stack");
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
