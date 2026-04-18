-- Migration: Create payout-proofs storage bucket
-- Description: Sets up the storage bucket for reseller payout evidence (bank slips, etc.)

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payout-proofs', 'payout-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for Staff
CREATE POLICY "Staff can upload payout proofs"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'payout-proofs' 
        AND (public.is_admin_or_manager(auth.uid()))
    );

CREATE POLICY "Staff can view all payout proofs"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'payout-proofs' 
        AND (public.is_admin_or_manager(auth.uid()))
    );

-- 3. RLS Policies for Resellers (View only their own)
CREATE POLICY "Resellers can view own payout proof"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'payout-proofs'
        AND (
            EXISTS (
                SELECT 1 FROM public.payout_requests pr
                WHERE pr.payment_proof_url ILIKE '%' || storage.objects.name || '%'
                AND pr.reseller_id = public.get_reseller_id(auth.uid())
            )
        )
    );
