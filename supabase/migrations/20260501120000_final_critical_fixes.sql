-- =====================================================================
-- FINAL CRITICAL FIXES — Single Authoritative Migration
-- Fixes:
--   1. Reseller order notifications crash (order_status ENUM cast bug)
--   2. Admin payout approve/reject blocked (RLS ::app_role cast bug)
-- Date: 2026-05-01
-- =====================================================================


-- =====================================================================
-- PART 1: FIX RESELLER NOTIFICATIONS (ENUM CAST BUG)
-- =====================================================================

-- Step 1a: Drop all old trigger instances from tables (safe - IF EXISTS)
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
DROP TRIGGER IF EXISTS on_payout_status_change ON public.payout_requests;

-- Step 1b: Drop old function definitions (safe - OR REPLACE rebuilds them)
-- (Using CREATE OR REPLACE below so no explicit DROP needed for functions)

-- Step 1c: Drop and recreate the INSERT policy for the notifications table
-- This ensures SECURITY DEFINER triggers can always insert, regardless of
-- the calling user's RLS context.
DROP POLICY IF EXISTS "System can insert notifications" ON public.reseller_notifications;
DROP POLICY IF EXISTS "Resellers can view their own notifications" ON public.reseller_notifications;
DROP POLICY IF EXISTS "Resellers can update their own notifications" ON public.reseller_notifications;
DROP POLICY IF EXISTS "Admins can manage all reseller notifications" ON public.reseller_notifications;

-- Recreate all notification RLS policies cleanly
CREATE POLICY "Resellers can view their own notifications"
  ON public.reseller_notifications FOR SELECT
  USING (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
  );

