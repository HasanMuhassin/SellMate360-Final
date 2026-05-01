-- =====================================================================
-- FIX DUPLICATE TRIGGERS ON PAYOUT_REQUESTS
-- Date: 2026-05-01
-- =====================================================================

-- This script completely cleans up any stray triggers on payout_requests
-- that might have been left over from older migrations, ensuring only
-- the correct ones exist.

DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Loop through all triggers on payout_requests
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'public.payout_requests'::regclass 
        -- We want to KEEP these core triggers:
        AND tgname NOT IN (
            'update_payout_requests_updated_at',
            'on_payout_status_change', -- Handles reseller notifications
            'trigger_notify_payout_request', -- Handles admin notifications
            'on_payout_approved_debit' -- The ONLY one that should touch the ledger
        )
        -- Ignore internal PostgreSQL triggers starting with RI_
        AND tgname NOT LIKE 'RI_%'
    LOOP
        -- Drop any stray trigger
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_record.tgname) || ' ON public.payout_requests';
    END LOOP;
END
$$;

-- Make absolutely sure the core ledger trigger is perfectly recreated
DROP TRIGGER IF EXISTS on_payout_approved_debit ON public.payout_requests;
CREATE TRIGGER on_payout_approved_debit
    AFTER UPDATE OF status ON public.payout_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_payout_approval();
