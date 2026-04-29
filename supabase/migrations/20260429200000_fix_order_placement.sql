-- =====================================================
-- ORDER SCHEMA SYNC & ATOMIC CREATION
-- =====================================================

-- 1. Sync Orders Table
ALTER TABLE public.orders 
    ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tax NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod',
    ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'online',
    ADD COLUMN IF NOT EXISTS shipping_zip_code TEXT;

-- 2. Sync Order Items Table
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS product_image TEXT,
    ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS product_sku TEXT,
    ADD COLUMN IF NOT EXISTS total NUMERIC(12,2) DEFAULT 0;

-- 3. Update Customers RLS
-- Allow anyone to insert a customer (for checkout)
DROP POLICY IF EXISTS "Anyone can insert customers" ON public.customers;
CREATE POLICY "Anyone can insert customers" ON public.customers FOR INSERT TO public WITH CHECK (true);

-- Allow users to read their own customer profile
DROP POLICY IF EXISTS "Users can read own customer profile" ON public.customers;
CREATE POLICY "Users can read own customer profile" ON public.customers FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 4. Robust Atomic Order Creation RPC
CREATE OR REPLACE FUNCTION public.create_order_v2(
    p_order JSONB,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_id UUID;
    v_order_row public.orders%ROWTYPE;
    v_item JSONB;
BEGIN
    -- 1. Insert Order
    INSERT INTO public.orders (
        order_number,
        customer_id,
        reseller_id,
        order_status,
        subtotal,
        delivery_fee,
        discount,
        tax,
        total,
        payment_method,
        payment_status,
        channel,
        shipping_name,
        shipping_phone,
        shipping_email,
        shipping_district,
        shipping_city,
        shipping_street,
        shipping_zip_code
    )
    VALUES (
        p_order->>'order_number',
        (p_order->>'customer_id')::UUID,
        (p_order->>'reseller_id')::UUID,
        COALESCE(p_order->>'order_status', 'pending')::order_status,
        (p_order->>'subtotal')::NUMERIC,
        (p_order->>'delivery_fee')::NUMERIC,
        (p_order->>'discount')::NUMERIC,
        (p_order->>'tax')::NUMERIC,
        (p_order->>'total')::NUMERIC,
        (p_order->>'payment_method')::payment_method,
        (p_order->>'payment_status')::payment_status,
        (p_order->>'channel')::order_channel,
        p_order->>'shipping_name',
        p_order->>'shipping_phone',
        p_order->>'shipping_email',
        p_order->>'shipping_district',
        p_order->>'shipping_city',
        p_order->>'shipping_street',
        p_order->>'shipping_zip_code'
    )
    RETURNING * INTO v_order_row;

    -- 2. Insert Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            product_sku,
            product_image,
            quantity,
            unit_price,
            discount,
            total
        )
        VALUES (
            v_order_row.id,
            (v_item->>'product_id')::UUID,
            v_item->>'product_name',
            v_item->>'product_sku',
            v_item->>'product_image',
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'discount')::NUMERIC,
            (v_item->>'total')::NUMERIC
        );
    END LOOP;

    RETURN row_to_json(v_order_row);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_v2(JSONB, JSONB) TO public;
GRANT EXECUTE ON FUNCTION public.create_order_v2(JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_v2(JSONB, JSONB) TO service_role;
