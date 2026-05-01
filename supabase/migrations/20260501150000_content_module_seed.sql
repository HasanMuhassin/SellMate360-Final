-- ============================================================
-- Migration: Content Module — Fixed RLS + SEO Seed + FAQ Seed
-- Date: 2026-05-01
-- ============================================================

-- 1. ADD MISSING COLUMNS to faq_categories and faqs
ALTER TABLE public.faq_categories
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. CMS PAGES — public read of published pages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='cms_pages' AND policyname='Public read published cms pages'
  ) THEN
    CREATE POLICY "Public read published cms pages"
      ON public.cms_pages FOR SELECT USING (status = 'published');
  END IF;
END $$;

-- 3. ANNOUNCEMENTS — public read of active ones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='announcements' AND policyname='Public read active announcements'
  ) THEN
    CREATE POLICY "Public read active announcements"
      ON public.announcements FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- 4. FAQ CATEGORIES — public read (all, filter done client-side)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='faq_categories' AND policyname='Public read faq categories'
  ) THEN
    CREATE POLICY "Public read faq categories"
      ON public.faq_categories FOR SELECT USING (true);
  END IF;
END $$;

-- 5. FAQS — public read (all, filter done client-side)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='faqs' AND policyname='Public read faqs'
  ) THEN
    CREATE POLICY "Public read faqs"
      ON public.faqs FOR SELECT USING (true);
  END IF;
END $$;

-- 6. SEO SETTINGS — public read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='seo_settings' AND policyname='Public read seo settings'
  ) THEN
    CREATE POLICY "Public read seo settings"
      ON public.seo_settings FOR SELECT USING (true);
  END IF;
END $$;

-- 7. SEED default SEO settings rows
INSERT INTO public.seo_settings (page_type, page_name, meta_title, meta_description, meta_keywords, og_title, og_description, robots_directive, canonical_url)
VALUES
  ('home','Homepage','SellMate360 — Best Deals in Sri Lanka','Shop the best products online. Quality items with island-wide delivery.','online shopping, sri lanka, best deals','SellMate360 — Best Deals','Quality products with fast island-wide delivery.','index,follow','https://sellmate360.lk/'),
  ('shop','Shop','Shop All Products | SellMate360','Browse our full collection of products.','shop, products, buy online, sri lanka','Shop All Products | SellMate360','Browse our full product catalogue.','index,follow','https://sellmate360.lk/shop'),
  ('product','Product Pages','{product_name} | SellMate360','Buy {product_name} online in Sri Lanka.','{product_name}, buy online','{product_name} | SellMate360','Shop {product_name} at the best price.','index,follow','https://sellmate360.lk/product/{slug}'),
  ('category','Category Pages','{category} Products | SellMate360','Explore our {category} collection.','{category}, products','{category} | SellMate360','Browse our {category} collection.','index,follow','https://sellmate360.lk/categories'),
  ('checkout','Checkout','Checkout | SellMate360','Complete your purchase securely.','','Checkout | SellMate360','Secure checkout.','noindex,follow','https://sellmate360.lk/checkout'),
  ('faq','FAQ','Frequently Asked Questions | SellMate360','Find answers to common questions about ordering, delivery, and returns.','faq, help, support','FAQ | SellMate360','Find answers to your questions.','index,follow','https://sellmate360.lk/faq'),
  ('custom','CMS Pages','{page_title} | SellMate360','{page_description}','','{page_title} | SellMate360','{page_description}','index,follow','')
ON CONFLICT DO NOTHING;

-- 8. SEED FAQ categories
INSERT INTO public.faq_categories (name, slug, description, sort_order, is_active)
SELECT 'Shipping & Delivery','shipping-delivery','Questions about delivery times, areas, and tracking',1,true
WHERE NOT EXISTS (SELECT 1 FROM public.faq_categories WHERE slug='shipping-delivery');

INSERT INTO public.faq_categories (name, slug, description, sort_order, is_active)
SELECT 'Orders & Payments','orders-payments','Questions about placing orders and payment methods',2,true
WHERE NOT EXISTS (SELECT 1 FROM public.faq_categories WHERE slug='orders-payments');

INSERT INTO public.faq_categories (name, slug, description, sort_order, is_active)
SELECT 'Returns & Refunds','returns-refunds','Our returns policy and refund process',3,true
WHERE NOT EXISTS (SELECT 1 FROM public.faq_categories WHERE slug='returns-refunds');

-- 9. SEED sample FAQs
INSERT INTO public.faqs (category_id, question, answer, sort_order, is_published)
SELECT c.id,'How long does delivery take?','<p>We deliver island-wide within <strong>1–3 business days</strong>.</p>',1,true
FROM public.faq_categories c WHERE c.slug='shipping-delivery'
AND NOT EXISTS (SELECT 1 FROM public.faqs WHERE question='How long does delivery take?');

INSERT INTO public.faqs (category_id, question, answer, sort_order, is_published)
SELECT c.id,'How can I track my order?','<p>Visit our <a href="/track-order">Track Order</a> page and enter your order number.</p>',2,true
FROM public.faq_categories c WHERE c.slug='shipping-delivery'
AND NOT EXISTS (SELECT 1 FROM public.faqs WHERE question='How can I track my order?');

INSERT INTO public.faqs (category_id, question, answer, sort_order, is_published)
SELECT c.id,'What payment methods do you accept?','<p>We accept Cash on Delivery, Bank Transfer, and PayHere online payment.</p>',1,true
FROM public.faq_categories c WHERE c.slug='orders-payments'
AND NOT EXISTS (SELECT 1 FROM public.faqs WHERE question='What payment methods do you accept?');

INSERT INTO public.faqs (category_id, question, answer, sort_order, is_published)
SELECT c.id,'What is your return policy?','<p>Returns accepted within <strong>7 days</strong> of delivery in original condition.</p>',1,true
FROM public.faq_categories c WHERE c.slug='returns-refunds'
AND NOT EXISTS (SELECT 1 FROM public.faqs WHERE question='What is your return policy?');
