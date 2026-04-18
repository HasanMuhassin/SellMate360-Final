-- =====================================================
-- SELLMATE360 DATABASE SCHEMA
-- Migration 010: Promotions & Coupons
-- =====================================================

-- Coupons table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    
    -- Discount details
    type public.coupon_type NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    
    -- Constraints
    min_order_value DECIMAL(12, 2),
    max_discount DECIMAL(12, 2),
    
    -- Usage limits
    usage_limit INTEGER,
    usage_per_user INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    
    -- Validity
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    
    -- Restrictions
    applicable_categories UUID[],
    applicable_products UUID[],
    excluded_products UUID[],
    
    -- User restrictions
    first_order_only BOOLEAN DEFAULT false,
    reseller_only BOOLEAN DEFAULT false,
    
    -- Status
    status public.coupon_status DEFAULT 'active',
    
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Coupon usage tracking
CREATE TABLE public.coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    
    discount_amount DECIMAL(12, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    UNIQUE(coupon_id, order_id)
);

-- Flash sales / Promotions
CREATE TABLE public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    
    -- Discount
    discount_type public.coupon_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    
    -- Products
    applicable_categories UUID[],
    applicable_products UUID[],
    
    -- Validity
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    
    -- Display
    banner_image TEXT,
    badge_text VARCHAR(50),
    badge_color VARCHAR(20),
    
    status public.entity_status DEFAULT 'active',
    
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_status ON public.coupons(status);
CREATE INDEX idx_coupons_valid_dates ON public.coupons(valid_from, valid_to);

CREATE INDEX idx_coupon_usage_coupon_id ON public.coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_order_id ON public.coupon_usage(order_id);
CREATE INDEX idx_coupon_usage_user_id ON public.coupon_usage(user_id);

CREATE INDEX idx_promotions_slug ON public.promotions(slug);
CREATE INDEX idx_promotions_status ON public.promotions(status);
CREATE INDEX idx_promotions_dates ON public.promotions(starts_at, ends_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Increment coupon usage count
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.coupons 
    SET used_count = used_count + 1
    WHERE id = NEW.coupon_id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_coupon_used
    AFTER INSERT ON public.coupon_usage
    FOR EACH ROW EXECUTE FUNCTION public.increment_coupon_usage();

-- Auto-expire coupons
CREATE OR REPLACE FUNCTION public.auto_expire_coupons()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.coupons 
    SET status = 'expired'
    WHERE status = 'active' AND valid_to < NOW();
END;
$$;

-- Auto-deactivate fully used coupons
CREATE OR REPLACE FUNCTION public.check_coupon_usage_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.usage_limit IS NOT NULL AND NEW.used_count >= NEW.usage_limit THEN
        NEW.status = 'inactive';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_coupon_usage_update
    BEFORE UPDATE OF used_count ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.check_coupon_usage_limit();

CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
    BEFORE UPDATE ON public.promotions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- HELPER FUNCTION: Validate Coupon
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_coupon(
    p_code VARCHAR,
    p_user_id UUID,
    p_order_total DECIMAL
)
RETURNS TABLE (
    is_valid BOOLEAN,
    coupon_id UUID,
    discount_amount DECIMAL,
    error_message TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_coupon RECORD;
    v_user_usage INTEGER;
    v_discount DECIMAL;
BEGIN
    -- Get coupon
    SELECT * INTO v_coupon FROM public.coupons 
    WHERE code = UPPER(p_code) AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Invalid coupon code'::TEXT;
        RETURN;
    END IF;
    
    -- Check validity period
    IF NOW() < v_coupon.valid_from OR NOW() > v_coupon.valid_to THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Coupon has expired or not yet valid'::TEXT;
        RETURN;
    END IF;
    
    -- Check usage limit
    IF v_coupon.usage_limit IS NOT NULL AND v_coupon.used_count >= v_coupon.usage_limit THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'Coupon usage limit reached'::TEXT;
        RETURN;
    END IF;
    
    -- Check per-user limit
    IF p_user_id IS NOT NULL AND v_coupon.usage_per_user IS NOT NULL THEN
        SELECT COUNT(*) INTO v_user_usage 
        FROM public.coupon_usage 
        WHERE coupon_id = v_coupon.id AND user_id = p_user_id;
        
        IF v_user_usage >= v_coupon.usage_per_user THEN
            RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 'You have already used this coupon'::TEXT;
            RETURN;
        END IF;
    END IF;
    
    -- Check minimum order value
    IF v_coupon.min_order_value IS NOT NULL AND p_order_total < v_coupon.min_order_value THEN
        RETURN QUERY SELECT false, NULL::UUID, 0::DECIMAL, 
            ('Minimum order value is ' || v_coupon.min_order_value)::TEXT;
        RETURN;
    END IF;
    
    -- Calculate discount
    IF v_coupon.type = 'percentage' THEN
        v_discount = p_order_total * (v_coupon.value / 100);
        IF v_coupon.max_discount IS NOT NULL THEN
            v_discount = LEAST(v_discount, v_coupon.max_discount);
        END IF;
    ELSE
        v_discount = v_coupon.value;
    END IF;
    
    RETURN QUERY SELECT true, v_coupon.id, v_discount, NULL::TEXT;
END;
$$;
