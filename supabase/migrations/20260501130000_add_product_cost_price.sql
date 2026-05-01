-- =====================================================================
-- ADD MISSING PRODUCT COLUMNS
-- Fixes: cost_price, reseller_price, is_featured, low_stock_threshold
-- All were referenced in ProductForm.tsx but missing from the products
-- table schema, causing them to be silently dropped by Supabase on INSERT.
-- =====================================================================

-- 1. Add cost_price — the purchase/manufacturing price per unit
--    This is the CRITICAL column for accurate profit/margin reporting.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 2. Add reseller_price — special price shown to reseller partners
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS reseller_price NUMERIC(12,2);

-- 3. Add is_featured — boolean flag for featured product promotions
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- 4. Add low_stock_threshold — alert trigger level for inventory warnings
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 10;

-- =====================================================================
-- ALSO FIX: The products SELECT policy currently only allows SELECT
-- for 'active' products. Admins need to see ALL products (active +
-- inactive) in the admin panel.
-- =====================================================================
DROP POLICY IF EXISTS "Admins can read all products" ON public.products;
CREATE POLICY "Admins can read all products"
  ON public.products FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================================
-- VERIFICATION
-- =====================================================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'products'
--   AND column_name IN ('cost_price', 'reseller_price', 'is_featured', 'low_stock_threshold')
-- ORDER BY column_name;
