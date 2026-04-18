CREATE OR REPLACE FUNCTION public.update_shift_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE public.cashier_shifts
        SET 
            transaction_count = transaction_count + 1,
            total_sales = total_sales + NEW.total,
            cash_sales = cash_sales + COALESCE(
              NEW.cash_amount, 
              CASE WHEN NEW.payment_method = 'cod' THEN NEW.total ELSE 0 END
            ),
            card_sales = card_sales + COALESCE(
              NEW.card_amount, 
              CASE WHEN NEW.payment_method = 'card' THEN NEW.total ELSE 0 END
            )
        WHERE id = NEW.shift_id;
    END IF;
    RETURN NEW;
END;
$$;