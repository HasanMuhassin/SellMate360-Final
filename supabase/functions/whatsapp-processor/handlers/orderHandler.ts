import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { IntentResult } from "../ai/gemini.ts";
import { ConversationState, updateState, resetState, isDraftExpired } from "../state/conversation.ts";
import { sendText, sendButtonMessage } from "../services/whatsapp.ts";

const SUPABASE_URL = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString()}`;
}

/** Naive district/city extractor from free-text location. */
function parseLocation(loc: string): { district: string; city: string; street: string } {
  const parts = loc.split(",").map((s) => s.trim());
  return {
    district: parts[1] ?? parts[0] ?? loc,
    city:     parts[0] ?? loc,
    street:   loc,
  };
}

// ─── Confirmation Button Builder ───────────────────────────────────────────────
/**
 * Sends the interactive WhatsApp Confirmation Message.
 * Prices are ALWAYS re-fetched from DB here — never trusted from AI state.
 * This is the final safety gate before the order is created.
 */
async function sendOrderConfirmation(
  db: SupabaseClient,
  phone: string,
  state: ConversationState
): Promise<void> {
  // Re-fetch live price and stock from DB — ignore cached state price
  const { data: product } = await db
    .from("products")
    .select("name, selling_price, stock_status, stock")
    .eq("id", state.draft_product_id!)
    .single();

  if (!product) {
    await sendText(phone, "Sorry, the product you selected is no longer available.");
    await resetState(db, phone);
    return;
  }

  if (product.stock_status === "out-of-stock" || product.stock <= 0) {
    await sendText(
      phone,
      `Sorry, *${product.name}* just went out of stock. 😔 Would you like to look for something else?`
    );
    await resetState(db, phone);
    return;
  }

  // TTL check — refuse stale drafts
  if (isDraftExpired(state)) {
    await sendText(
      phone,
      "⏰ Your shopping session has expired (6 hours). Let's start fresh — what would you like to order?"
    );
    await resetState(db, phone);
    return;
  }

  // Update draft with fresh price from DB
  const liveTotal = product.selling_price * (state.draft_quantity ?? 1);
  await updateState(db, phone, {
    draft_unit_price: product.selling_price,
    draft_total:      liveTotal,
    current_step:     "awaiting_confirmation",
  });

  const summary =
    `🛒 *Order Summary*\n\n` +
    `📦 Product: ${product.name}\n` +
    `🔢 Quantity: ${state.draft_quantity ?? 1}\n` +
    `💰 Price: ${formatPrice(liveTotal)}\n` +
    `📍 Deliver to: ${state.draft_location}\n` +
    `💳 Payment: ${(state.draft_payment_method ?? "cod").toUpperCase()}\n\n` +
    `Please confirm your order:`;

  await sendButtonMessage(
    phone,
    summary,
    [
      { id: `CONFIRM_ORDER_${phone}`,  title: "✅ Confirm Order" },
      { id: "CANCEL_ORDER",           title: "❌ Cancel" },
    ],
    "SellMate Order",
    "Prices are inclusive of delivery charges"
  );
}

// ─── Order Draft Handler ───────────────────────────────────────────────────────
/**
 * Main handler for ORDER intents.
 * Manages the multi-step collection flow:
 * collecting_product → collecting_qty → collecting_location → awaiting_confirmation
 *
 * At each step, the handler:
 * 1. Merges AI-extracted fields into the existing state
 * 2. Determines what is still missing
 * 3. Asks for the next missing field, or presents the confirmation screen
 */
export async function handleOrderDraft(
  db: SupabaseClient,
  phone: string,
  intent: IntentResult,
  state: ConversationState
): Promise<void> {
  // ── Merge AI-extracted fields into state ──────────────────────────────────
  const updates: Partial<ConversationState> = {};

  // Resolve product from AI-extracted name (only if product not already locked)
  if (intent.productName && !state.draft_product_id) {
    const { data: products } = await db
      .from("products")
      .select("id, name, sku, selling_price, stock_status, stock")
      .ilike("name", `%${intent.productName}%`)
      .neq("status", "inactive")
      .neq("stock_status", "out-of-stock")
      .limit(3);

    if (!products || products.length === 0) {
      await sendText(
        phone,
        `Sorry, we couldn't find "${intent.productName}" in our catalogue. Could you try a different product name?`
      );
      return;
    }

    if (products.length === 1) {
      const p = products[0];
      updates.draft_product_id   = p.id;
      updates.draft_product_name = p.name;
      updates.draft_product_sku  = p.sku;
      // Lock the price from DB right here — AI did not set this
      updates.draft_unit_price   = p.selling_price;
    } else {
      // Multiple matches — ask customer to pick
      await sendButtonMessage(
        phone,
        `We found ${products.length} products matching "${intent.productName}".\n\nWhich one did you mean?`,
        products.slice(0, 3).map((p) => ({
          id:    `SELECT_PRODUCT_${p.id}`,
          title: p.name.slice(0, 20),
        }))
      );
      await updateState(db, phone, { current_step: "collecting_product", ...updates });
      return;
    }
  }

  if (intent.quantity && !state.draft_quantity) {
    updates.draft_quantity = intent.quantity;
  }

  if (intent.location && !state.draft_location) {
    updates.draft_location = intent.location;
  }

  if (intent.paymentMethod && !state.draft_payment_method) {
    updates.draft_payment_method = intent.paymentMethod;
  }

  // Set draft_started_at on first save
  if (!state.draft_started_at && Object.keys(updates).length > 0) {
    updates.draft_started_at = new Date().toISOString();
  }

  // Persist merged updates
  await updateState(db, phone, updates);

  // Re-read the updated state to check completeness
  const merged: ConversationState = { ...state, ...updates };

  // ── Check what is still missing ───────────────────────────────────────────
  if (!merged.draft_product_id) {
    await updateState(db, phone, { current_step: "collecting_product" });
    await sendText(
      phone,
      "Which product would you like to order? Please tell me the product name. 😊"
    );
    return;
  }

  if (!merged.draft_quantity) {
    await updateState(db, phone, { current_step: "collecting_qty" });
    await sendText(phone, `How many units of *${merged.draft_product_name}* would you like?`);
    return;
  }

  if (!merged.draft_location) {
    await updateState(db, phone, { current_step: "collecting_location" });
    await sendText(
      phone,
      "Where should we deliver it? Please share your city and area (e.g., *Colombo 7* or *Kandy, Peradeniya*)."
    );
    return;
  }

  // ── All required fields collected — show confirmation ──────────────────────
  await sendOrderConfirmation(db, phone, merged);
}

