-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Public can insert order items (guest checkout)
CREATE POLICY "Anyone can insert order items"
ON public.order_items FOR INSERT
TO public
WITH CHECK (true);

-- Admins can manage all order items
CREATE POLICY "Admins can manage order items"
ON public.order_items FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can read order items (for order confirmation)
CREATE POLICY "Anyone can read order items"
ON public.order_items FOR SELECT
TO public
USING (true);

-- Allow anyone to insert orders (guest checkout)
CREATE POLICY "Anyone can insert orders"
ON public.orders FOR INSERT
TO public
WITH CHECK (true);

-- Index
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);