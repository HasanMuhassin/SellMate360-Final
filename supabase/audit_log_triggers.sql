-- 1. Create a generic audit log trigger function
CREATE OR REPLACE FUNCTION log_system_action()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Try to get the current user ID from Supabase auth context
  v_user_id := auth.uid();
  v_user_email := current_setting('request.jwt.claims', true)::json->>'email';

  INSERT INTO public.audit_logs (
    user_id, 
    user_name, 
    action, 
    resource, 
    resource_id, 
    details, 
    level
  ) VALUES (
    v_user_id,
    COALESCE(v_user_email, 'System'),
    TG_OP, -- 'INSERT', 'UPDATE', or 'DELETE'
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END,
    jsonb_build_object(
      'old', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END, 
      'new', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    ),
    (CASE WHEN TG_OP = 'DELETE' THEN 'critical' ELSE 'info' END)::audit_level
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to important tables (e.g., orders, products)
DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH ROW EXECUTE FUNCTION log_system_action();

DROP TRIGGER IF EXISTS audit_products_trigger ON public.products;
CREATE TRIGGER audit_products_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION log_system_action();

-- 3. Ensure correct RLS policies for reading logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage audit logs" ON public.audit_logs;
CREATE POLICY "Admins can manage audit logs"
  ON public.audit_logs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Staff can read audit logs" ON public.audit_logs;
CREATE POLICY "Staff can read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'staff'::app_role)
  );
