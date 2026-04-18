-- Migration: Fix Reseller Order RLS Policies
-- Description: Allow resellers to insert order items and profit records for orders they place.

-- 1. Allow resellers to insert order items for their own orders
DROP POLICY IF EXISTS "Resellers can insert order items" ON public.order_items;
CREATE POLICY "Resellers can insert order items" ON public.order_items
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE id = order_id
            AND reseller_id = public.get_reseller_id(auth.uid())
        )
    );

-- 2. Allow resellers to view items for their own orders (Improved policy)
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users and Resellers can view own order items" ON public.order_items;
CREATE POLICY "Users and Resellers can view own order items" ON public.order_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE id = public.order_items.order_id
            AND (
                customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
                OR reseller_id = public.get_reseller_id(auth.uid())
            )
        )
    );

-- 3. Allow resellers to insert profit record into reseller_orders
DROP POLICY IF EXISTS "Resellers can insert reseller_orders" ON public.reseller_orders;
CREATE POLICY "Resellers can insert reseller_orders" ON public.reseller_orders
    FOR INSERT TO authenticated
    WITH CHECK (reseller_id = public.get_reseller_id(auth.uid()));

-- 4. Allow resellers to view own reseller_orders (ensure this exists)
DROP POLICY IF EXISTS "Resellers can view own orders" ON public.reseller_orders;
CREATE POLICY "Resellers can view own orders" ON public.reseller_orders
    FOR SELECT TO authenticated
    USING (reseller_id = public.get_reseller_id(auth.uid()));
