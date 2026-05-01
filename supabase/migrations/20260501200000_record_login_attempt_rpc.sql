-- =====================================================
-- FIX: record_login_attempt RPC (SECURITY DEFINER)
-- =====================================================
-- Using a SECURITY DEFINER function bypasses RLS entirely.
-- This is the correct approach for recording unauthenticated
-- failed login attempts, as the anon role cannot reliably
-- INSERT even with policies when the session is in a failed state.

CREATE OR REPLACE FUNCTION public.record_login_attempt(
  p_email      TEXT,
  p_success    BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success, failure_reason, user_agent)
  VALUES (p_email, p_success, p_failure_reason, p_user_agent);
END;
$$;

-- Allow anyone (anon + authenticated) to call this function
GRANT EXECUTE ON FUNCTION public.record_login_attempt(TEXT, BOOLEAN, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(TEXT, BOOLEAN, TEXT, TEXT) TO authenticated;
