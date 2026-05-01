import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createGoogleGenerativeAI } from "npm:@ai-sdk/google";
import { generateText } from "npm:ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Statuses that should NOT trigger a notification ────────────────────────────
// "pending" is the default initial state — customer already got confirmation
// when the order was placed (via WhatsApp bot or website checkout flow).
const SKIP_STATUSES = new Set(["pending"]);

// ─── AI: Generate personalised order status message ───────────────────────────
// Gemini client created INSIDE handler (lazy init) — avoids cold-start crashes.
async function generateStatusMessage(
  customerName: string,
  orderNumber: string,
  newStatus: string,
  total: number
): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
  console.log("[GEMINI] API key present:", !!apiKey);

  const google = createGoogleGenerativeAI({ apiKey: apiKey! });

  const statusDescriptions: Record<string, string> = {
    confirmed:        "has been confirmed and will be prepared soon",
    processing:       "is currently being picked, packed, and prepared for dispatch",
    shipped:          "has been handed over to the courier and is on its way",
    out_for_delivery: "is out for delivery and will arrive today",
    delivered:        "has been successfully delivered",
    cancelled:        "has been cancelled",
    returned:         "has been returned",
  };

  const statusNote = statusDescriptions[newStatus] ?? `status has been updated to ${newStatus}`;

  const prompt = `Generate a WhatsApp order status update message for:
Customer Name: ${customerName}
Order Number: #${orderNumber}
New Status: ${newStatus}
Status Meaning: The order ${statusNote}
Order Total: Rs. ${total.toLocaleString()}`;

  console.log("[GEMINI] Calling generateText — status:", newStatus);

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    system: `You are a WhatsApp customer service agent for SellMate, a Sri Lankan e-commerce store.
Write a concise, friendly order status update message for a customer.

Rules:
- Maximum 4 sentences
- Address the customer by their first name; if the name is "Customer", open with "Dear Customer" instead of "Hi Customer"
- Always include the order number clearly
- Use 1-2 emojis placed naturally (more cheerful for positive statuses, professional for cancelled/returned)
- Plain text only — no markdown, no asterisks, no formatting codes
- For delivered: thank the customer and invite them to shop again at https://sellmate.lk
- For cancelled/returned: mention they can contact us at +94778469248 for help
- Sound human and warm, not robotic`,
    prompt,
  });

  console.log("[GEMINI] Response received, length:", text.length);
  return text.trim();
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
      console.error(`[WA] Failed for ${to.slice(0, 7)}*** HTTP ${res.status}:`, errBody);
    } else {
      console.log(`[WA] Sent OK to ${to.slice(0, 7)}***`);
    }
    return res.ok;
  } catch (err) {
    console.error(`[WA] Exception for ${to.slice(0, 7)}***:`, err);
    return false;
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  console.log("[ORDER-STATUS] Handler invoked");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const waToken     = Deno.env.get("WHATSAPP_API_TOKEN")!;
  const waPhoneId   = Deno.env.get("WHATSAPP_PHONE_ID")!;

  console.log("[ENV]", {
    supabaseUrl: supabaseUrl ? `set (${supabaseUrl})` : "MISSING",
    serviceKey:  serviceKey  ? `set (prefix: ${serviceKey.slice(0, 12)}...)` : "MISSING",
    waToken:     waToken     ? "set" : "MISSING",
    waPhoneId:   waPhoneId   ? `set (${waPhoneId})` : "MISSING",
  });

  try {
    const { orderId, newStatus }: { orderId: string; newStatus: string } = await req.json();
    console.log(`[ORDER-STATUS] orderId: ${orderId} | newStatus: ${newStatus}`);

    if (!orderId || !newStatus) {
      return new Response(JSON.stringify({ error: "orderId and newStatus are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip statuses that should not trigger a notification
    if (SKIP_STATUSES.has(newStatus)) {
      console.log(`[ORDER-STATUS] Skipping notification for status: ${newStatus}`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: `No notification for status: ${newStatus}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const db = createClient(supabaseUrl, serviceKey);

    // ── Step 1: Fetch order from DB ───────────────────────────────────────────
    console.log("[DB] Fetching order...");
    const { data: order, error: orderError } = await db
      .from("orders")
      .select("id, order_number, order_status, shipping_phone, shipping_name, total")
      .eq("id", orderId)
      .single();

    if (orderError) {
      throw new Error(orderError.message ?? JSON.stringify(orderError));
    }

    if (!order?.shipping_phone) {
      console.log("[ORDER-STATUS] No shipping_phone on order — skipping.");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No phone number on order" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[ORDER-STATUS] Order #${order.order_number} → ${order.shipping_name} (${order.shipping_phone.slice(0, 7)}***)`);

    // ── Step 2: Generate AI message ───────────────────────────────────────────
    // Normalize generic placeholder names set by the WhatsApp bot.
    // e.g. "WhatsApp Customer" → first word is "WhatsApp" which looks bad in a greeting.
    const rawName = (order.shipping_name ?? "").trim();
    const GENERIC_NAMES = new Set(["whatsapp customer", "whatsapp", "customer", ""]);
    const firstName = GENERIC_NAMES.has(rawName.toLowerCase())
      ? "Customer"
      : rawName.split(" ")[0];

    const message   = await generateStatusMessage(firstName, order.order_number, newStatus, order.total ?? 0);
    console.log(`[ORDER-STATUS] Message: "${message.slice(0, 80)}..."`);

    // ── Step 3: Send WhatsApp message ─────────────────────────────────────────
    const ok = await sendWhatsAppMessage(order.shipping_phone, message, waPhoneId, waToken);

    // ── Step 4: Audit log (fire-and-forget) ───────────────────────────────────
    void db.from("audit_logs").insert({
      action:      "whatsapp_order_status_notify",
      resource:    "orders",
      resource_id: orderId,
      details:     { order_number: order.order_number, new_status: newStatus, phone: order.shipping_phone, sent: ok },
      level:       ok ? "info" : "warning",
      user_name:   "System",
      user_role:   "admin",
    });

    console.log("[ORDER-STATUS] Returning 200");
    return new Response(
      JSON.stringify({ success: true, sent: ok }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ORDER-STATUS] Unhandled error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
