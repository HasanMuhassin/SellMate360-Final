-- =====================================================
-- ADMIN NOTIFICATION TRIGGERS
-- =====================================================

-- 1. Function to handle New Orders
CREATE OR REPLACE FUNCTION notify_admin_new_order()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.admin_notifications (title, message, type, link)
  VALUES (
    'New Order Received',
    'Order #' || NEW.order_number || ' has been placed for Rs. ' || NEW.total || '.',
    'info',
    '/admin/orders'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_order ON public.orders;
CREATE TRIGGER trigger_notify_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION notify_admin_new_order();


-- 2. Function to handle Support Tickets
CREATE OR REPLACE FUNCTION notify_admin_new_ticket()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.admin_notifications (title, message, type, link)
  VALUES (
    'New Support Ticket',
    'Ticket #' || NEW.ticket_number || ' (' || NEW.subject || ') has been submitted.',
    'warning',
    '/admin/support'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_ticket ON public.support_tickets;
CREATE TRIGGER trigger_notify_new_ticket
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION notify_admin_new_ticket();


-- 3. Function to handle Payout Requests
CREATE OR REPLACE FUNCTION notify_admin_payout_request()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.admin_notifications (title, message, type, link)
  VALUES (
    'New Payout Request',
    'A reseller requested a payout of Rs. ' || NEW.amount || '.',
    'info',
    '/admin/resellers'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_payout_request ON public.payout_requests;
CREATE TRIGGER trigger_notify_payout_request
  AFTER INSERT ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION notify_admin_payout_request();


-- 4. Function to handle Stock Movement (Adjustments)
CREATE OR REPLACE FUNCTION notify_admin_stock_adjustment()
RETURNS trigger AS $$
BEGIN
  IF NEW.type = 'adjustment' THEN
    INSERT INTO public.admin_notifications (title, message, type, link)
    VALUES (
      'Inventory Adjusted',
      'Manual stock adjustment recorded for a product.',
      'warning',
      '/admin/inventory'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_stock_adjustment ON public.stock_movements;
CREATE TRIGGER trigger_notify_stock_adjustment
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION notify_admin_stock_adjustment();


-- 5. Function to handle Product Stock Levels (Low Stock / Out of Stock)
CREATE OR REPLACE FUNCTION notify_admin_stock_levels()
RETURNS trigger AS $$
BEGIN
  -- Out of stock alert
  IF NEW.stock <= 0 AND OLD.stock > 0 THEN
    INSERT INTO public.admin_notifications (title, message, type, link)
    VALUES (
      'Product Out of Stock',
      NEW.name || ' (' || NEW.sku || ') has run out of stock.',
      'critical',
      '/admin/products'
    );
  -- Low stock alert
  ELSIF NEW.stock <= NEW.low_stock_threshold AND OLD.stock > NEW.low_stock_threshold AND NEW.stock > 0 THEN
    INSERT INTO public.admin_notifications (title, message, type, link)
    VALUES (
      'Low Stock Alert',
      NEW.name || ' (' || NEW.sku || ') is running low (' || NEW.stock || ' remaining).',
      'warning',
      '/admin/products'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_stock_levels ON public.products;
CREATE TRIGGER trigger_notify_stock_levels
  AFTER UPDATE OF stock ON public.products
  FOR EACH ROW EXECUTE FUNCTION notify_admin_stock_levels();


-- 6. Function to handle COD Rejections
CREATE OR REPLACE FUNCTION notify_admin_cod_rejection()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    INSERT INTO public.admin_notifications (title, message, type, link)
    VALUES (
      'COD Payment Rejected',
      'A COD collection was marked as rejected.',
      'critical',
      '/admin/orders'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_cod_rejection ON public.cod_collections;
CREATE TRIGGER trigger_notify_cod_rejection
  AFTER UPDATE OF status ON public.cod_collections
  FOR EACH ROW EXECUTE FUNCTION notify_admin_cod_rejection();
