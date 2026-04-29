-- =====================================================
-- MEDIA LIBRARY MODULE SCHEMA
-- =====================================================

-- 1. Media Folders
CREATE TABLE IF NOT EXISTS public.media_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    parent_id UUID REFERENCES public.media_folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(slug, parent_id)
);

-- Enable RLS for media_folders
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to media_folders" ON public.media_folders;
CREATE POLICY "Allow authenticated access to media_folders" ON public.media_folders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Media Items
CREATE TABLE IF NOT EXISTS public.media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    original_filename TEXT,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    folder_id UUID REFERENCES public.media_folders(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    alt_text TEXT,
    uploaded_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for media_items
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to media_items" ON public.media_items;
CREATE POLICY "Allow authenticated access to media_items" ON public.media_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed some default folders
INSERT INTO public.media_folders (name, slug)
VALUES 
    ('Products', 'products'),
    ('Banners', 'banners'),
    ('Blog', 'blog'),
    ('General', 'general')
ON CONFLICT (slug, parent_id) DO NOTHING;
