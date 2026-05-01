-- ============================================================
-- Migration: Add missing columns to suppliers table
-- Date: 2026-05-01
-- ============================================================

-- Add payment_terms and total_spent to suppliers if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='suppliers' AND column_name='payment_terms') THEN
        ALTER TABLE public.suppliers ADD COLUMN payment_terms TEXT DEFAULT 'Net 30';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='suppliers' AND column_name='total_spent') THEN
        ALTER TABLE public.suppliers ADD COLUMN total_spent NUMERIC DEFAULT 0;
    END IF;
END $$;
