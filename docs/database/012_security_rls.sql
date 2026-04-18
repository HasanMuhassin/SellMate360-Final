-- =====================================================
-- SELLMATE360 DATABASE SCHEMA
-- Migration 012: Security Functions & RLS Policies
-- =====================================================

-- =====================================================
-- SECURITY DEFINER FUNCTIONS
-- =====================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Check if user is admin or manager
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'manager')
    )
$$;

-- Check if user is staff member (any role)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id
    )
$$;

-- Check if user is an approved reseller
CREATE OR REPLACE FUNCTION public.is_reseller(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.resellers
        WHERE user_id = _user_id AND status = 'approved'
    )
$$;

-- Get user's reseller ID
CREATE OR REPLACE FUNCTION public.get_reseller_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.resellers
    WHERE user_id = _user_id AND status = 'approved'
    LIMIT 1
$$;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_timeline ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cashier_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_return_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.courier_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cod_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_settlements ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_tier_benefits ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: USER MANAGEMENT
-- =====================================================

-- User Roles: Only admins can manage
CREATE POLICY "Admins can manage user roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Profiles: Users can view/edit own, staff can view all
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert profiles"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Addresses: Users manage own
CREATE POLICY "Users can manage own addresses"
    ON public.addresses FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Audit Logs: Only admins
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Login Attempts: Only admins
CREATE POLICY "Admins can view login attempts"
    ON public.login_attempts FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- RLS POLICIES: CATALOG (Public read, Staff write)
-- =====================================================

