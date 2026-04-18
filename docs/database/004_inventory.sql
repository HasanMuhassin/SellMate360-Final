-- =====================================================
-- SELLMATE360 DATABASE SCHEMA
-- Migration 004: Inventory Management
-- =====================================================

-- Suppliers table
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    contact_person VARCHAR(255),
    notes TEXT,
    status public.entity_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Stock movements table
CREATE TABLE public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    type public.stock_movement_type NOT NULL,
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason VARCHAR(255),
    reference VARCHAR(100),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    branch_id UUID,  -- Will reference branches table
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Purchase orders table
CREATE TABLE public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE RESTRICT NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    subtotal DECIMAL(12, 2) DEFAULT 0,
    tax DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    expected_delivery DATE,
    received_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Purchase order items table
CREATE TABLE public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_suppliers_status ON public.suppliers(status);
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON public.stock_movements(type);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);
CREATE INDEX idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_order_items_purchase_order_id ON public.purchase_order_items(purchase_order_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update product stock on stock movement
CREATE OR REPLACE FUNCTION public.handle_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    SELECT stock INTO current_stock FROM public.products WHERE id = NEW.product_id;
    NEW.previous_stock = COALESCE(current_stock, 0);
    
    IF NEW.type = 'in' THEN
        NEW.new_stock = NEW.previous_stock + NEW.quantity;
    ELSIF NEW.type = 'out' THEN
        NEW.new_stock = NEW.previous_stock - NEW.quantity;
    ELSE
        NEW.new_stock = NEW.previous_stock + NEW.quantity; -- adjustment can be +/-
    END IF;
    
    UPDATE public.products SET stock = NEW.new_stock WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_stock_movement_created
    BEFORE INSERT ON public.stock_movements
    FOR EACH ROW EXECUTE FUNCTION public.handle_stock_movement();

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON public.purchase_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate purchase order number
CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1 
    INTO next_num 
    FROM public.purchase_orders;
    
    NEW.order_number = 'PO-' || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$;

CREATE TRIGGER generate_purchase_order_number
    BEFORE INSERT ON public.purchase_orders
    FOR EACH ROW WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION public.generate_po_number();
