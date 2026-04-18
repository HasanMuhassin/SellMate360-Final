
-- =====================================================
-- POS MODULE TABLES
-- =====================================================

-- Cashier shifts table
CREATE TABLE public.cashier_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_user_id UUID NOT NULL,
    opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    closing_balance NUMERIC(12, 2),
    expected_balance NUMERIC(12, 2),
    variance NUMERIC(12, 2),
    cash_sales NUMERIC(12, 2) DEFAULT 0,
    card_sales NUMERIC(12, 2) DEFAULT 0,
    total_sales NUMERIC(12, 2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    refunds NUMERIC(12, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open',
    notes TEXT,
    opened_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.cashier_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage shifts" ON public.cashier_shifts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can read all shifts" ON public.cashier_shifts
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'staff'::app_role) OR
    has_role(auth.uid(), 'cashier'::app_role)
  );

CREATE POLICY "Cashiers can open shifts" ON public.cashier_shifts
  FOR INSERT TO authenticated
  WITH CHECK (
    cashier_user_id = auth.uid() AND (
      has_role(auth.uid(), 'cashier'::app_role) OR
      has_role(auth.uid(), 'staff'::app_role) OR
      has_role(auth.uid(), 'manager'::app_role)
    )
  );

CREATE POLICY "Cashiers can update own shifts" ON public.cashier_shifts
  FOR UPDATE TO authenticated
  USING (
    cashier_user_id = auth.uid() OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  );

CREATE INDEX idx_cashier_shifts_cashier ON public.cashier_shifts(cashier_user_id);
CREATE INDEX idx_cashier_shifts_status ON public.cashier_shifts(status);
CREATE INDEX idx_cashier_shifts_opened_at ON public.cashier_shifts(opened_at DESC);

-- POS transactions table
CREATE TABLE public.pos_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT NOT NULL DEFAULT '',
    shift_id UUID REFERENCES public.cashier_shifts(id) ON DELETE RESTRICT NOT NULL,
    cashier_user_id UUID NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) DEFAULT 0,
    discount_type TEXT,
    discount_value NUMERIC(12, 2),
    total NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    cash_received NUMERIC(12, 2),
    change_given NUMERIC(12, 2),
    card_last_four TEXT,
    is_split_payment BOOLEAN DEFAULT false,
    cash_amount NUMERIC(12, 2),
    card_amount NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'completed',
    voided_reason TEXT,
    voided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage transactions" ON public.pos_transactions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can read transactions" ON public.pos_transactions
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'staff'::app_role) OR
    has_role(auth.uid(), 'cashier'::app_role)
  );

CREATE POLICY "Cashiers can create transactions" ON public.pos_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    cashier_user_id = auth.uid() AND (
      has_role(auth.uid(), 'cashier'::app_role) OR
      has_role(auth.uid(), 'staff'::app_role) OR
      has_role(auth.uid(), 'manager'::app_role)
    )
  );

CREATE INDEX idx_pos_transactions_receipt ON public.pos_transactions(receipt_number);
CREATE INDEX idx_pos_transactions_shift ON public.pos_transactions(shift_id);
CREATE INDEX idx_pos_transactions_cashier ON public.pos_transactions(cashier_user_id);
CREATE INDEX idx_pos_transactions_status ON public.pos_transactions(status);
CREATE INDEX idx_pos_transactions_created ON public.pos_transactions(created_at DESC);

-- Auto-generate receipt number
CREATE OR REPLACE FUNCTION public.generate_pos_receipt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    today_date TEXT;
    next_num INTEGER;
BEGIN
    today_date := TO_CHAR(NOW(), 'YYYYMMDD');
    
    SELECT COALESCE(MAX(
      CASE 
        WHEN receipt_number ~ ('^RCP-' || today_date || '-[0-9]+$')
        THEN CAST(SUBSTRING(receipt_number FROM LENGTH('RCP-' || today_date || '-') + 1) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1 
    INTO next_num 
    FROM public.pos_transactions
    WHERE receipt_number LIKE 'RCP-' || today_date || '-%';
    
    NEW.receipt_number := 'RCP-' || today_date || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER generate_receipt_number
    BEFORE INSERT ON public.pos_transactions
    FOR EACH ROW WHEN (NEW.receipt_number IS NULL OR NEW.receipt_number = '')
    EXECUTE FUNCTION public.generate_pos_receipt_number();

-- POS transaction items
CREATE TABLE public.pos_transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES public.pos_transactions(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    product_sku TEXT,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.pos_transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage transaction items" ON public.pos_transaction_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can read transaction items" ON public.pos_transaction_items
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'staff'::app_role) OR
    has_role(auth.uid(), 'cashier'::app_role)
  );

CREATE POLICY "Cashiers can create transaction items" ON public.pos_transaction_items
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'cashier'::app_role) OR
    has_role(auth.uid(), 'staff'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE INDEX idx_pos_items_transaction ON public.pos_transaction_items(transaction_id);
CREATE INDEX idx_pos_items_product ON public.pos_transaction_items(product_id);

-- POS returns table
CREATE TABLE public.pos_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number TEXT NOT NULL DEFAULT '',
    original_transaction_id UUID REFERENCES public.pos_transactions(id) ON DELETE RESTRICT NOT NULL,
    original_receipt TEXT NOT NULL,
    refund_amount NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    refund_method TEXT NOT NULL DEFAULT 'cash',
    status TEXT NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.pos_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage returns" ON public.pos_returns
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can read returns" ON public.pos_returns
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'staff'::app_role) OR
    has_role(auth.uid(), 'cashier'::app_role)
  );

