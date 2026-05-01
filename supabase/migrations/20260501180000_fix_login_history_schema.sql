-- =====================================================
-- FIX LOGIN HISTORY SCHEMA
-- =====================================================

-- The frontend attempts to insert these columns, which do not exist in the initial schema.
-- This migration adds the missing columns and drops the NOT NULL constraint on user_id,
-- because a failed login attempt for a non-existent email will not have a valid user_id.

ALTER TABLE public.login_history
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS user_name TEXT,
    ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS failure_reason TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE public.login_history ALTER COLUMN user_id DROP NOT NULL;
