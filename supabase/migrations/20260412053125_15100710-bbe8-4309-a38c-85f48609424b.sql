-- Drop the old trigger
DROP TRIGGER IF EXISTS generate_pos_receipt_number ON public.pos_transactions;

-- Recreate trigger without the WHEN condition - let the function handle it
CREATE TRIGGER generate_pos_receipt_number
    BEFORE INSERT ON public.pos_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_pos_receipt_number();

-- Update the function to handle both NULL and empty string
CREATE OR REPLACE FUNCTION public.generate_pos_receipt_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    today_date TEXT;
    next_num INTEGER;
BEGIN
    -- Generate receipt number if NULL or empty
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        today_date := TO_CHAR(NOW(), 'YYYYMMDD');
        
        SELECT COALESCE(MAX(
          CASE 
            WHEN receipt_number ~ ('^RCP-' || today_date || '-[0-9]+$')
            THEN CAST(SUBSTRING(receipt_number FROM LENGTH('RCP-' || today_date || '-') + 1) AS INTEGER)
            ELSE 0
          END
        ), 0) + 1 
        INTO next_num 
        FROM public.pos_transactions
        WHERE receipt_number LIKE 'RCP-' || today_date || '-%';
        
        NEW.receipt_number := 'RCP-' || today_date || '-' || LPAD(next_num::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$;

-- Also fix the return number trigger the same way
DROP TRIGGER IF EXISTS generate_pos_return_number ON public.pos_returns;

CREATE TRIGGER generate_pos_return_number
    BEFORE INSERT ON public.pos_returns
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_pos_return_number();

CREATE OR REPLACE FUNCTION public.generate_pos_return_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
    next_num INTEGER;
BEGIN
    IF NEW.return_number IS NULL OR NEW.return_number = '' THEN
        SELECT COALESCE(MAX(
          CASE 
            WHEN return_number ~ '^RET-[0-9]+$'
            THEN CAST(SUBSTRING(return_number FROM 5) AS INTEGER)
            ELSE 0
          END
        ), 0) + 1 
        INTO next_num 
        FROM public.pos_returns;
        
        NEW.return_number := 'RET-' || LPAD(next_num::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$;