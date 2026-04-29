-- =====================================================
-- ADMIN SHIPPING MODULE SCHEMA
-- =====================================================

-- 1. Courier Partners Table
CREATE TABLE IF NOT EXISTS public.courier_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    api_endpoint TEXT,
    api_key TEXT,
    webhook_url TEXT,
    delivery_zones TEXT[] DEFAULT '{}',
    base_rate NUMERIC(10,2) DEFAULT 0,
    per_kg_rate NUMERIC(10,2) DEFAULT 0,
    cod_fee NUMERIC(10,2) DEFAULT 0,
    cod_percentage NUMERIC(5,2) DEFAULT 0,
    estimated_days INTEGER DEFAULT 3,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for courier_partners
ALTER TABLE public.courier_partners ENABLE ROW LEVEL SECURITY;

-- 2. Delivery Zones Table
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    districts TEXT[] DEFAULT '{}',
    base_rate NUMERIC(10,2) DEFAULT 0,
    per_kg_rate NUMERIC(10,2) DEFAULT 0,
    free_shipping_threshold NUMERIC(12,2),
    estimated_days INTEGER DEFAULT 3,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for delivery_zones
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- 3. Shipments Table
CREATE TABLE IF NOT EXISTS public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES public.courier_partners(id),
    tracking_number TEXT NOT NULL UNIQUE,
    waybill_number TEXT,
    weight NUMERIC(10,2),
    dimensions JSONB,
    package_count INTEGER DEFAULT 1,
    shipping_cost NUMERIC(10,2) DEFAULT 0,
    cod_amount NUMERIC(12,2) DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'picked', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'cancelled')),
    current_location TEXT,
    last_status_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    picked_at TIMESTAMP WITH TIME ZONE,
    in_transit_at TIMESTAMP WITH TIME ZONE,
    out_for_delivery_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    received_by TEXT,
    delivery_notes TEXT,
    return_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for shipments
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- 4. Shipment Tracking History Table
CREATE TABLE IF NOT EXISTS public.shipment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    location TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for shipment_tracking
ALTER TABLE public.shipment_tracking ENABLE ROW LEVEL SECURITY;

-- Disable RLS restrictions during testing / internal access for these tables
-- Normally you would restrict this to authenticated admins
CREATE POLICY "Allow all operations for authenticated users" ON public.courier_partners FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for anon" ON public.courier_partners FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.delivery_zones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for anon" ON public.delivery_zones FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.shipments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for anon" ON public.shipments FOR ALL USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.shipment_tracking FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for anon" ON public.shipment_tracking FOR ALL USING (true);

-- Insert a default courier to avoid empty states
INSERT INTO public.courier_partners (name, code, base_rate, per_kg_rate, delivery_zones)
VALUES ('Standard Delivery', 'STD', 350, 75, '{"All Island"}')
ON CONFLICT (code) DO NOTHING;
