-- =====================================================
-- FIX PAYOUTS AND RESELLER LEDGER DEBIT
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_payout_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_balance NUMERIC(12,2);
BEGIN
    -- Detect status change to 'approved'
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Check if a ledger entry already exists for this payout to prevent duplicates
        IF NOT EXISTS (
            SELECT 1 FROM public.reseller_ledger 
            WHERE reference_id = NEW.id 
            AND type = 'payout'
        ) THEN
            -- Calculate running balance
            SELECT COALESCE(SUM(credit - debit), 0) INTO v_balance
            FROM public.reseller_ledger
            WHERE reseller_id = NEW.reseller_id;

            -- Insert payout into reseller_ledger as a debit
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
                'payout',
                NEW.id,
                NEW.id::text,
                NEW.amount,
                v_balance - NEW.amount,
                'Payout Approved'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_payout_approved_debit ON public.payout_requests;
CREATE TRIGGER on_payout_approved_debit
    AFTER UPDATE OF status ON public.payout_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_payout_approval();

-- =====================================================
-- UPDATE RESELLER METRICS VIEW TO SUBTRACT PENDING PAYOUTS
-- =====================================================

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
    r.cod_rejection_count,
    r.cod_rejection_rate,
    r.commission_rate,
    (COALESCE(l_stats.balance, 0) - COALESCE(p_stats.pending_amount, 0))::numeric as available_balance,
    r.pending_balance,
    COALESCE(paid_stats.total_withdrawn, 0)::numeric(12,2) as total_withdrawn,
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
    SELECT reseller_id, SUM(credit - debit) as balance
    FROM public.reseller_ledger
    GROUP BY reseller_id
) l_stats ON l_stats.reseller_id = r.id
LEFT JOIN (
    SELECT reseller_id, SUM(amount) as pending_amount
    FROM public.payout_requests
    WHERE status = 'pending'
    GROUP BY reseller_id
) p_stats ON p_stats.reseller_id = r.id
LEFT JOIN (
    SELECT reseller_id, SUM(amount) as total_withdrawn
    FROM public.payout_requests
    WHERE status = 'paid'
    GROUP BY reseller_id
) paid_stats ON paid_stats.reseller_id = r.id;

-- Grant permissions for the view
GRANT SELECT ON public.reseller_metrics_view TO authenticated;
GRANT SELECT ON public.reseller_metrics_view TO anon;
