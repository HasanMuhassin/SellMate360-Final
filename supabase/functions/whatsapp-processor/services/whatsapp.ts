// ─── WhatsApp Cloud API Sender Service ───────────────────────────────────────
// All outgoing message logic is centralised here.
// Never call the Meta Graph API directly from handlers — use these functions.

const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID")!;
const API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN")!;
const API_BASE  = `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`;

// ─── Internal fetch wrapper ───────────────────────────────────────────────────
async function postToMeta(payload: unknown): Promise<void> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    // Log but don't throw — a failed send should not crash the processor
    console.error(`Meta API error ${res.status}:`, body);
  }
}

// ─── Send plain text ──────────────────────────────────────────────────────────
/**
 * Sends a simple text message to a WhatsApp number.
 */
export async function sendText(to: string, message: string): Promise<void> {
  await postToMeta({
    messaging_product: "whatsapp",
    recipient_type:    "individual",
    to,
    type: "text",
    text: { preview_url: false, body: message },
  });
}

// ─── Send interactive button message ─────────────────────────────────────────
/**
 * Sends a WhatsApp Interactive Button message.
 * Used exclusively for the Order Confirmation step.
 * Buttons have payloads (ids) that are returned when the customer taps them.
 *
 * @param buttons - max 3 buttons, each with { id, title }
 */
export async function sendButtonMessage(
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
  headerText?: string,
  footerText?: string
): Promise<void> {
  await postToMeta({
    messaging_product: "whatsapp",
    recipient_type:    "individual",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      ...(headerText ? { header: { type: "text", text: headerText } } : {}),
      body:   { text: bodyText },
      ...(footerText ? { footer: { text: footerText } } : {}),
      action: {
        buttons: buttons.map((b) => ({
          type:  "reply",
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
}

// ─── Send product list ────────────────────────────────────────────────────────
/**
 * Sends a WhatsApp List Message for displaying multiple products.
 * Used when a customer's query matches several products.
 */
export async function sendProductList(
  to: string,
  headerText: string,
  products: Array<{ id: string; name: string; price: number; stock_status: string }>
): Promise<void> {
  // WhatsApp List Messages have a max of 10 rows per section
  const rows = products.slice(0, 10).map((p) => ({
    id:          p.id,
    title:       p.name.slice(0, 24),  // WhatsApp row title: 24 char max
    description: `Rs. ${p.price} — ${p.stock_status === "in-stock" ? "✅ In Stock" : "⚠️ Low Stock"}`,
  }));

  await postToMeta({
    messaging_product: "whatsapp",
    recipient_type:    "individual",
    to,
    type: "interactive",
    interactive: {
      type:   "list",
      header: { type: "text", text: headerText },
      body:   { text: "Here are the matching products:" },
      footer: { text: "Tap a product to order it" },
      action: {
        button:   "View Products",
        sections: [{ title: "Results", rows }],
      },
    },
  });
}
