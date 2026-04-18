-- =====================================================
-- SELLMATE360 DATABASE SCHEMA
-- Migration 008: Payment Management
-- =====================================================

-- Payment transactions table
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    
    amount DECIMAL(12, 2) NOT NULL,
    method public.payment_method NOT NULL,
    status public.payment_status DEFAULT 'pending',
    
    -- Bank transfer details
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    reference_number VARCHAR(100),
    slip_image_url TEXT,
    
    -- Online payment details
    gateway VARCHAR(50),  -- stripe, payhere, etc.
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    
    -- Card details (masked)
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20),
    
    -- Verification
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Refund tracking
    refunded_amount DECIMAL(12, 2) DEFAULT 0,
    refunded_at TIMESTAMPTZ,
    refund_reason TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- COD collections tracking
CREATE TABLE public.cod_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
    
    amount DECIMAL(12, 2) NOT NULL,
    courier_id UUID REFERENCES public.courier_partners(id) ON DELETE SET NULL,
    tracking_number VARCHAR(100),
    
    status public.cod_status DEFAULT 'pending',
    
    -- Collection details
    collected_at TIMESTAMPTZ,
    collected_by VARCHAR(255),
    
    -- Remittance details
    remitted_at TIMESTAMPTZ,
    remittance_reference VARCHAR(100),
    remittance_amount DECIMAL(12, 2),
    courier_fee DECIMAL(12, 2),
    
    -- Rejection handling
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Refund requests table
CREATE TABLE public.refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    
    amount DECIMAL(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    
    -- Original payment info
    original_payment_method public.payment_method NOT NULL,
    
    -- Refund method
    refund_method public.payment_method NOT NULL,
    
    -- Bank details for refund (if applicable)
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    account_holder VARCHAR(255),
    
    status public.payout_status DEFAULT 'pending',
    
    -- Processing
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Daily settlement/reconciliation
CREATE TABLE public.daily_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_date DATE NOT NULL UNIQUE,
    
    -- Sales summary
    total_online_sales DECIMAL(12, 2) DEFAULT 0,
    total_pos_sales DECIMAL(12, 2) DEFAULT 0,
    total_sales DECIMAL(12, 2) DEFAULT 0,
    
    -- Payment method breakdown
    cash_collected DECIMAL(12, 2) DEFAULT 0,
    card_collected DECIMAL(12, 2) DEFAULT 0,
    bank_transfers DECIMAL(12, 2) DEFAULT 0,
    online_payments DECIMAL(12, 2) DEFAULT 0,
    cod_pending DECIMAL(12, 2) DEFAULT 0,
    
    -- Deductions
    refunds DECIMAL(12, 2) DEFAULT 0,
    courier_fees DECIMAL(12, 2) DEFAULT 0,
    gateway_fees DECIMAL(12, 2) DEFAULT 0,
    
    -- Net
    net_revenue DECIMAL(12, 2) DEFAULT 0,
    
    -- Status
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reconciled_at TIMESTAMPTZ,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_method ON public.payment_transactions(method);
CREATE INDEX idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

CREATE INDEX idx_cod_collections_order_id ON public.cod_collections(order_id);
CREATE INDEX idx_cod_collections_courier_id ON public.cod_collections(courier_id);
CREATE INDEX idx_cod_collections_status ON public.cod_collections(status);
CREATE INDEX idx_cod_collections_created_at ON public.cod_collections(created_at DESC);

CREATE INDEX idx_refund_requests_order_id ON public.refund_requests(order_id);
CREATE INDEX idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX idx_refund_requests_created_at ON public.refund_requests(created_at DESC);

CREATE INDEX idx_daily_settlements_date ON public.daily_settlements(settlement_date DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update order payment status on payment verification
CREATE OR REPLACE FUNCTION public.sync_order_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'paid' OR NEW.status = 'verified' THEN
        UPDATE public.orders SET payment_status = 'paid' WHERE id = NEW.order_id;
    ELSIF NEW.status = 'refunded' THEN
        UPDATE public.orders SET payment_status = 'refunded' WHERE id = NEW.order_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_payment_status_change
    AFTER UPDATE OF status ON public.payment_transactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_order_payment_status();

-- Update COD collection on delivery
CREATE OR REPLACE FUNCTION public.create_cod_collection_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    order_payment_method public.payment_method;
    order_total DECIMAL(12, 2);
BEGIN
    SELECT payment_method, total INTO order_payment_method, order_total
    FROM public.orders WHERE id = NEW.order_id;
    
    IF NEW.status = 'delivered' AND order_payment_method = 'cod' THEN
        INSERT INTO public.cod_collections (order_id, shipment_id, amount, courier_id, tracking_number, status, collected_at)
        VALUES (NEW.order_id, NEW.id, order_total, NEW.courier_id, NEW.tracking_number, 'collected', NOW())
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_delivery_create_cod_collection
    AFTER UPDATE OF status ON public.shipments
    FOR EACH ROW WHEN (NEW.status = 'delivered')
    EXECUTE FUNCTION public.create_cod_collection_on_delivery();

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cod_collections_updated_at
    BEFORE UPDATE ON public.cod_collections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_refund_requests_updated_at
    BEFORE UPDATE ON public.refund_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_settlements_updated_at
    BEFORE UPDATE ON public.daily_settlements
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
