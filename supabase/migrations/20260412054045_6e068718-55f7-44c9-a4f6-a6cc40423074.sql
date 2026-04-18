-- Customers table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    order_count INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC NOT NULL DEFAULT 0,
    average_order_value NUMERIC NOT NULL DEFAULT 0,
    cod_rejection_count INTEGER NOT NULL DEFAULT 0,
    cod_rejection_rate NUMERIC NOT NULL DEFAULT 0,
    risk_score TEXT NOT NULL DEFAULT 'low',
    preferred_payment TEXT,
    is_blocked BOOLEAN NOT NULL DEFAULT false,
    blocked_reason TEXT,
    tags TEXT[] DEFAULT '{}',
    last_order_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer addresses table
CREATE TABLE public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    label TEXT NOT NULL DEFAULT 'Home',
    recipient_name TEXT,
    phone TEXT,
    district TEXT NOT NULL,
    city TEXT NOT NULL,
    street TEXT NOT NULL,
    postal_code TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    delivery_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customer notes table
CREATE TABLE public.customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    created_by TEXT NOT NULL DEFAULT 'Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_risk_score ON public.customers(risk_score);
CREATE INDEX idx_customers_is_blocked ON public.customers(is_blocked);
CREATE INDEX idx_customer_addresses_customer_id ON public.customer_addresses(customer_id);
CREATE INDEX idx_customer_notes_customer_id ON public.customer_notes(customer_id);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- Customers RLS
CREATE POLICY "Admins can manage customers"
    ON public.customers FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can read customers"
    ON public.customers FOR SELECT TO authenticated
    USING (
        public.has_role(auth.uid(), 'manager') OR 
        public.has_role(auth.uid(), 'staff') OR 
        public.has_role(auth.uid(), 'cashier')
    );

-- Customer addresses RLS
CREATE POLICY "Admins can manage customer addresses"
    ON public.customer_addresses FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can read customer addresses"
    ON public.customer_addresses FOR SELECT TO authenticated
    USING (
        public.has_role(auth.uid(), 'manager') OR 
        public.has_role(auth.uid(), 'staff') OR 
        public.has_role(auth.uid(), 'cashier')
    );

-- Customer notes RLS
CREATE POLICY "Admins can manage customer notes"
    ON public.customer_notes FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can read customer notes"
    ON public.customer_notes FOR SELECT TO authenticated
    USING (
        public.has_role(auth.uid(), 'manager') OR 
        public.has_role(auth.uid(), 'staff')
    );

CREATE POLICY "Staff can create customer notes"
    ON public.customer_notes FOR INSERT TO authenticated
    WITH CHECK (
        public.has_role(auth.uid(), 'manager') OR 
        public.has_role(auth.uid(), 'staff')
    );

-- Updated_at trigger
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();