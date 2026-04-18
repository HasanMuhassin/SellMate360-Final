import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ConversationState {
  id:                   string;
  phone:                string;
  draft_product_id:     string | null;
  draft_product_name:   string | null;
  draft_product_sku:    string | null;
  draft_quantity:       number | null;
  draft_location:       string | null;
  draft_payment_method: string | null;
  draft_unit_price:     number | null;
  draft_total:          number | null;
  draft_started_at:     string | null;
  current_step:         string;
  last_message_at:      string;
}

export type ConversationStep =
  | "idle"
  | "collecting_product"
  | "collecting_qty"
  | "collecting_location"
  | "collecting_payment"
  | "awaiting_confirmation"
  | "order_placed";

// ─── Read State ───────────────────────────────────────────────────────────────
/**
 * Loads the current conversation state for a phone number.
 * Returns a default "idle" state if no record exists yet.
 */
export async function getState(
  db: SupabaseClient,
  phone: string
): Promise<ConversationState> {
  const { data } = await db
    .from("wa_conversation_state")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  if (data) return data as ConversationState;

  // First-time user — return default empty state
  return {
    id:                   "",
    phone,
    draft_product_id:     null,
    draft_product_name:   null,
    draft_product_sku:    null,
    draft_quantity:       null,
    draft_location:       null,
    draft_payment_method: null,
    draft_unit_price:     null,
    draft_total:          null,
    draft_started_at:     null,
    current_step:         "idle",
    last_message_at:      new Date().toISOString(),
  };
}

// ─── Update State ─────────────────────────────────────────────────────────────
/**
 * Upserts the conversation state for a phone number.
 * Only provided fields are updated; existing fields are preserved.
 */
export async function updateState(
  db: SupabaseClient,
  phone: string,
  updates: Partial<ConversationState>
): Promise<void> {
  await db
    .from("wa_conversation_state")
    .upsert(
      { phone, ...updates, last_message_at: new Date().toISOString() },
      { onConflict: "phone" }
    );
}

// ─── Reset State ──────────────────────────────────────────────────────────────
/**
 * Clears the draft order fields and resets step to "idle".
 * Called after a successful order placement or when the user cancels.
 */
export async function resetState(
  db: SupabaseClient,
  phone: string
): Promise<void> {
  await db
    .from("wa_conversation_state")
    .upsert(
      {
        phone,
        draft_product_id:     null,
        draft_product_name:   null,
        draft_product_sku:    null,
        draft_quantity:       null,
        draft_location:       null,
        draft_payment_method: null,
        draft_unit_price:     null,
        draft_total:          null,
        draft_started_at:     null,
        current_step:         "idle",
        last_message_at:      new Date().toISOString(),
      },
      { onConflict: "phone" }
    );
}

// ─── Draft Expiry Check ───────────────────────────────────────────────────────
const DRAFT_TTL_HOURS = 6;

/**
 * Returns true if the draft order has been sitting idle for longer
 * than DRAFT_TTL_HOURS. Prices or stock may have changed since.
 */
export function isDraftExpired(state: ConversationState): boolean {
  if (!state.draft_started_at) return false;
  const startedAt = new Date(state.draft_started_at).getTime();
  const now       = Date.now();
  return (now - startedAt) > DRAFT_TTL_HOURS * 60 * 60 * 1000;
}

// ─── Conversation History ─────────────────────────────────────────────────────
/**
 * Loads the last N messages for a phone number for AI context window.
 */
export async function getMessageHistory(
  db: SupabaseClient,
  phone: string,
  limit = 10
): Promise<Array<{ body: string | null; from_phone: string; created_at: string }>> {
  const { data } = await db
    .from("whatsapp_messages")
    .select("body, from_phone, created_at")
    .eq("from_phone", phone)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).reverse(); // oldest first for context
}
