-- =====================================================================
-- FIX PAYOUT DOUBLE DEDUCTION AND BALANCE CALCULATION
-- Date: 2026-05-01
-- =====================================================================

-- =====================================================================
-- 1. CLEAN UP DUPLICATE LEDGER ENTRIES
-- =====================================================================
-- If the admin or system accidentally created duplicate debits for the same payout,
-- this will remove the duplicates and keep only the first one.
DELETE FROM public.reseller_ledger
WHERE ctid NOT IN (
    SELECT min(ctid)
    FROM public.reseller_ledger
    GROUP BY reference_id, type
)
AND reference_id IS NOT NULL;

-- =====================================================================
-- 2. ADD UNIQUE CONSTRAINT TO PREVENT FUTURE DUPLICATES
-- =====================================================================
-- This completely prevents the "double deduction" bug at the database level.
-- A payout request can only ever have ONE 'payout' debit entry.
ALTER TABLE public.reseller_ledger 
DROP CONSTRAINT IF EXISTS unique_ledger_reference;

ALTER TABLE public.reseller_ledger 
ADD CONSTRAINT unique_ledger_reference UNIQUE (reference_id, type);


-- =====================================================================
-- 3. FIX RESELLER METRICS VIEW (PENDING PAYOUT DEDUCTION)
-- =====================================================================
-- We must subtract "pending" payouts from the available balance. 
-- Otherwise, a reseller can request infinite payouts before the admin approves them.

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
    
    -- THE FIX: Subtract pending amounts from the ledger balance so resellers can't double-dip.
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
    SELECT reseller_id, COUNT(id) as returned_count
    FROM public.orders
    WHERE order_status = 'returned'
    GROUP BY reseller_id
) ret_stats ON ret_stats.reseller_id = r.id
LEFT JOIN (
    SELECT reseller_id, SUM(credit - debit) as balance
    FROM public.reseller_ledger
    GROUP BY reseller_id
) l_stats ON l_stats.reseller_id = r.id
LEFT JOIN (
    -- Sum of all 'pending' payouts that haven't been approved (debited) yet
    SELECT reseller_id, SUM(amount) as pending_amount
    FROM public.payout_requests
    WHERE status = 'pending'
    GROUP BY reseller_id
) p_stats ON p_stats.reseller_id = r.id
LEFT JOIN (
    -- Sum of all successfully paid payouts
    SELECT reseller_id, SUM(amount) as total_withdrawn
    FROM public.payout_requests
    WHERE status = 'paid'
    GROUP BY reseller_id
) paid_stats ON paid_stats.reseller_id = r.id;

-- Grant permissions for the view
GRANT SELECT ON public.reseller_metrics_view TO authenticated;
GRANT SELECT ON public.reseller_metrics_view TO anon;
