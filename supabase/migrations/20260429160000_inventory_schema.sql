-- =====================================================
-- ADMIN INVENTORY MODULE SCHEMA
-- =====================================================

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    categories TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for suppliers
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to suppliers" ON public.suppliers;
CREATE POLICY "Allow authenticated access to suppliers" ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Branches Table
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add missing columns if the table already existed
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;

-- Enable RLS for branches
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to branches" ON public.branches;
CREATE POLICY "Allow authenticated access to branches" ON public.branches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Stock Adjustments Table
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adjustment_number TEXT NOT NULL UNIQUE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity_change INTEGER NOT NULL,
    reason TEXT,
    type TEXT NOT NULL CHECK (type IN ('addition', 'deduction', 'damage', 'loss', 'recount')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by TEXT DEFAULT 'Admin',
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for stock_adjustments
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to stock_adjustments" ON public.stock_adjustments;
CREATE POLICY "Allow authenticated access to stock_adjustments" ON public.stock_adjustments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Stock Transfers Table
CREATE TABLE IF NOT EXISTS public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number TEXT NOT NULL UNIQUE,
    from_branch_name TEXT NOT NULL,
    to_branch_name TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]',
    total_items INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'received', 'cancelled')),
    requested_by TEXT DEFAULT 'Admin',
    shipped_at TIMESTAMP WITH TIME ZONE,
    received_by TEXT,
    received_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for stock_transfers
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to stock_transfers" ON public.stock_transfers;
CREATE POLICY "Allow authenticated access to stock_transfers" ON public.stock_transfers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Stock Ledger Table
CREATE TABLE IF NOT EXISTS public.stock_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment', 'transfer_in', 'transfer_out', 'return')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    reference TEXT,
    created_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for stock_ledger
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to stock_ledger" ON public.stock_ledger;
CREATE POLICY "Allow authenticated access to stock_ledger" ON public.stock_ledger FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- POSTGRES TRIGGERS
-- =====================================================

-- Trigger function to automatically update products.stock when stock_ledger is inserted
CREATE OR REPLACE FUNCTION public.update_product_stock_from_ledger()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET 
        stock = stock + NEW.quantity,
        stock_status = CASE 
            WHEN stock + NEW.quantity <= 0 THEN 'out_of_stock'::stock_status
            WHEN stock + NEW.quantity <= 5 THEN 'low_stock'::stock_status
            ELSE 'in_stock'::stock_status
        END,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_stock ON public.stock_ledger;
CREATE TRIGGER trigger_update_product_stock
AFTER INSERT ON public.stock_ledger
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock_from_ledger();

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Seed a default main branch if it doesn't exist
INSERT INTO public.branches (name, location, address, is_main, status)
VALUES ('Main Warehouse', 'Colombo', 'Colombo Main', true, 'active')
ON CONFLICT DO NOTHING;
