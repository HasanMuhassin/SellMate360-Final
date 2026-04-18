import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateQueryResponse } from "../ai/gemini.ts";
import { sendText, sendProductList } from "../services/whatsapp.ts";

// ─── Query Handler ────────────────────────────────────────────────────────────
/**
 * Handles QUERY intents.
 * 1. Fuzzy-searches the products table by the AI-extracted product name.
 * 2. If one match: passes live DB data to Gemini to generate a contextual reply.
 * 3. If multiple matches: sends a WhatsApp List Message for the customer to pick.
 * 4. If no match: sends a graceful "not found" message.
 *
 * IMPORTANT: All product data (price, stock) comes from DB.
 * Gemini only generates the conversational tone — it cannot invent values.
 */
export async function handleQuery(
  db: SupabaseClient,
  phone: string,
  productName: string | null,
  customerMessage: string
): Promise<void> {
  // ── No product name extracted ─────────────────────────────────────────────
  if (!productName) {
    await sendText(
      phone,
      "Sure! What product are you looking for? You can describe it and I'll check if we have it. 😊"
    );
    return;
  }

  // ── Fuzzy product search (case-insensitive partial match) ─────────────────
  const { data: products, error } = await db
    .from("products")
    .select("id, name, sku, description, selling_price, original_price, stock_status, stock")
    .ilike("name", `%${productName}%`)
    .neq("status", "inactive")
    .order("is_bestseller",  { ascending: false })
    .limit(5);

  if (error) {
    console.error("Product search error:", error);
    await sendText(phone, "Sorry, I had trouble searching our catalogue. Please try again!");
    return;
  }

  // ── No products found ──────────────────────────────────────────────────────
  if (!products || products.length === 0) {
    await sendText(
      phone,
      `Sorry, we don't have "${productName}" in our catalogue right now. 😔\n\nWould you like to describe what you're looking for in a different way?`
    );
    return;
  }

  // ── Multiple products found → List Message ─────────────────────────────────
  if (products.length > 1) {
    await sendProductList(
      phone,
      `We found ${products.length} products matching "${productName}"`,
      products.map((p) => ({
        id:           p.id,
        name:         p.name,
        price:        p.selling_price,
        stock_status: p.stock_status,
      }))
    );
    return;
  }

  // ── Single product found → AI-generated contextual reply ──────────────────
  const product     = products[0];
  const productJson = JSON.stringify({
    name:           product.name,
    price:          `Rs. ${product.selling_price}`,
    original_price: product.original_price ? `Rs. ${product.original_price}` : null,
    stock:          product.stock_status,
    description:    product.description ?? "No description available",
  }, null, 2);

  const aiReply = await generateQueryResponse(customerMessage, productJson);
  await sendText(phone, aiReply);
}
