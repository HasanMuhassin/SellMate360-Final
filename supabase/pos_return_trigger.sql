-- Create the function to restore stock when a POS return is completed
CREATE OR REPLACE FUNCTION restore_product_stock_on_pos_return()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    v_current_stock INTEGER;
    v_threshold INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Requirement 1 & 6: Process only when status becomes 'completed'
    IF (TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed') THEN
        
        -- Requirement 2: Loop through pos_return_items
        FOR item_record IN SELECT product_id, return_quantity FROM pos_return_items WHERE return_id = NEW.id LOOP
            
            -- Requirement 5: Ensure correct product mapping
            SELECT stock, COALESCE(low_stock_threshold, 5) 
            INTO v_current_stock, v_threshold
            FROM products
            WHERE id = item_record.product_id;
            
            IF FOUND THEN
                -- Requirement 3: Add return_quantity back to stock
                v_new_stock := v_current_stock + item_record.return_quantity;
                
                -- Prevent negative stock just in case
                IF v_new_stock < 0 THEN
                    v_new_stock := 0;
                END IF;

                -- Requirement 4: Update stock_status with ENUM casting
                UPDATE products
                SET stock = v_new_stock,
                    stock_status = CASE 
                        WHEN v_new_stock = 0 THEN 'out_of_stock'::stock_status
                        WHEN v_new_stock <= v_threshold THEN 'low_stock'::stock_status
                        ELSE 'in_stock'::stock_status
                    END
                WHERE id = item_record.product_id;
            END IF;
            
        END LOOP;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_restore_stock_on_pos_return ON pos_returns;

CREATE TRIGGER trigger_restore_stock_on_pos_return
AFTER UPDATE ON pos_returns
FOR EACH ROW
EXECUTE FUNCTION restore_product_stock_on_pos_return();
