-- Create the function to handle the stock update logic
CREATE OR REPLACE FUNCTION update_product_stock_on_adjustment()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock INTEGER;
    v_threshold INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Requirement 1 & 6: Only process when an adjustment becomes 'approved' 
    -- and prevent duplicate updates if status is already approved
    IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
       (TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved') THEN
       
       -- Requirement 5: Ensure correct product_id mapping by locking the row (optional but good for concurrency)
       SELECT stock, COALESCE(low_stock_threshold, 5) 
       INTO v_current_stock, v_threshold
       FROM products
       WHERE id = NEW.product_id;
       
       IF NOT FOUND THEN
           RETURN NEW;
       END IF;

       -- Requirement 2 & 3: Handle quantity changes based on type
       -- Note: If quantity_change is already properly signed (-5, +10), the ELSE block will handle it natively.
       IF NEW.type = 'increase' THEN
           v_new_stock := v_current_stock + NEW.quantity_change;
       ELSIF NEW.type = 'decrease' THEN
           v_new_stock := v_current_stock - NEW.quantity_change;
       ELSE
           v_new_stock := v_current_stock + NEW.quantity_change;
       END IF;

       -- Prevent negative stock values
       IF v_new_stock < 0 THEN
           v_new_stock := 0;
       END IF;

       -- Requirement 4: Perform the safe update with ENUM casting
       UPDATE products 
       SET stock = v_new_stock,
           stock_status = CASE 
               WHEN v_new_stock = 0 THEN 'out_of_stock'::stock_status
               WHEN v_new_stock <= v_threshold THEN 'low_stock'::stock_status
               ELSE 'in_stock'::stock_status
           END
       WHERE id = NEW.product_id;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_product_stock ON stock_adjustments;

CREATE TRIGGER trigger_update_product_stock
AFTER INSERT OR UPDATE ON stock_adjustments
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_adjustment();