// ─── Cancel Handler ───────────────────────────────────────────────────────────
export async function handleCancel(db: SupabaseClient, phone: string): Promise<void> {
  await resetState(db, phone);
  await sendText(
    phone,
    "No problem! Your order has been cancelled. 😊 Feel free to browse our products or start a new order anytime."
  );
}

// ─── Product Selection Handler (from List/Button) ─────────────────────────────
export async function handleProductSelection(
  db: SupabaseClient,
  phone: string,
  productId: string,
  state: ConversationState
): Promise<void> {
  const { data: product } = await db
    .from("products")
    .select("id, name, sku, selling_price")
    .eq("id", productId)
    .single();

  if (!product) {
    await sendText(phone, "Sorry, that product is no longer available. Please choose another.");
    return;
  }

  await updateState(db, phone, {
    draft_product_id:   product.id,
    draft_product_name: product.name,
    draft_product_sku:  product.sku,
    draft_unit_price:   product.selling_price,
    draft_started_at:   state.draft_started_at ?? new Date().toISOString(),
    current_step:       "collecting_qty",
  });

  await sendText(
    phone,
    `Great choice! *${product.name}* (${formatPrice(product.selling_price)} each).\n\nHow many would you like to order?`
  );
}

// ─── Order Execution ───────────────────────────────────────────────────────────
/**
 * The final step. Called ONLY when the customer presses the "Confirm Order ✅" button.
 * This is the only code path that calls the create-order Edge Function.
 *
 * Guards:
 * - State must be "awaiting_confirmation" (prevents double execution)
 * - State is immediately set to "order_placed" before the API call (prevents race conditions)
 */
export async function executeOrder(
  db: SupabaseClient,
  phone: string,
  state: ConversationState
): Promise<void> {
  // Guard: must be in awaiting_confirmation step
  if (state.current_step !== "awaiting_confirmation") {
    console.warn(`executeOrder called but state is "${state.current_step}" for ${phone}`);
    return;
  }

  // Lock state immediately to prevent duplicate execution
  await updateState(db, phone, { current_step: "order_placed" });

  // Resolve or create wa_customer record
  let customerName = "WhatsApp Customer";
  const { data: waCustomer } = await db
    .from("wa_customers")
    .select("id, name, customer_id")
    .eq("phone", phone)
    .maybeSingle();

  if (waCustomer?.name) customerName = waCustomer.name;

  // Update last_seen
  await db.from("wa_customers").upsert(
    { phone, last_seen: new Date().toISOString() },
    { onConflict: "phone" }
  );

  const loc = parseLocation(state.draft_location ?? "Not specified");

  // Call the existing create-order Edge Function with service role key
  // It now uses the atomic Postgres function to prevent ghost orders
  const orderPayload = {
    order: {
      shipping_name:     customerName,
      shipping_phone:    phone,
      shipping_email:    null,
      shipping_district: loc.district,
      shipping_city:     loc.city,
      shipping_street:   loc.street,
      total:             state.draft_total ?? state.draft_unit_price ?? 0,
      order_status:      "pending",
    },
    items: [
      {
        product_id:   state.draft_product_id,
        product_name: state.draft_product_name,
        product_sku:  state.draft_product_sku,
        quantity:     state.draft_quantity ?? 1,
        unit_price:   state.draft_unit_price,
        total_price:  state.draft_total ?? state.draft_unit_price ?? 0,
      },
    ],
  };

  let orderNumber = "N/A";
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-order`, {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const result = await res.json();
    if (result.order?.order_number) {
      orderNumber = result.order.order_number;
    } else {
      throw new Error(result.error ?? "Unknown error from create-order");
    }
  } catch (err) {
    console.error("create-order failed:", err);
    // Roll back the state so the customer can retry
    await updateState(db, phone, { current_step: "awaiting_confirmation" });
    await sendText(
      phone,
      "Sorry, something went wrong while placing your order. 😔 Please tap *Confirm Order* again or contact our support."
    );
    return;
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  await db.from("audit_logs").insert({
    action:    "whatsapp_order_created",
    resource:  "orders",
    details:   { order_number: orderNumber, phone, product: state.draft_product_name },
    level:     "info",
    user_name: customerName,
    user_role: "customer",
  }).catch(() => {}); // Audit log failure must never block the order success message

  // Reset state for next conversation
  await resetState(db, phone);

  await sendText(
    phone,
    `✅ Your order *#${orderNumber}* has been placed successfully!\n\n` +
    `📦 ${state.draft_product_name} x${state.draft_quantity ?? 1}\n` +
    `📍 Delivering to: ${state.draft_location}\n\n` +
    `Our team will contact you soon to confirm delivery. Thank you for shopping with SellMate! 🙏`
  );
}
