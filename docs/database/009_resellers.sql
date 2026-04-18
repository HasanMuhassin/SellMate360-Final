-- =====================================================
-- SELLMATE360 DATABASE SCHEMA
-- Migration 009: Reseller Management
-- =====================================================

-- Resellers table
CREATE TABLE public.resellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Business info
    business_name VARCHAR(255) NOT NULL,
    business_registration VARCHAR(100),
    tax_id VARCHAR(50),
    
    -- Contact
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    
    -- Tier & Status
    tier public.reseller_tier DEFAULT 'silver',
    status public.approval_status DEFAULT 'pending',
    
    -- Performance metrics
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    total_profit DECIMAL(12, 2) DEFAULT 0,
    cod_rejection_count INTEGER DEFAULT 0,
    cod_rejection_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Commission
    commission_rate DECIMAL(5, 2) DEFAULT 0,
    
    -- Balance
    available_balance DECIMAL(12, 2) DEFAULT 0,
    pending_balance DECIMAL(12, 2) DEFAULT 0,
    total_withdrawn DECIMAL(12, 2) DEFAULT 0,
    
    -- Approval
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    blocked_reason TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Reseller orders (orders placed by resellers on behalf of customers)
CREATE TABLE public.reseller_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES public.resellers(id) ON DELETE RESTRICT NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Profit calculation
    reseller_price DECIMAL(12, 2) NOT NULL,  -- What reseller pays
    selling_price DECIMAL(12, 2) NOT NULL,   -- What customer pays
    profit DECIMAL(12, 2) NOT NULL,          -- Difference
    
    -- Commission
    commission_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Status
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Payout requests
CREATE TABLE public.payout_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES public.resellers(id) ON DELETE RESTRICT NOT NULL,
    
    amount DECIMAL(12, 2) NOT NULL,
    
    -- Bank details
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder VARCHAR(255) NOT NULL,
    branch VARCHAR(100),
    
    status public.payout_status DEFAULT 'pending',
    
    -- Processing
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    
    -- Payment reference
    payment_reference VARCHAR(100),
    payment_proof_url TEXT,
    
    rejection_reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Reseller ledger (profit tracking)
CREATE TABLE public.reseller_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reseller_id UUID REFERENCES public.resellers(id) ON DELETE CASCADE NOT NULL,
    
    type VARCHAR(50) NOT NULL,  -- order_profit, payout, adjustment, cod_penalty
    reference_id UUID,          -- order_id or payout_id
    reference_number VARCHAR(50),
    
    credit DECIMAL(12, 2) DEFAULT 0,
    debit DECIMAL(12, 2) DEFAULT 0,
    balance DECIMAL(12, 2) NOT NULL,
    
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Reseller tier benefits
CREATE TABLE public.reseller_tier_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier public.reseller_tier NOT NULL UNIQUE,
    
    discount_percentage DECIMAL(5, 2) NOT NULL,
    min_order_value DECIMAL(12, 2) DEFAULT 0,
    max_cod_percentage DECIMAL(5, 2) DEFAULT 100,
    priority_support BOOLEAN DEFAULT false,
    free_shipping_threshold DECIMAL(12, 2),
    
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_resellers_user_id ON public.resellers(user_id);
CREATE INDEX idx_resellers_status ON public.resellers(status);
CREATE INDEX idx_resellers_tier ON public.resellers(tier);

CREATE INDEX idx_reseller_orders_reseller_id ON public.reseller_orders(reseller_id);
CREATE INDEX idx_reseller_orders_order_id ON public.reseller_orders(order_id);

CREATE INDEX idx_payout_requests_reseller_id ON public.payout_requests(reseller_id);
CREATE INDEX idx_payout_requests_status ON public.payout_requests(status);
CREATE INDEX idx_payout_requests_created_at ON public.payout_requests(created_at DESC);

CREATE INDEX idx_reseller_ledger_reseller_id ON public.reseller_ledger(reseller_id);
CREATE INDEX idx_reseller_ledger_created_at ON public.reseller_ledger(created_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update reseller stats on order completion
CREATE OR REPLACE FUNCTION public.update_reseller_stats_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    order_status public.order_status;
BEGIN
    SELECT o.order_status INTO order_status
    FROM public.orders o WHERE o.id = NEW.order_id;
    
    IF order_status = 'delivered' THEN
        UPDATE public.resellers
        SET 
            total_orders = total_orders + 1,
            total_revenue = total_revenue + NEW.selling_price,
            total_profit = total_profit + NEW.profit,
            available_balance = available_balance + NEW.profit,
            updated_at = NOW()
        WHERE id = NEW.reseller_id;
        
        -- Add to ledger
        INSERT INTO public.reseller_ledger (reseller_id, type, reference_id, reference_number, credit, balance, description)
        SELECT 
            NEW.reseller_id, 
            'order_profit', 
            NEW.order_id, 
            o.order_number,
            NEW.profit,
            (SELECT available_balance FROM public.resellers WHERE id = NEW.reseller_id),
            'Profit from order ' || o.order_number
        FROM public.orders o WHERE o.id = NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Deduct balance on payout
CREATE OR REPLACE FUNCTION public.process_payout_request()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        UPDATE public.resellers
        SET 
            available_balance = available_balance - NEW.amount,
            total_withdrawn = total_withdrawn + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.reseller_id;
        
        -- Add to ledger
        INSERT INTO public.reseller_ledger (reseller_id, type, reference_id, debit, balance, description)
        VALUES (
            NEW.reseller_id, 
            'payout', 
            NEW.id, 
            NEW.amount,
            (SELECT available_balance FROM public.resellers WHERE id = NEW.reseller_id),
            'Payout processed - Ref: ' || COALESCE(NEW.payment_reference, 'N/A')
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_payout_processed
    AFTER UPDATE OF status ON public.payout_requests
    FOR EACH ROW EXECUTE FUNCTION public.process_payout_request();

-- Update profile is_reseller flag
CREATE OR REPLACE FUNCTION public.sync_reseller_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'approved' THEN
        UPDATE public.profiles SET is_reseller = true WHERE user_id = NEW.user_id;
    ELSIF NEW.status = 'blocked' OR NEW.status = 'rejected' THEN
        UPDATE public.profiles SET is_reseller = false WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_reseller_status_change
    AFTER UPDATE OF status ON public.resellers
    FOR EACH ROW EXECUTE FUNCTION public.sync_reseller_profile();

CREATE TRIGGER update_resellers_updated_at
    BEFORE UPDATE ON public.resellers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payout_requests_updated_at
    BEFORE UPDATE ON public.payout_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SEED DEFAULT TIER BENEFITS
-- =====================================================
INSERT INTO public.reseller_tier_benefits (tier, discount_percentage, min_order_value, max_cod_percentage, priority_support, free_shipping_threshold, description)
VALUES 
    ('silver', 10.00, 5000, 80, false, 10000, 'Entry level reseller tier'),
    ('gold', 15.00, 3000, 90, true, 7500, 'Established reseller tier'),
    ('platinum', 20.00, 0, 100, true, 5000, 'Premium reseller tier with maximum benefits')
ON CONFLICT (tier) DO NOTHING;
