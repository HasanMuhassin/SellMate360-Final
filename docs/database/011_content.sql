-- =====================================================
-- SELLMATE360 DATABASE SCHEMA
-- Migration 011: Content Management (CMS)
-- =====================================================

-- Banners table
CREATE TABLE public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    link TEXT,
    
    -- Display settings
    position INTEGER DEFAULT 0,
    display_location VARCHAR(50) DEFAULT 'home',  -- home, category, checkout, etc.
    
    -- Validity
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    
    status public.entity_status DEFAULT 'active',
    
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- CMS Pages table
CREATE TABLE public.cms_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    
    -- Display
    show_in_footer BOOLEAN DEFAULT false,
    show_in_menu BOOLEAN DEFAULT false,
    menu_position INTEGER DEFAULT 0,
    
    status public.page_status DEFAULT 'draft',
    
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- FAQ categories
CREATE TABLE public.faq_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    position INTEGER DEFAULT 0,
    status public.entity_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- FAQs
CREATE TABLE public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.faq_categories(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    status public.entity_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Notification templates
CREATE TABLE public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type public.notification_type NOT NULL,
    trigger_event VARCHAR(50) NOT NULL,  -- order_placed, order_shipped, etc.
    
    subject VARCHAR(255),  -- For email
    content TEXT NOT NULL,
    
    -- Variables available: {customer_name}, {order_number}, {tracking_url}, etc.
    
    status public.entity_status DEFAULT 'active',
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    UNIQUE(type, trigger_event)
);

-- Branches/Stores table
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE,
    type public.branch_type DEFAULT 'store',
    
    -- Location
    address TEXT NOT NULL,
    city VARCHAR(100),
    district VARCHAR(100),
    
    -- Contact
    phone VARCHAR(20),
    email VARCHAR(255),
    manager_name VARCHAR(255),
    
    -- Operating hours
    opening_hours JSONB,  -- {mon: {open: "09:00", close: "18:00"}, ...}
    
    -- Settings
    is_pickup_location BOOLEAN DEFAULT false,
    accepts_returns BOOLEAN DEFAULT true,
    
    status public.entity_status DEFAULT 'active',
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Media library
CREATE TABLE public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    
    -- Metadata
    width INTEGER,
    height INTEGER,
    alt_text VARCHAR(255),
    
    -- Organization
    folder VARCHAR(100) DEFAULT 'general',
    tags TEXT[],
    
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_banners_position ON public.banners(position);
CREATE INDEX idx_banners_display_location ON public.banners(display_location);
CREATE INDEX idx_banners_status ON public.banners(status);

CREATE INDEX idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX idx_cms_pages_status ON public.cms_pages(status);

CREATE INDEX idx_faq_categories_slug ON public.faq_categories(slug);
CREATE INDEX idx_faqs_category_id ON public.faqs(category_id);

CREATE INDEX idx_notification_templates_trigger ON public.notification_templates(trigger_event);

CREATE INDEX idx_branches_type ON public.branches(type);
CREATE INDEX idx_branches_status ON public.branches(status);

CREATE INDEX idx_media_folder ON public.media(folder);
CREATE INDEX idx_media_mime_type ON public.media(mime_type);
CREATE INDEX idx_media_tags ON public.media USING GIN(tags);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_banners_updated_at
    BEFORE UPDATE ON public.banners
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_pages_updated_at
    BEFORE UPDATE ON public.cms_pages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON public.notification_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_branches_updated_at
    BEFORE UPDATE ON public.branches
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SEED DEFAULT NOTIFICATION TEMPLATES
-- =====================================================
INSERT INTO public.notification_templates (name, type, trigger_event, subject, content) VALUES
('Order Confirmation', 'whatsapp', 'order_placed', NULL, 'Hi {customer_name}! 🎉 Your order #{order_number} has been received. Total: LKR {order_total}. We''ll notify you when it ships!'),
('Order Shipped', 'whatsapp', 'order_shipped', NULL, 'Great news {customer_name}! 📦 Your order #{order_number} is on its way. Track: {tracking_url}'),
('Order Delivered', 'whatsapp', 'order_delivered', NULL, 'Hi {customer_name}! ✅ Your order #{order_number} has been delivered. Thank you for shopping with us!'),
('Order Confirmation Email', 'email', 'order_placed', 'Order Confirmed - #{order_number}', '<h1>Thank you for your order!</h1><p>Hi {customer_name},</p><p>Your order #{order_number} has been confirmed.</p>'),
('Shipping Update Email', 'email', 'order_shipped', 'Your order is on the way! - #{order_number}', '<h1>Your order has shipped!</h1><p>Hi {customer_name},</p><p>Track your package: {tracking_url}</p>')
ON CONFLICT (type, trigger_event) DO NOTHING;
