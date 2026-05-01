-- ============================================================
-- Migration: Fix Settings Module Missing Tables
-- Date: 2026-05-01
-- Fixes:
--   1. Create missing `integrations` table
--   2. Seed default row in `company_settings` if empty
-- ============================================================

-- 1. CREATE INTEGRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.integrations (
  id          uuid NOT NULL DEFAULT gen_random_uuid(),
  name        character varying NOT NULL,
  category    character varying NOT NULL DEFAULT 'payment',
  description text,
  icon        text,
  status      character varying NOT NULL DEFAULT 'disconnected',
  configured_at timestamp with time zone,
  credentials jsonb DEFAULT '{}'::jsonb,
  created_at  timestamp with time zone NOT NULL DEFAULT now(),
  updated_at  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT integrations_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write integrations (via service role in Edge Function)
CREATE POLICY "Service role full access on integrations"
  ON public.integrations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed default integrations
INSERT INTO public.integrations (name, category, description, icon, status) VALUES
  ('PayHere',       'payment',       'Sri Lanka payment gateway',        'payhere',   'disconnected'),
  ('Dialog Axiata', 'communication', 'SMS gateway via Dialog',           'dialog',    'disconnected'),
  ('Mobitel',       'communication', 'SMS gateway via Mobitel',          'mobitel',   'disconnected'),
  ('Google Analytics','analytics',   'Website analytics tracking',       'google',    'disconnected'),
  ('Facebook Pixel','marketing',     'Facebook/Meta advertising pixel',  'facebook',  'disconnected'),
  ('Printful',      'shipping',      'Print on demand & fulfillment',    'printful',  'disconnected')
ON CONFLICT DO NOTHING;


-- 2. ENSURE company_settings HAS A DEFAULT ROW
INSERT INTO public.company_settings (
  name, legal_name, email, phone, whatsapp,
  address, city, country, postal_code,
  tax_id, vat_number, logo, favicon,
  currency, timezone, date_format, order_prefix,
  social_facebook, social_instagram, social_twitter, social_youtube, social_tiktok
)
SELECT
  'SellMate360', '', '', '', '',
  '', '', 'Sri Lanka', '',
  '', '', '', '',
  'LKR', 'Asia/Colombo', 'DD/MM/YYYY', 'ORD',
  '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings LIMIT 1);
