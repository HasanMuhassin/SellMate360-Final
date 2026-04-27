-- 1. Add missing resource_id column to audit_logs table
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS resource_id TEXT;

-- 2. Corrected Insert Example (PostgreSQL Trigger)
CREATE OR REPLACE FUNCTION log_system_action()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Try to get the current user ID and email from Supabase auth context
  v_user_id := auth.uid();
  v_user_email := current_setting('request.jwt.claims', true)::json->>'email';

  INSERT INTO public.audit_logs (
    user_id, 
    user_name, 
    action, 
    resource, 
    resource_id,  -- Now this column exists and won't throw an error!
    details, 
    level
  ) VALUES (
    v_user_id,
    COALESCE(v_user_email, 'System'),
    TG_OP, -- 'INSERT', 'UPDATE', or 'DELETE'
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text), -- Converted to TEXT to handle both UUIDs and integers
    jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)),
    (CASE WHEN TG_OP = 'DELETE' THEN 'critical' ELSE 'info' END)::audit_level
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
