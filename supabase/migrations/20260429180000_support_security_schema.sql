-- =====================================================
-- ADMIN SUPPORT & SECURITY MODULES SCHEMA
-- =====================================================

-- 1. Support Ticket Messages (for chat thread)
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin', 'system')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for support_ticket_messages
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to messages" ON public.support_ticket_messages;
CREATE POLICY "Allow authenticated access to messages" ON public.support_ticket_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Audit Logs (for security)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    level TEXT DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error', 'critical')),
    user_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to audit_logs" ON public.audit_logs;
CREATE POLICY "Allow authenticated access to audit_logs" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Security Logins Tracking
CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    location TEXT,
    status TEXT DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for login_history
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to login_history" ON public.login_history;
CREATE POLICY "Allow authenticated access to login_history" ON public.login_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Role Changes Tracking
CREATE TABLE IF NOT EXISTS public.role_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_user_id UUID NOT NULL,
    target_user_name TEXT,
    target_user_email TEXT,
    previous_role TEXT,
    new_role TEXT NOT NULL,
    changed_by_user_id UUID NOT NULL,
    changed_by_user_name TEXT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for role_changes
ALTER TABLE public.role_changes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to role_changes" ON public.role_changes;
CREATE POLICY "Allow authenticated access to role_changes" ON public.role_changes FOR ALL TO authenticated USING (true) WITH CHECK (true);
