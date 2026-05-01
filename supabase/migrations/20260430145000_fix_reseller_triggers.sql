-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
DROP TRIGGER IF EXISTS on_payout_status_change ON public.payout_requests;

-- Recreate trigger functions with defensive programming and explicit casting
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