CREATE POLICY "Resellers can update their own notifications"
  ON public.reseller_notifications FOR UPDATE
  USING (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all reseller notifications"
  ON public.reseller_notifications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Permissive INSERT policy so triggers (SECURITY DEFINER) can always write
CREATE POLICY "System can insert notifications"
  ON public.reseller_notifications FOR INSERT
  WITH CHECK (true);

-- Step 1d: Recreate the ORDER status notification trigger function
-- KEY FIX: Cast order_status to ::text in all string contexts
CREATE OR REPLACE FUNCTION public.notify_reseller_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire if the order belongs to a reseller AND status actually changed
  IF NEW.reseller_id IS NOT NULL AND OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    INSERT INTO public.reseller_notifications (reseller_id, title, message, type)
    VALUES (
      NEW.reseller_id,
      CASE NEW.order_status::text
        WHEN 'confirmed'        THEN 'Order Confirmed ✅'
        WHEN 'processing'       THEN 'Order Processing 🔧'
        WHEN 'packed'           THEN 'Order Packed 📦'
        WHEN 'shipped'          THEN 'Order Shipped 🚚'
        WHEN 'out_for_delivery' THEN 'Out for Delivery 🛵'
        WHEN 'delivered'        THEN 'Order Delivered 🎉'
        WHEN 'cancelled'        THEN 'Order Cancelled ❌'
        WHEN 'returned'         THEN 'Order Returned 🔄'
        ELSE 'Order Updated'
      END,
      'Order #' || COALESCE(NEW.order_number, '') 
        || ' status changed to ' 
        || COALESCE(NEW.order_status::text, '') 
        || '.',
      CASE NEW.order_status::text
        WHEN 'delivered'        THEN 'success'
        WHEN 'shipped'          THEN 'success'
        WHEN 'out_for_delivery' THEN 'success'
        WHEN 'cancelled'        THEN 'error'
        WHEN 'returned'         THEN 'error'
        ELSE 'info'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 1e: Recreate the PAYOUT status notification trigger function
-- KEY FIX: Cast payout_status to ::text in all string contexts
CREATE OR REPLACE FUNCTION public.notify_reseller_payout_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.reseller_notifications (reseller_id, title, message, type)
    VALUES (
      NEW.reseller_id,
      CASE NEW.status::text
        WHEN 'approved' THEN 'Payout Approved ✅'
        WHEN 'paid'     THEN 'Payout Processed 💰'
        WHEN 'rejected' THEN 'Payout Rejected ❌'
        ELSE 'Payout Request Updated'
      END,
      'Your payout request for Rs. ' 
        || COALESCE(NEW.amount::text, '0') 
        || ' has been ' 
        || COALESCE(NEW.status::text, '') 
        || '.',
      CASE NEW.status::text
        WHEN 'paid'     THEN 'success'
        WHEN 'approved' THEN 'info'
        WHEN 'rejected' THEN 'error'
        ELSE 'info'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 1f: Re-attach triggers to the correct tables
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF order_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reseller_order_status();

CREATE TRIGGER on_payout_status_change
  AFTER UPDATE OF status ON public.payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reseller_payout_status();


-- =====================================================================
-- PART 2: FIX ADMIN PAYOUT RLS (::app_role CAST BUG)
-- =====================================================================

-- Step 2a: Fix payout_requests table policies
DROP POLICY IF EXISTS "Resellers can read own payout requests" ON public.payout_requests;
DROP POLICY IF EXISTS "Resellers can insert payout requests"   ON public.payout_requests;
DROP POLICY IF EXISTS "Admins can manage payout requests"      ON public.payout_requests;

-- Resellers can view only their own payout requests
CREATE POLICY "Resellers can read own payout requests"
  ON public.payout_requests FOR SELECT
  USING (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Resellers can submit new payout requests
CREATE POLICY "Resellers can insert payout requests"
  ON public.payout_requests FOR INSERT
  WITH CHECK (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
  );

-- Admins have full control over all payout requests (approve / reject / pay)
CREATE POLICY "Admins can manage payout requests"
  ON public.payout_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Step 2b: Fix reseller_orders table policies
DROP POLICY IF EXISTS "Admins can manage reseller orders"  ON public.reseller_orders;
DROP POLICY IF EXISTS "Resellers can read own orders"      ON public.reseller_orders;
DROP POLICY IF EXISTS "Resellers can view own orders"      ON public.reseller_orders;
DROP POLICY IF EXISTS "Resellers can insert reseller_orders" ON public.reseller_orders;

-- Resellers can see only their own order records
CREATE POLICY "Resellers can read own orders"
  ON public.reseller_orders FOR SELECT
  USING (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Resellers can create their own order records (for order placement flow)
CREATE POLICY "Resellers can insert reseller_orders"
  ON public.reseller_orders FOR INSERT
  WITH CHECK (
    reseller_id = public.get_reseller_id(auth.uid())
  );

-- Admins have full control
CREATE POLICY "Admins can manage reseller orders"
  ON public.reseller_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Step 2c: Fix reseller_ledger table policies
DROP POLICY IF EXISTS "Resellers can read own ledger" ON public.reseller_ledger;
DROP POLICY IF EXISTS "Admins can manage ledger"      ON public.reseller_ledger;
DROP POLICY IF EXISTS "Admins can manage reseller ledger" ON public.reseller_ledger;

-- Resellers can see only their own ledger entries
CREATE POLICY "Resellers can read own ledger"
  ON public.reseller_ledger FOR SELECT
  USING (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Admins have full control (needed for clawback triggers and manual adjustments)
CREATE POLICY "Admins can manage reseller ledger"
  ON public.reseller_ledger FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));


-- =====================================================================
-- PART 3: ENABLE SUPABASE REALTIME FOR NOTIFICATIONS
-- =====================================================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reseller_notifications;
EXCEPTION WHEN duplicate_object THEN
  -- Table already in publication — this is fine, do nothing.
  NULL;
END $$;


-- =====================================================================
-- VERIFICATION QUERIES (run these after migration to confirm)
-- =====================================================================
-- SELECT tgname, tgrelid::regclass FROM pg_trigger
--   WHERE tgname IN ('on_order_status_change', 'on_payout_status_change');
--
-- SELECT policyname, tablename, cmd FROM pg_policies
--   WHERE tablename IN ('payout_requests', 'reseller_orders', 'reseller_ledger', 'reseller_notifications')
--   ORDER BY tablename, policyname;
