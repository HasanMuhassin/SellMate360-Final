-- =====================================================
-- DYNAMIC RESELLER COD METRICS AND PROFIT CLAWBACK
-- =====================================================

-- 1. Redefine reseller_metrics_view to calculate COD rejections dynamically
CREATE OR REPLACE VIEW public.reseller_metrics_view AS
SELECT 
    r.id,
    r.user_id,
    r.business_name,
    r.business_registration,
    r.tax_id,
    r.contact_person,
    r.phone,
    r.email,
    r.address,
    r.tier,
    r.status,
    COALESCE(o_stats.total_orders, 0)::integer as total_orders,
    COALESCE(o_stats.total_revenue, 0)::numeric as total_revenue,
    COALESCE(ro_stats.total_profit, 0)::numeric as total_profit,
    COALESCE(ret_stats.returned_count, 0)::integer as cod_rejection_count,
    CASE 
        WHEN COALESCE(o_stats.total_orders, 0) > 0 
        THEN ROUND((COALESCE(ret_stats.returned_count, 0)::numeric / o_stats.total_orders) * 100, 2)
        ELSE 0 
    END::numeric(5,2) as cod_rejection_rate,
    r.commission_rate,
    COALESCE(l_stats.balance, 0)::numeric as available_balance,
    r.pending_balance,
    r.total_withdrawn,
    r.approved_by,
    r.approved_at,
    r.blocked_reason,
    r.notes,
    r.created_at,
    r.updated_at
FROM public.resellers r
LEFT JOIN (
    SELECT reseller_id, COUNT(id) as total_orders, SUM(total) as total_revenue
    FROM public.orders
    WHERE order_status != 'cancelled'
    GROUP BY reseller_id
) o_stats ON o_stats.reseller_id = r.id
LEFT JOIN (
    SELECT ro.reseller_id, SUM(ro.profit) as total_profit
    FROM public.reseller_orders ro
    JOIN public.orders o ON o.id = ro.order_id
    WHERE o.order_status = 'delivered'
    GROUP BY ro.reseller_id
) ro_stats ON ro_stats.reseller_id = r.id
LEFT JOIN (
    SELECT reseller_id, COUNT(id) as returned_count
    FROM public.orders
    WHERE order_status = 'returned'
    GROUP BY reseller_id
) ret_stats ON ret_stats.reseller_id = r.id
LEFT JOIN (
    SELECT reseller_id, SUM(credit - debit) as balance
    FROM public.reseller_ledger
    GROUP BY reseller_id
) l_stats ON l_stats.reseller_id = r.id;

-- Grant permissions for the view
GRANT SELECT ON public.reseller_metrics_view TO authenticated;
GRANT SELECT ON public.reseller_metrics_view TO anon;

-- 2. Create trigger to claw back profit if an order is returned AFTER being delivered
CREATE OR REPLACE FUNCTION public.handle_reseller_order_returned()
RETURNS TRIGGER AS $$
DECLARE
    v_profit NUMERIC(12,2);
    v_balance NUMERIC(12,2);
BEGIN
    -- Detect status change from 'delivered' to 'returned' or 'cancelled'
    IF NEW.order_status IN ('returned', 'cancelled') AND OLD.order_status = 'delivered' AND NEW.reseller_id IS NOT NULL THEN
        -- Check if a credit ledger entry exists for this order
        IF EXISTS (
            SELECT 1 FROM public.reseller_ledger 
            WHERE reference_id = NEW.id 
            AND type = 'credit'
        ) THEN
            -- Check that we haven't already debited it
            IF NOT EXISTS (
                SELECT 1 FROM public.reseller_ledger 
                WHERE reference_id = NEW.id 
                AND type = 'debit'
                AND description LIKE 'Profit reversed%'
            ) THEN
                -- Get profit from reseller_orders
                SELECT profit INTO v_profit 
                FROM public.reseller_orders 
                WHERE order_id = NEW.id;

                IF FOUND THEN
                    -- Calculate running balance
                    SELECT COALESCE(SUM(credit - debit), 0) INTO v_balance
                    FROM public.reseller_ledger
                    WHERE reseller_id = NEW.reseller_id;

                    -- Insert debit into reseller_ledger
                    INSERT INTO public.reseller_ledger (
                        reseller_id,
                        type,
                        reference_id,
                        reference_number,
                        debit,
                        balance,
                        description
                    ) VALUES (
                        NEW.reseller_id,
                        'debit',
                        NEW.id,
                        NEW.order_number,
                        v_profit,
                        v_balance - v_profit,
                        'Profit reversed for returned order ' || NEW.order_number
                    );
                END IF;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_returned_reseller_profit ON public.orders;
CREATE TRIGGER on_order_returned_reseller_profit
    AFTER UPDATE OF order_status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_reseller_order_returned();
