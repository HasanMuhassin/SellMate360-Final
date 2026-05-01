-- ============================================================
-- Migration: Product Attributes — Fix RLS & Seed Data
-- Date: 2026-05-01
-- ============================================================

-- 1. Ensure tables exist (just in case they were partially created or missing)
CREATE TABLE IF NOT EXISTS public.attributes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  type character varying NOT NULL DEFAULT 'select'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT attributes_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.attribute_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL,
  value character varying NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT attribute_options_pkey PRIMARY KEY (id),
  CONSTRAINT attribute_options_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attributes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.product_attributes (
  product_id uuid NOT NULL,
  attribute_id uuid NOT NULL,
  option_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_attributes_pkey PRIMARY KEY (product_id, attribute_id, option_id),
  CONSTRAINT product_attributes_attribute_id_fkey FOREIGN KEY (attribute_id) REFERENCES public.attributes(id) ON DELETE CASCADE,
  CONSTRAINT product_attributes_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.attribute_options(id) ON DELETE CASCADE,
  CONSTRAINT product_attributes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for Attributes

-- Attributes Table Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attributes' AND policyname = 'Public read access for attributes') THEN
    CREATE POLICY "Public read access for attributes" ON public.attributes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attributes' AND policyname = 'Admin all access for attributes') THEN
    CREATE POLICY "Admin all access for attributes" ON public.attributes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Attribute Options Table Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attribute_options' AND policyname = 'Public read access for attribute options') THEN
    CREATE POLICY "Public read access for attribute options" ON public.attribute_options FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attribute_options' AND policyname = 'Admin all access for attribute options') THEN
    CREATE POLICY "Admin all access for attribute options" ON public.attribute_options FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Product Attributes Table Policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_attributes' AND policyname = 'Public read access for product attributes') THEN
    CREATE POLICY "Public read access for product attributes" ON public.product_attributes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_attributes' AND policyname = 'Admin all access for product attributes') THEN
    CREATE POLICY "Admin all access for product attributes" ON public.product_attributes FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. Seed Default Attributes Data (Only if empty)
DO $$
DECLARE
  size_attr_id uuid;
  color_attr_id uuid;
BEGIN
  -- Check if attributes table is empty before seeding
  IF NOT EXISTS (SELECT 1 FROM public.attributes) THEN
    
    -- Insert "Size" attribute
    INSERT INTO public.attributes (name, type) VALUES ('Size', 'size') RETURNING id INTO size_attr_id;
    
    -- Insert options for "Size"
    INSERT INTO public.attribute_options (attribute_id, value) VALUES
      (size_attr_id, 'Small'),
      (size_attr_id, 'Medium'),
      (size_attr_id, 'Large'),
      (size_attr_id, 'Extra Large');

    -- Insert "Color" attribute
    INSERT INTO public.attributes (name, type) VALUES ('Color', 'color') RETURNING id INTO color_attr_id;
    
    -- Insert options for "Color" with HEX meta data
    INSERT INTO public.attribute_options (attribute_id, value, meta) VALUES
      (color_attr_id, 'Black', '{"hex": "#000000"}'),
      (color_attr_id, 'White', '{"hex": "#ffffff"}'),
      (color_attr_id, 'Red', '{"hex": "#ef4444"}'),
      (color_attr_id, 'Blue', '{"hex": "#3b82f6"}');

  END IF;
END $$;
