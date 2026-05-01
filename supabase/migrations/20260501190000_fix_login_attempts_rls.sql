-- =====================================================
-- FIX: login_attempts RLS — Allow inserts from browser
-- =====================================================

-- The login_attempts table has RLS enabled but no INSERT policy,
-- so all browser inserts (even from authenticated users) are blocked.
-- Additionally, the anon role needs explicit GRANT privileges.
-- RLS policies are filters ON TOP of privileges, not replacements.

-- 1. Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- 2. Grant table-level privileges to both roles
GRANT INSERT ON public.login_attempts TO anon;
GRANT INSERT ON public.login_attempts TO authenticated;
GRANT SELECT ON public.login_attempts TO authenticated;

-- 3. RLS Policies
-- Allow anyone (anon + authenticated) to INSERT login attempts.
-- This is intentional: we want to record FAILED logins for non-existent
-- accounts too, where the user is not yet authenticated.
DROP POLICY IF EXISTS "Allow public insert to login_attempts" ON public.login_attempts;
CREATE POLICY "Allow public insert to login_attempts"
  ON public.login_attempts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow only authenticated users to SELECT (read) login history.
DROP POLICY IF EXISTS "Allow authenticated select on login_attempts" ON public.login_attempts;
CREATE POLICY "Allow authenticated select on login_attempts"
  ON public.login_attempts
  FOR SELECT
  TO authenticated
  USING (true);

