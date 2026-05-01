-- =====================================================================
-- FIX PAYOUT TRIGGER LOGIC
-- Date: 2026-05-01
-- =====================================================================

-- This forces the payout approval trigger to ONLY execute when status becomes 'approved'
-- and STRICTLY prevents it from firing when status changes to 'paid'.

CREATE OR REPLACE FUNCTION public.handle_payout_approval()
RETURNS TRIGGER AS $$
DECLARE
    v_balance NUMERIC(12,2);
BEGIN
    -- ONLY fire when status changes to 'approved' for the very first time.
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        
        -- Double-check that this payout hasn't already been debited
        IF NOT EXISTS (
            SELECT 1 FROM public.reseller_ledger 
            WHERE reference_id = NEW.id 
            AND type = 'payout'
        ) THEN
            
            -- Calculate current balance
            SELECT COALESCE(SUM(credit - debit), 0) INTO v_balance
            FROM public.reseller_ledger
            WHERE reseller_id = NEW.reseller_id;

            -- Insert the debit entry
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
