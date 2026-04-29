-- =====================================================
-- CONTENT & SEO MODULES SCHEMA
-- =====================================================

-- 1. CMS Pages
CREATE TABLE IF NOT EXISTS public.cms_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    show_in_footer BOOLEAN DEFAULT true,
    show_in_menu BOOLEAN DEFAULT true,
    menu_position INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to cms_pages" ON public.cms_pages;
CREATE POLICY "Allow public access to cms_pages" ON public.cms_pages FOR SELECT USING (status = 'published');
CREATE POLICY "Allow authenticated access to cms_pages" ON public.cms_pages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    link TEXT,
    link_text TEXT,
    background_color TEXT DEFAULT '#000000',
    text_color TEXT DEFAULT '#ffffff',
    position TEXT DEFAULT 'top' CHECK (position IN ('top', 'bottom')),
    show_close_button BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    target_pages TEXT[] DEFAULT '{"all"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access to announcements" ON public.announcements;
CREATE POLICY "Allow public access to announcements" ON public.announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Allow authenticated access to announcements" ON public.announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. SEO Settings
CREATE TABLE IF NOT EXISTS public.seo_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_type TEXT NOT NULL,
    page_name TEXT NOT NULL,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    canonical_url TEXT,
    robots_directive TEXT DEFAULT 'index, follow',
    structured_data JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(page_type, page_name)
);

-- Enable RLS
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to seo_settings" ON public.seo_settings;
CREATE POLICY "Allow authenticated access to seo_settings" ON public.seo_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
