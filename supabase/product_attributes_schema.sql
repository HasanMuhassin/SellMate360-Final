-- 1. Attributes Table
CREATE TABLE IF NOT EXISTS public.attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- e.g., 'Color', 'Size'
  type TEXT NOT NULL DEFAULT 'select', -- 'select', 'color', 'radio'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Attribute Options Table
CREATE TABLE IF NOT EXISTS public.attribute_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL, -- e.g., 'Red', 'XL'
  meta JSONB DEFAULT '{}', -- e.g., {"hex": "#FF0000"} for color types
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(attribute_id, value)
);

-- 3. Product Attributes Mapping Table
CREATE TABLE IF NOT EXISTS public.product_attributes (
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.attribute_options(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, attribute_id, option_id)
);

-- 4. Enable RLS and Create Policies
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

-- Allow public read access (Customers need to see attributes)
CREATE POLICY "Public read attributes" ON public.attributes FOR SELECT USING (true);
CREATE POLICY "Public read attribute_options" ON public.attribute_options FOR SELECT USING (true);
CREATE POLICY "Public read product_attributes" ON public.product_attributes FOR SELECT USING (true);

-- Allow authenticated admins/staff to manage attributes
CREATE POLICY "Admins manage attributes" ON public.attributes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage attribute_options" ON public.attribute_options FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage product_attributes" ON public.product_attributes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Optimized Indexes
CREATE INDEX idx_attr_options_attr_id ON public.attribute_options(attribute_id);
CREATE INDEX idx_prod_attr_product_id ON public.product_attributes(product_id);
CREATE INDEX idx_prod_attr_option_id ON public.product_attributes(option_id);
