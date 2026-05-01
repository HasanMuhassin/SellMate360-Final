-- =====================================================
-- FIX RLS POLICIES FOR ADMIN ACTIONS & ENABLE REALTIME
-- =====================================================

-- 1. Fix payout_requests RLS
DROP POLICY IF EXISTS "Resellers can read own payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can manage payout requests" ON public.payout_requests;

CREATE POLICY "Resellers can read own payout requests"
  ON public.payout_requests FOR SELECT
  USING (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage payout requests"
  ON public.payout_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix reseller_orders RLS
DROP POLICY IF EXISTS "Resellers can read own orders" ON public.reseller_orders;
DROP POLICY IF EXISTS "Admins can manage reseller orders" ON public.reseller_orders;

CREATE POLICY "Resellers can read own orders"
  ON public.reseller_orders FOR SELECT
  USING (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage reseller orders"
  ON public.reseller_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix reseller_ledger RLS
DROP POLICY IF EXISTS "Resellers can read own ledger" ON public.reseller_ledger;
DROP POLICY IF EXISTS "Admins can manage reseller ledger" ON public.reseller_ledger;

CREATE POLICY "Resellers can read own ledger"
  ON public.reseller_ledger FOR SELECT
  USING (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage reseller ledger"
  ON public.reseller_ledger FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Enable Realtime for notifications
DO $$ 
BEGIN
  -- Try to add table to publication. If it's already there, it's fine.
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reseller_notifications;
EXCEPTION WHEN duplicate_object THEN
  -- Do nothing if already in publication
END $$;
