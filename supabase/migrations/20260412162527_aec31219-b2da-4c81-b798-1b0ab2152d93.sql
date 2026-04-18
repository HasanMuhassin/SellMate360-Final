-- Create the audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  level TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage audit logs"
  ON public.audit_logs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Staff can read
CREATE POLICY "Staff can read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'staff'::app_role)
  );

-- Service role can insert (for edge functions)
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs (resource);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);