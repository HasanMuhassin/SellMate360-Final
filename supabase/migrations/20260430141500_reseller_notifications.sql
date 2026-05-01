-- Create reseller_notifications table
CREATE TABLE public.reseller_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reseller_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
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
  USING (has_role(auth.uid(), 'admin'));

-- Trigger Function for Order Status Changes
CREATE OR REPLACE FUNCTION public.notify_reseller_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if the order belongs to a reseller and status changed
  IF NEW.reseller_id IS NOT NULL AND OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    INSERT INTO public.reseller_notifications (reseller_id, title, message, type)
    VALUES (
      NEW.reseller_id,
      'Order Status Updated',
      'Order #' || NEW.order_number || ' status is now ' || NEW.order_status || '.',
      CASE 
        WHEN NEW.order_status IN ('delivered', 'shipped') THEN 'success'
        WHEN NEW.order_status IN ('cancelled', 'returned') THEN 'error'
        WHEN NEW.order_status IN ('packed', 'processing') THEN 'info'
        ELSE 'info'
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function for Payout Status Changes
CREATE OR REPLACE FUNCTION public.notify_reseller_payout_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.reseller_notifications (reseller_id, title, message, type)
    VALUES (
      NEW.reseller_id,
      'Payout Request ' || initcap(NEW.status),
      'Your payout request for Rs. ' || NEW.amount || ' has been ' || NEW.status || '.',
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

-- Attach Triggers
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE OF order_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reseller_order_status();

DROP TRIGGER IF EXISTS on_payout_status_change ON public.payout_requests;
CREATE TRIGGER on_payout_status_change
  AFTER UPDATE OF status ON public.payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reseller_payout_status();
