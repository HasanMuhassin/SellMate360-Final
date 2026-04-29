import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { createGoogleGenerativeAI } from "npm:@ai-sdk/google";
import { generateText } from "npm:ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface NewProduct {
  id: string;
  name: string;
  description?: string | null;
  selling_price: number;
  original_price?: number | null;
  sku?: string | null;
  stock_status?: string | null;
  status?: string;
}

// ─── AI: Generate new product announcement ────────────────────────────────────
// Gemini client is intentionally created INSIDE the handler (lazy init)
// to match the working whatsapp-processor pattern and avoid cold-start crashes.
async function generateProductMessage(product: NewProduct): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
  console.log("[GEMINI] API key present:", !!apiKey);

  const google = createGoogleGenerativeAI({ apiKey: apiKey! });

  const priceLabel = `Rs. ${product.selling_price.toLocaleString()}`;
  const hasDiscount =
    product.original_price && product.original_price > product.selling_price;
  const discountNote = hasDiscount
    ? ` (was Rs. ${product.original_price!.toLocaleString()})`
    : "";

  const stockNote =
    product.stock_status === "in-stock"
      ? "in stock and ready to order"
      : product.stock_status === "low-stock"
      ? "available in limited quantity"
      : "just added to our catalogue";

  const prompt = `Generate a WhatsApp new product announcement for:
Product Name: ${product.name}
Price: ${priceLabel}${discountNote}
Availability: ${stockNote}
Description: ${product.description || "A great new addition to our catalogue"}`;

  console.log("[GEMINI] Calling generateText for product:", product.name);

  const { text } = await generateText({
    model: google("gemini-2.5-flash"),
    system: `You are a WhatsApp marketing copywriter for SellMate, a Sri Lankan e-commerce store.
Write a concise, exciting new product announcement for WhatsApp customers.

Rules:
- Maximum 5 sentences
- Use 2-4 emojis, placed naturally
- Plain text only — no markdown, no asterisks, no formatting codes
- Mention the product name and price clearly
- Make it sound exciting, like something they'd want to check out immediately
- Last sentence must be a call to action directing them to visit https://sellmate.lk to order
- Sound human and enthusiastic, not like a template`,
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

  console.log("[NEW-PRODUCT] Handler invoked");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const waToken     = Deno.env.get("WHATSAPP_API_TOKEN")!;
  const waPhoneId   = Deno.env.get("WHATSAPP_PHONE_ID")!;

  console.log("[ENV]", {
    supabaseUrl: supabaseUrl ? `set (${supabaseUrl})` : "MISSING",
    serviceKey:  serviceKey  ? `set (prefix: ${serviceKey.slice(0, 12)}...)` : "MISSING",
    waToken:     waToken     ? `set` : "MISSING",
    waPhoneId:   waPhoneId   ? `set (${waPhoneId})` : "MISSING",
  });

  try {
    const { product }: { product: NewProduct } = await req.json();
    console.log(`[NEW-PRODUCT] Product received: "${product?.name}" id=${product?.id}`);

    if (!product?.id || !product?.name) {
      return new Response(JSON.stringify({ error: "Invalid product payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(supabaseUrl, serviceKey);

    // ── Step 1: Fetch all WhatsApp customer phones ────────────────────────────
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
      console.log("[NEW-PRODUCT] No customers — returning early.");
      return new Response(
        JSON.stringify({ success: true, sent: 0, total: 0, reason: "No WhatsApp customers found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 2: Generate AI message ───────────────────────────────────────────
    console.log("[NEW-PRODUCT] Generating AI message...");
    const message = await generateProductMessage(product);
    console.log(`[NEW-PRODUCT] Message (${message.length} chars): "${message.slice(0, 80)}..."`);

    // ── Step 3: Send to each customer ─────────────────────────────────────────
    let sent = 0;
    let failed = 0;

    for (const customer of customers) {
      const ok = await sendWhatsAppMessage(customer.phone, message, waPhoneId, waToken);
      if (ok) { sent++; } else { failed++; }
      await new Promise((r) => setTimeout(r, 150));
    }

    console.log(`[NEW-PRODUCT] Done — sent: ${sent}, failed: ${failed}`);

    // ── Step 4: Audit log (fire-and-forget, not awaited) ─────────────────────
    void db.from("audit_logs").insert({
      action:      "whatsapp_new_product_broadcast",
      resource:    "products",
      resource_id: product.id,
      details:     { product_name: product.name, price: product.selling_price, sent, failed, total: customers.length },
      level:       "info",
      user_name:   "System",
      user_role:   "admin",
    });

    console.log("[NEW-PRODUCT] Returning 200 success response");
    return new Response(
      JSON.stringify({ success: true, sent, failed, total: customers.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[NEW-PRODUCT] Unhandled error:", msg);
    console.error("[NEW-PRODUCT] Stack:", err?.stack ?? "no stack");
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
