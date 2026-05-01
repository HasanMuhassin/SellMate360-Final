-- Fix the trigger to throw errors properly and add an INSERT policy

-- Add INSERT policy for safety in case SECURITY DEFINER doesn't bypass RLS
DROP POLICY IF EXISTS "System can insert notifications" ON public.reseller_notifications;
CREATE POLICY "System can insert notifications"
  ON public.reseller_notifications FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.notify_reseller_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if the order belongs to a reseller and status changed
  IF NEW.reseller_id IS NOT NULL AND OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    INSERT INTO public.reseller_notifications (reseller_id, title, message, type)
    VALUES (
      NEW.reseller_id,
      'Order Status Updated',
      'Order #' || COALESCE(NEW.order_number, '') || ' status is now ' || COALESCE(NEW.order_status::text, '') || '.',
      CASE 
        WHEN NEW.order_status::text IN ('delivered', 'shipped') THEN 'success'
        WHEN NEW.order_status::text IN ('cancelled', 'returned') THEN 'error'
        WHEN NEW.order_status::text IN ('packed', 'processing') THEN 'info'
        ELSE 'info'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_reseller_payout_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.reseller_notifications (reseller_id, title, message, type)
    VALUES (
      NEW.reseller_id,
      'Payout Request ' || initcap(COALESCE(NEW.status, '')),
      'Your payout request for Rs. ' || COALESCE(NEW.amount::text, '0') || ' has been ' || COALESCE(NEW.status, '') || '.',
      CASE 
        WHEN NEW.status = 'paid' THEN 'success'
        WHEN NEW.status = 'approved' THEN 'info'
        WHEN NEW.status = 'rejected' THEN 'error'
        ELSE 'info'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
