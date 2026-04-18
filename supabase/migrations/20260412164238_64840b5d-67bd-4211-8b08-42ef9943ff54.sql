-- Create integrations table
CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'payment',
  description TEXT,
  icon TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected',
  configured_at TIMESTAMPTZ,
  credentials JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage integrations"
  ON public.integrations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Managers can read
CREATE POLICY "Managers can read integrations"
  ON public.integrations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'manager'));

-- Timestamp trigger
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();