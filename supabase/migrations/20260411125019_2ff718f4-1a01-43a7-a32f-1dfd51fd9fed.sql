-- Add customer_id to orders (nullable for guest checkout)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID;

-- Allow authenticated users to read their own orders
CREATE POLICY "Customers can read own orders"
ON public.orders FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Allow authenticated users to read order items for their orders
CREATE POLICY "Customers can read own order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT id FROM public.orders WHERE customer_id = auth.uid()
  )
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);