-- Categories: Public read
CREATE POLICY "Anyone can view active categories"
    ON public.categories FOR SELECT
    USING (status = 'active' OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- Brands: Public read
CREATE POLICY "Anyone can view active brands"
    ON public.brands FOR SELECT
    USING (status = 'active' OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage brands"
    ON public.brands FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- Products: Public read active
CREATE POLICY "Anyone can view active products"
    ON public.products FOR SELECT
    USING (status = 'active' OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage products"
    ON public.products FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- Product Images: Same as products
CREATE POLICY "Anyone can view product images"
    ON public.product_images FOR SELECT
    USING (true);

CREATE POLICY "Staff can manage product images"
    ON public.product_images FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- =====================================================
-- RLS POLICIES: INVENTORY (Staff only)
-- =====================================================

CREATE POLICY "Staff can manage suppliers"
    ON public.suppliers FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage stock movements"
    ON public.stock_movements FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage purchase orders"
    ON public.purchase_orders FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage purchase order items"
    ON public.purchase_order_items FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- =====================================================
-- RLS POLICIES: CUSTOMERS & ORDERS
-- =====================================================

-- Customers: Staff full access, linked user can view own
CREATE POLICY "Staff can manage customers"
    ON public.customers FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Users can view linked customer record"
    ON public.customers FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Customer Addresses: Staff access
CREATE POLICY "Staff can manage customer addresses"
    ON public.customer_addresses FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- Orders: Users see own, Staff see all, Resellers see their orders
CREATE POLICY "Staff can manage all orders"
    ON public.orders FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Users can view own orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (
        customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
        OR reseller_id = public.get_reseller_id(auth.uid())
    );

CREATE POLICY "Resellers can create orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_reseller(auth.uid()) 
        AND reseller_id = public.get_reseller_id(auth.uid())
    );

-- Order Items & Timeline: Same as orders
CREATE POLICY "Staff can manage order items"
    ON public.order_items FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Users can view own order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Staff can manage order timeline"
    ON public.order_timeline FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- =====================================================
-- RLS POLICIES: POS (Staff only)
-- =====================================================

CREATE POLICY "Staff can manage cashier shifts"
    ON public.cashier_shifts FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage POS transactions"
    ON public.pos_transactions FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage POS transaction items"
    ON public.pos_transaction_items FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage POS returns"
    ON public.pos_returns FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage POS return items"
    ON public.pos_return_items FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- =====================================================
-- RLS POLICIES: SHIPPING (Staff manages, Users view own)
-- =====================================================

CREATE POLICY "Anyone can view active couriers"
    ON public.courier_partners FOR SELECT
    USING (status = 'active' OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage couriers"
    ON public.courier_partners FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Staff can manage shipments"
    ON public.shipments FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Users can view own shipments"
    ON public.shipments FOR SELECT
    TO authenticated
    USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Anyone can view shipment tracking"
    ON public.shipment_tracking FOR SELECT
    USING (true);

CREATE POLICY "Staff can manage delivery zones"
    ON public.delivery_zones FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Anyone can view active delivery zones"
    ON public.delivery_zones FOR SELECT
    USING (status = 'active');

-- =====================================================
-- RLS POLICIES: PAYMENTS (Staff manages)
-- =====================================================

CREATE POLICY "Staff can manage payment transactions"
    ON public.payment_transactions FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage COD collections"
    ON public.cod_collections FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage refund requests"
    ON public.refund_requests FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Admins can manage daily settlements"
    ON public.daily_settlements FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

-- =====================================================
-- RLS POLICIES: RESELLERS
-- =====================================================

CREATE POLICY "Staff can manage all resellers"
    ON public.resellers FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Resellers can view own record"
    ON public.resellers FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can apply as reseller"
    ON public.resellers FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can manage reseller orders"
    ON public.reseller_orders FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Resellers can view own orders"
    ON public.reseller_orders FOR SELECT
    TO authenticated
    USING (reseller_id = public.get_reseller_id(auth.uid()));

CREATE POLICY "Staff can manage payouts"
    ON public.payout_requests FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Resellers can view and create own payouts"
    ON public.payout_requests FOR SELECT
    TO authenticated
    USING (reseller_id = public.get_reseller_id(auth.uid()));

CREATE POLICY "Resellers can request payouts"
    ON public.payout_requests FOR INSERT
    TO authenticated
    WITH CHECK (reseller_id = public.get_reseller_id(auth.uid()));

CREATE POLICY "Resellers can view own ledger"
    ON public.reseller_ledger FOR SELECT
    TO authenticated
    USING (reseller_id = public.get_reseller_id(auth.uid()));

CREATE POLICY "Anyone can view tier benefits"
    ON public.reseller_tier_benefits FOR SELECT
    USING (true);

-- =====================================================
-- RLS POLICIES: PROMOTIONS
-- =====================================================

CREATE POLICY "Anyone can view active coupons"
    ON public.coupons FOR SELECT
    USING (status = 'active' OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage coupons"
    ON public.coupons FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "System can record coupon usage"
    ON public.coupon_usage FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Staff can view coupon usage"
    ON public.coupon_usage FOR SELECT
    TO authenticated
    USING (public.is_staff(auth.uid()));

CREATE POLICY "Anyone can view active promotions"
    ON public.promotions FOR SELECT
    USING (status = 'active' OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage promotions"
    ON public.promotions FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

-- =====================================================
-- RLS POLICIES: CONTENT
-- =====================================================

CREATE POLICY "Anyone can view active banners"
    ON public.banners FOR SELECT
    USING (status = 'active' OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage banners"
    ON public.banners FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Anyone can view published pages"
    ON public.cms_pages FOR SELECT
    USING (status = 'published' OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage pages"
    ON public.cms_pages FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Anyone can view FAQs"
    ON public.faq_categories FOR SELECT
    USING (status = 'active');

CREATE POLICY "Anyone can view FAQ items"
    ON public.faqs FOR SELECT
    USING (status = 'active');

CREATE POLICY "Staff can manage FAQs"
    ON public.faq_categories FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage FAQ items"
    ON public.faqs FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage notification templates"
    ON public.notification_templates FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Anyone can view active branches"
    ON public.branches FOR SELECT
    USING (status = 'active' OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage branches"
    ON public.branches FOR ALL
    TO authenticated
    USING (public.is_admin_or_manager(auth.uid()))
    WITH CHECK (public.is_admin_or_manager(auth.uid()));

CREATE POLICY "Staff can manage media"
    ON public.media FOR ALL
    TO authenticated
    USING (public.is_staff(auth.uid()))
    WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Anyone can view media"
    ON public.media FOR SELECT
    USING (true);