CREATE POLICY "Staff can create returns" ON public.pos_returns
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'cashier'::app_role) OR
    has_role(auth.uid(), 'staff'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Managers can update returns" ON public.pos_returns
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role)
  );

CREATE INDEX idx_pos_returns_transaction ON public.pos_returns(original_transaction_id);
CREATE INDEX idx_pos_returns_status ON public.pos_returns(status);

-- Auto-generate return number
CREATE OR REPLACE FUNCTION public.generate_pos_return_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(
      CASE 
        WHEN return_number ~ '^RET-[0-9]+$'
        THEN CAST(SUBSTRING(return_number FROM 5) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1 
    INTO next_num 
    FROM public.pos_returns;
    
    NEW.return_number := 'RET-' || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER generate_return_number
    BEFORE INSERT ON public.pos_returns
    FOR EACH ROW WHEN (NEW.return_number IS NULL OR NEW.return_number = '')
    EXECUTE FUNCTION public.generate_pos_return_number();

-- POS return items
CREATE TABLE public.pos_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES public.pos_returns(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    product_name TEXT NOT NULL,
    original_quantity INTEGER NOT NULL,
    return_quantity INTEGER NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    refund_amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.pos_return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage return items" ON public.pos_return_items
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can read return items" ON public.pos_return_items
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'staff'::app_role) OR
    has_role(auth.uid(), 'cashier'::app_role)
  );

CREATE POLICY "Staff can create return items" ON public.pos_return_items
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'cashier'::app_role) OR
    has_role(auth.uid(), 'staff'::app_role) OR
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE INDEX idx_pos_return_items_return ON public.pos_return_items(return_id);

-- Update shift stats when transaction is created
CREATE OR REPLACE FUNCTION public.update_shift_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE public.cashier_shifts
        SET 
            transaction_count = transaction_count + 1,
            total_sales = total_sales + NEW.total,
            cash_sales = cash_sales + COALESCE(
              NEW.cash_amount, 
              CASE WHEN NEW.payment_method = 'cash' THEN NEW.total ELSE 0 END
            ),
            card_sales = card_sales + COALESCE(
              NEW.card_amount, 
              CASE WHEN NEW.payment_method = 'card' THEN NEW.total ELSE 0 END
            )
        WHERE id = NEW.shift_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_pos_transaction_update_shift
    AFTER INSERT ON public.pos_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_shift_on_transaction();

-- Deduct stock on POS sale
CREATE OR REPLACE FUNCTION public.deduct_stock_on_pos_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    UPDATE public.products
    SET stock = stock - NEW.quantity,
        stock_status = CASE 
          WHEN stock - NEW.quantity <= 0 THEN 'out-of-stock'
          WHEN stock - NEW.quantity <= 5 THEN 'low-stock'
          ELSE 'in-stock'
        END,
        updated_at = now()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_pos_item_deduct_stock
    AFTER INSERT ON public.pos_transaction_items
    FOR EACH ROW EXECUTE FUNCTION public.deduct_stock_on_pos_item();

-- Update shift refunds when return is completed
CREATE OR REPLACE FUNCTION public.update_shift_on_return()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_shift_id UUID;
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        SELECT shift_id INTO v_shift_id 
        FROM public.pos_transactions 
        WHERE id = NEW.original_transaction_id;
        
        IF v_shift_id IS NOT NULL THEN
            UPDATE public.cashier_shifts
            SET refunds = refunds + NEW.refund_amount
            WHERE id = v_shift_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_pos_return_update_shift
    AFTER INSERT OR UPDATE ON public.pos_returns
    FOR EACH ROW EXECUTE FUNCTION public.update_shift_on_return();
