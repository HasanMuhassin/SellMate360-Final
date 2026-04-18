
INSERT INTO storage.buckets (id, name, public) VALUES ('catalog-images', 'catalog-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view catalog images" ON storage.objects FOR SELECT USING (bucket_id = 'catalog-images');

CREATE POLICY "Admins can upload catalog images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'catalog-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update catalog images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'catalog-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete catalog images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'catalog-images' AND public.has_role(auth.uid(), 'admin'::public.app_role));
