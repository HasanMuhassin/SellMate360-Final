-- Create payments table to track financial transactions for orders
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount       DECIMAL(12, 2) NOT NULL,
    method       TEXT NOT NULL CHECK (method IN ('cod', 'bank', 'card', 'online')),
    status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'collected', 'remitted', 'rejected', 'refunded')),
    reference    TEXT,
    evidence_url TEXT, -- For bank slips
    notes        TEXT,
    verified_by  UUID REFERENCES auth.users(id),
    verified_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT now(),
    updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payments" ON public.payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Customers can view their own payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = payments.order_id AND customer_id = auth.uid()
        )
    );

-- Log creation of payments table in the audit log (optional but good practice)
COMMENT ON TABLE public.payments IS 'Table for tracking order payments and financial verification states.';
