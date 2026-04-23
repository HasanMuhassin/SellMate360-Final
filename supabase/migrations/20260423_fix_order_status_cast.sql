-- =====================================================
-- FIX: cast order_status text → enum in create_order_atomic
-- =====================================================
-- Error: column "order_status" is of type order_status but
--        expression is of type text
-- Root cause: p_order->>'order_status' returns text; Postgres
--             cannot implicitly coerce text to a custom enum.
-- Fix: explicit ::order_status cast on line 45 of original function.
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order    JSONB,
  p_items    JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order      public.orders%ROWTYPE;
  v_order_item JSONB;
  v_items_arr  JSONB[];</pre>
  v_result     JSONB;
BEGIN
  -- Insert the order row
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
    COALESCE(p_order->>'order_status', 'pending')::order_status  -- ← FIXED: explicit cast
  )
  RETURNING * INTO v_order;

  -- Insert all order items, linking them to the new order ID
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
      v_order_item->>'product_sku',
      (v_order_item->>'quantity')::INTEGER,
      (v_order_item->>'unit_price')::NUMERIC,
      (v_order_item->>'total_price')::NUMERIC
    );
  END LOOP;

  -- Return the created order as JSON for the caller
  SELECT row_to_json(v_order)::JSONB INTO v_result;
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Any error in this block causes a full rollback of both inserts.
  RAISE EXCEPTION 'Order creation failed: %', SQLERRM;
END;
$$;

-- Grant execute permission for service role (used by Edge Functions)
GRANT EXECUTE ON FUNCTION public.create_order_atomic(JSONB, JSONB) TO service_role;
