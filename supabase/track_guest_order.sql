CREATE OR REPLACE FUNCTION get_guest_order_tracking(p_order_number TEXT, p_contact TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_items json;
BEGIN
  -- 1. Find the order ensuring both order number AND contact match
  SELECT * INTO v_order
  FROM orders
  WHERE order_number = p_order_number
    AND (shipping_phone = p_contact OR shipping_email = p_contact)
  LIMIT 1;

  -- 2. If not found or contact doesn't match, return null
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 3. Fetch the associated order items
  SELECT json_agg(json_build_object(
    'product_name', product_name,
    'quantity', quantity,
    'unit_price', unit_price
  )) INTO v_items
  FROM order_items
  WHERE order_id = v_order.id;

  -- 4. Return combined JSON object for the frontend
  RETURN json_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'order_status', v_order.order_status,
    'total', v_order.total,
    'created_at', v_order.created_at,
    'shipping_name', v_order.shipping_name,
    'shipping_district', v_order.shipping_district,
    'shipping_city', v_order.shipping_city,
    'shipping_street', v_order.shipping_street,
    'items', COALESCE(v_items, '[]'::json)
  );
END;
$$;
