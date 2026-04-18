-- =====================================================
-- SELLMATE360 DATABASE SCHEMA
-- Migration 005: Customers & Orders
-- =====================================================

-- Customers table (for guest/non-registered customers)
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    order_count INTEGER DEFAULT 0,
    total_spent DECIMAL(12, 2) DEFAULT 0,
    cod_rejection_count INTEGER DEFAULT 0,
    risk_score public.risk_score DEFAULT 'low',
    notes TEXT[],
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Customer addresses
CREATE TABLE public.customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    label VARCHAR(50) DEFAULT 'Home',
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    street TEXT NOT NULL,
    zip_code VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE RESTRICT NOT NULL,
    reseller_id UUID,  -- Will reference resellers table
    
    -- Shipping address (denormalized for historical accuracy)
    shipping_name VARCHAR(255) NOT NULL,
    shipping_phone VARCHAR(20) NOT NULL,
    shipping_email VARCHAR(255),
    shipping_district VARCHAR(100) NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_street TEXT NOT NULL,
    shipping_zip_code VARCHAR(20),
    
    -- Totals
    subtotal DECIMAL(12, 2) NOT NULL,
    discount DECIMAL(12, 2) DEFAULT 0,
    delivery_fee DECIMAL(12, 2) DEFAULT 0,
    tax DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    
    -- Status
    payment_method public.payment_method NOT NULL,
    payment_status public.payment_status DEFAULT 'pending',
    order_status public.order_status DEFAULT 'pending',
    channel public.order_channel DEFAULT 'online',
    
    -- COD risk assessment
    cod_risk public.risk_score DEFAULT 'low',
    
    -- Metadata
    coupon_id UUID,  -- Will reference coupons table
    coupon_code VARCHAR(50),
    coupon_discount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT[],
    internal_notes TEXT[],
    
    -- Timestamps
    confirmed_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Order items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    
    -- Denormalized product info (historical accuracy)
    product_sku VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT,
    
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    discount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Order timeline/history
CREATE TABLE public.order_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) NOT NULL,
    note TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_risk_score ON public.customers(risk_score);

CREATE INDEX idx_customer_addresses_customer_id ON public.customer_addresses(customer_id);

CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_reseller_id ON public.orders(reseller_id);
CREATE INDEX idx_orders_order_status ON public.orders(order_status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_channel ON public.orders(channel);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX idx_order_timeline_order_id ON public.order_timeline(order_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    prefix VARCHAR(10);
    next_num INTEGER;
BEGIN
    IF NEW.channel = 'pos' THEN
        prefix = 'POS-';
    ELSE
        prefix = 'ORD-';
    END IF;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1 
    INTO next_num 
    FROM public.orders
    WHERE order_number LIKE prefix || '%';
    
    NEW.order_number = prefix || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER generate_order_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION public.generate_order_number();

-- Update customer stats on order
CREATE OR REPLACE FUNCTION public.update_customer_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.customers 
        SET 
            order_count = order_count + 1,
            total_spent = total_spent + NEW.total,
            updated_at = now()
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_created_update_customer
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_customer_stats();

-- Add timeline entry on status change
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
        INSERT INTO public.order_timeline (order_id, status, note)
        VALUES (NEW.id, NEW.order_status::TEXT, 'Status changed from ' || OLD.order_status || ' to ' || NEW.order_status);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_change
    AFTER UPDATE OF order_status ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
