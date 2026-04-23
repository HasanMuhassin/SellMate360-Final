-- =====================================================
-- FIX: generate_order_number trigger crashes on non-numeric suffixes
-- =====================================================
-- Error: invalid input syntax for type integer: "ML29X4LN"
-- Root cause: The trigger scans existing orders LIKE 'ORD-%' and tries
--             CAST(suffix AS INTEGER). If any existing order has a
--             non-numeric suffix (e.g. "ORD-ML29X4LN" from legacy data),
--             the CAST crashes the entire INSERT.
-- Fix: Wrap the CAST in a CASE WHEN regex guard — same pattern used
--      to fix the POS receipt number trigger in 20260412053125.
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    prefix   VARCHAR(10);
    next_num INTEGER;
BEGIN
    IF NEW.channel = 'pos' THEN
        prefix := 'POS-';
    ELSE
        prefix := 'ORD-';
    END IF;

    SELECT COALESCE(MAX(
        CASE
            WHEN SUBSTRING(order_number FROM LENGTH(prefix) + 1) ~ '^[0-9]+$'
            THEN CAST(SUBSTRING(order_number FROM LENGTH(prefix) + 1) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO next_num
    FROM public.orders
    WHERE order_number LIKE prefix || '%';

    NEW.order_number := prefix || LPAD(next_num::TEXT, 6, '0');
    RETURN NEW;
END;
$$;
