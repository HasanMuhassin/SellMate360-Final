-- =====================================================
-- WHATSAPP INTEGRATION TABLES
-- =====================================================

-- Stores all raw incoming messages from Meta.
-- The UNIQUE constraint on message_id serves as the idempotency key,
-- silently preventing duplicate webhook delivery from creating duplicate rows.
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id     TEXT NOT NULL UNIQUE,        -- Meta's unique message ID (dedup key)
  from_phone     TEXT NOT NULL,               -- Customer's phone (E.164 format e.g. 94771234567)
  message_type   TEXT NOT NULL DEFAULT 'text', -- 'text', 'interactive', 'image', 'audio', etc.
  body           TEXT,                         -- Raw message text content
  button_payload TEXT,                         -- button_reply.id from interactive messages
  raw_payload    JSONB,                        -- Full Meta webhook payload (for debugging)
  processed      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_messages_phone     ON public.whatsapp_messages(from_phone);
CREATE INDEX idx_wa_messages_processed ON public.whatsapp_messages(processed);
CREATE INDEX idx_wa_messages_created   ON public.whatsapp_messages(created_at DESC);

-- No RLS needed — this table is only accessed by service role (Edge Functions).
-- No public access. Edge Functions use EXTERNAL_SUPABASE_SERVICE_ROLE_KEY.

-- =====================================================

-- Tracks per-customer conversation state and draft order data.
-- One row per WhatsApp phone number. Upserted on each message.
CREATE TABLE IF NOT EXISTS public.wa_conversation_state (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone                TEXT NOT NULL UNIQUE,

  -- Draft order fields (prices always sourced from DB, never from AI text)
  draft_product_id     UUID REFERENCES public.products(id) ON DELETE SET NULL,
  draft_product_name   TEXT,
  draft_product_sku    TEXT,
  draft_quantity       INTEGER,
  draft_location       TEXT,                   -- Free-text delivery area from customer
  draft_payment_method TEXT DEFAULT 'cod',     -- 'cod' | 'card' | 'online'
  draft_unit_price     NUMERIC(12,2),          -- Set by DB lookup, NEVER by AI
  draft_total          NUMERIC(12,2),
  draft_started_at     TIMESTAMPTZ,            -- Used for TTL expiry (6h)

  -- Conversation flow step
  -- idle | collecting_product | collecting_qty | collecting_location |
  -- collecting_payment | awaiting_confirmation | order_placed
  current_step         TEXT NOT NULL DEFAULT 'idle',

  -- Metadata
  last_message_at      TIMESTAMPTZ DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_state_phone ON public.wa_conversation_state(phone);

-- =====================================================

-- Identity bridge: maps a WhatsApp phone number to a SellMate customer record.
-- WhatsApp users have no Supabase Auth account, so we cannot use get-or-create-customer.
-- This table provides the equivalent mapping for the WhatsApp channel.
CREATE TABLE IF NOT EXISTS public.wa_customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL UNIQUE,
  name        TEXT,                              -- Provided by the customer during conversation
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  first_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_customers_phone ON public.wa_customers(phone);

-- =====================================================
-- TRIGGER: auto-update updated_at on wa_conversation_state
-- =====================================================
CREATE TRIGGER update_wa_state_updated_at
  BEFORE UPDATE ON public.wa_conversation_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
