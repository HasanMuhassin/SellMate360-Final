-- Create reseller_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.reseller_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS safely
ALTER TABLE public.reseller_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist so we can recreate them correctly
DROP POLICY IF EXISTS "Resellers can view their own notifications" ON public.reseller_notifications;
DROP POLICY IF EXISTS "Resellers can update their own notifications" ON public.reseller_notifications;
DROP POLICY IF EXISTS "Admins can manage all reseller notifications" ON public.reseller_notifications;

-- Recreate Policies with correct ::app_role casting
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

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
DROP TRIGGER IF EXISTS on_payout_status_change ON public.payout_requests;

-- Recreate trigger functions with defensive programming
CREATE OR REPLACE FUNCTION public.notify_reseller_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if the order belongs to a reseller and status changed
  IF NEW.reseller_id IS NOT NULL AND OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    BEGIN
      INSERT INTO public.reseller_notifications (reseller_id, title, message, type)
      VALUES (
        NEW.reseller_id,
        'Order Status Updated',
        'Order #' || COALESCE(NEW.order_number, '') || ' status is now ' || COALESCE(NEW.order_status, '') || '.',
        CASE 
          WHEN NEW.order_status IN ('delivered', 'shipped') THEN 'success'
          WHEN NEW.order_status IN ('cancelled', 'returned') THEN 'error'
          WHEN NEW.order_status IN ('packed', 'processing') THEN 'info'
          ELSE 'info'
        END
      );
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the transaction
      RAISE WARNING 'Failed to insert reseller notification for order %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_reseller_payout_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    BEGIN
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
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but don't fail the transaction
      RAISE WARNING 'Failed to insert reseller notification for payout %: %', NEW.id, SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Triggers
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF order_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reseller_order_status();

CREATE TRIGGER on_payout_status_change
  AFTER UPDATE OF status ON public.payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reseller_payout_status();
