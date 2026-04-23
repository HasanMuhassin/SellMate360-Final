-- =====================================================
-- FIX: order_items.product_sku column type + function
-- =====================================================
-- Run this entire block in Supabase SQL Editor at once.
-- =====================================================

-- Step 1: Fix the column type (safe even if already TEXT)
ALTER TABLE public.order_items
ALTER COLUMN product_sku TYPE TEXT USING product_sku::TEXT;

-- Step 2: Recreate the function (includes ::order_status cast fix too)
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order JSONB,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order      public.orders%ROWTYPE;
  v_order_item JSONB;
  v_result     JSONB;
BEGIN
  INSERT INTO public.orders (
    reseller_id,
    shipping_name,
    shipping_phone,
    shipping_email,
    shipping_district,
    shipping_city,
    shipping_street,
    total,
    order_status
  )
  VALUES (
    (p_order->>'reseller_id')::UUID,
    p_order->>'shipping_name',
    p_order->>'shipping_phone',
    p_order->>'shipping_email',
    p_order->>'shipping_district',
    p_order->>'shipping_city',
    p_order->>'shipping_street',
    (p_order->>'total')::NUMERIC,
    COALESCE(p_order->>'order_status', 'pending')::order_status
  )
  RETURNING * INTO v_order;

  FOR v_order_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      product_sku,
      quantity,
      unit_price,
      total_price
    )
    VALUES (
      v_order.id,
      (v_order_item->>'product_id')::UUID,
      v_order_item->>'product_name',
      v_order_item->>'product_sku',          -- TEXT column now
      (v_order_item->>'quantity')::INTEGER,
      (v_order_item->>'unit_price')::NUMERIC,
      (v_order_item->>'total_price')::NUMERIC
    );
  END LOOP;

  SELECT row_to_json(v_order)::JSONB INTO v_result;
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Order creation failed: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_order_atomic(JSONB, JSONB) TO service_role;
