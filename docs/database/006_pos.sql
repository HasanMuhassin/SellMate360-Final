-- =====================================================
-- SELLMATE360 DATABASE SCHEMA
-- Migration 006: POS (Point of Sale) Module
-- =====================================================

-- Cashier shifts table
CREATE TABLE public.cashier_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT NOT NULL,
    branch_id UUID,  -- Will reference branches table
    
    opening_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(12, 2),
    expected_balance DECIMAL(12, 2),
    variance DECIMAL(12, 2),
    
    cash_sales DECIMAL(12, 2) DEFAULT 0,
    card_sales DECIMAL(12, 2) DEFAULT 0,
    total_sales DECIMAL(12, 2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    refunds DECIMAL(12, 2) DEFAULT 0,
    
    status public.shift_status DEFAULT 'open',
    notes TEXT,
    
    opened_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- POS transactions table
CREATE TABLE public.pos_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    shift_id UUID REFERENCES public.cashier_shifts(id) ON DELETE RESTRICT NOT NULL,
    cashier_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    
    subtotal DECIMAL(12, 2) NOT NULL,
    discount DECIMAL(12, 2) DEFAULT 0,
    discount_type VARCHAR(20),
    discount_value DECIMAL(12, 2),
    tax DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    
    payment_method public.payment_method NOT NULL,
    cash_received DECIMAL(12, 2),
    change_given DECIMAL(12, 2),
    card_last_four VARCHAR(4),
    
    -- Split payment support
    is_split_payment BOOLEAN DEFAULT false,
    cash_amount DECIMAL(12, 2),
    card_amount DECIMAL(12, 2),
    
    status public.pos_transaction_status DEFAULT 'completed',
    voided_reason TEXT,
    voided_at TIMESTAMPTZ,
    voided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- POS transaction items
CREATE TABLE public.pos_transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.pos_transactions(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    
    product_sku VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    discount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- POS returns table
CREATE TABLE public.pos_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number VARCHAR(50) NOT NULL UNIQUE,
    original_transaction_id UUID REFERENCES public.pos_transactions(id) ON DELETE RESTRICT NOT NULL,
    original_receipt VARCHAR(50) NOT NULL,
    shift_id UUID REFERENCES public.cashier_shifts(id) ON DELETE RESTRICT NOT NULL,
    
    refund_amount DECIMAL(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    refund_method public.refund_method NOT NULL,
    
    -- Exchange tracking
    is_exchange BOOLEAN DEFAULT false,
    exchange_transaction_id UUID REFERENCES public.pos_transactions(id) ON DELETE SET NULL,
    
    status public.return_status DEFAULT 'pending',
    rejection_reason TEXT,
    
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- POS return items
CREATE TABLE public.pos_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES public.pos_returns(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    
    product_name VARCHAR(255) NOT NULL,
    original_quantity INTEGER NOT NULL,
    return_quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    refund_amount DECIMAL(12, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_cashier_shifts_cashier_id ON public.cashier_shifts(cashier_id);
CREATE INDEX idx_cashier_shifts_status ON public.cashier_shifts(status);
CREATE INDEX idx_cashier_shifts_opened_at ON public.cashier_shifts(opened_at DESC);

CREATE INDEX idx_pos_transactions_receipt_number ON public.pos_transactions(receipt_number);
CREATE INDEX idx_pos_transactions_shift_id ON public.pos_transactions(shift_id);
CREATE INDEX idx_pos_transactions_cashier_id ON public.pos_transactions(cashier_id);
CREATE INDEX idx_pos_transactions_status ON public.pos_transactions(status);
CREATE INDEX idx_pos_transactions_created_at ON public.pos_transactions(created_at DESC);

CREATE INDEX idx_pos_transaction_items_transaction_id ON public.pos_transaction_items(transaction_id);
CREATE INDEX idx_pos_transaction_items_product_id ON public.pos_transaction_items(product_id);

CREATE INDEX idx_pos_returns_original_transaction_id ON public.pos_returns(original_transaction_id);
CREATE INDEX idx_pos_returns_shift_id ON public.pos_returns(shift_id);
CREATE INDEX idx_pos_returns_status ON public.pos_returns(status);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    today_date VARCHAR(8);
    next_num INTEGER;
BEGIN
    today_date = TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 13) AS INTEGER)), 0) + 1 
    INTO next_num 
    FROM public.pos_transactions
    WHERE receipt_number LIKE 'RCP-' || today_date || '-%';
    
    NEW.receipt_number = 'RCP-' || today_date || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER generate_pos_receipt_number
    BEFORE INSERT ON public.pos_transactions
    FOR EACH ROW WHEN (NEW.receipt_number IS NULL)
    EXECUTE FUNCTION public.generate_receipt_number();

-- Generate return number
CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM 5) AS INTEGER)), 0) + 1 
    INTO next_num 
    FROM public.pos_returns;
    
    NEW.return_number = 'RET-' || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER generate_pos_return_number
    BEFORE INSERT ON public.pos_returns
    FOR EACH ROW WHEN (NEW.return_number IS NULL)
    EXECUTE FUNCTION public.generate_return_number();

-- Update shift stats on transaction
CREATE OR REPLACE FUNCTION public.update_shift_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE public.cashier_shifts
        SET 
            transaction_count = transaction_count + 1,
            total_sales = total_sales + NEW.total,
            cash_sales = cash_sales + COALESCE(NEW.cash_amount, CASE WHEN NEW.payment_method = 'cash' THEN NEW.total ELSE 0 END),
            card_sales = card_sales + COALESCE(NEW.card_amount, CASE WHEN NEW.payment_method = 'card' THEN NEW.total ELSE 0 END)
        WHERE id = NEW.shift_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_pos_transaction_update_shift
    AFTER INSERT ON public.pos_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_shift_stats();

-- Deduct stock on POS sale
CREATE OR REPLACE FUNCTION public.deduct_stock_on_pos_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.stock_movements (product_id, type, quantity, reason, reference, created_by)
    VALUES (NEW.product_id, 'out', NEW.quantity, 'POS Sale', NEW.transaction_id::TEXT, 
            (SELECT cashier_id FROM public.pos_transactions WHERE id = NEW.transaction_id));
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_pos_item_deduct_stock
    AFTER INSERT ON public.pos_transaction_items
    FOR EACH ROW EXECUTE FUNCTION public.deduct_stock_on_pos_sale();
