-- =====================================================
-- SELLMATE360 DATABASE SCHEMA
-- Migration 007: Shipping & Courier Management
-- =====================================================

-- Courier partners table
CREATE TABLE public.courier_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    logo_url TEXT,
    api_endpoint TEXT,
    api_key TEXT,  -- Should be encrypted in production
    webhook_url TEXT,
    delivery_zones TEXT[],
    base_rate DECIMAL(10, 2) DEFAULT 0,
    per_kg_rate DECIMAL(10, 2) DEFAULT 0,
    cod_fee DECIMAL(10, 2) DEFAULT 0,
    cod_percentage DECIMAL(5, 2) DEFAULT 0,
    estimated_days INTEGER DEFAULT 3,
    status public.entity_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Shipments table
CREATE TABLE public.shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
    courier_id UUID REFERENCES public.courier_partners(id) ON DELETE RESTRICT NOT NULL,
    
    tracking_number VARCHAR(100),
    waybill_number VARCHAR(100),
    
    -- Package details
    weight DECIMAL(10, 2),
    dimensions JSONB,  -- {length, width, height}
    package_count INTEGER DEFAULT 1,
    
    -- Shipping cost
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    cod_amount DECIMAL(10, 2) DEFAULT 0,
    
    -- Status tracking
    status public.shipment_status DEFAULT 'pending',
    current_location TEXT,
    last_status_update TIMESTAMPTZ,
    
    -- Dates
    estimated_delivery DATE,
    picked_at TIMESTAMPTZ,
    in_transit_at TIMESTAMPTZ,
    out_for_delivery_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    returned_at TIMESTAMPTZ,
    
    -- Delivery confirmation
    received_by VARCHAR(255),
    delivery_signature TEXT,
    delivery_photo TEXT,
    delivery_notes TEXT,
    
    -- Return handling
    return_reason TEXT,
    return_status VARCHAR(50),
    
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Shipment tracking history
CREATE TABLE public.shipment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES public.shipments(id) ON DELETE CASCADE NOT NULL,
    status public.shipment_status NOT NULL,
    location TEXT,
    description TEXT,
    raw_data JSONB,  -- Raw data from courier API
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Delivery zones/rates table
CREATE TABLE public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    districts TEXT[] NOT NULL,
    base_rate DECIMAL(10, 2) NOT NULL,
    per_kg_rate DECIMAL(10, 2) DEFAULT 0,
    free_shipping_threshold DECIMAL(10, 2),
    estimated_days INTEGER DEFAULT 3,
    status public.entity_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_courier_partners_code ON public.courier_partners(code);
CREATE INDEX idx_courier_partners_status ON public.courier_partners(status);

CREATE INDEX idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX idx_shipments_courier_id ON public.shipments(courier_id);
CREATE INDEX idx_shipments_tracking_number ON public.shipments(tracking_number);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_created_at ON public.shipments(created_at DESC);

CREATE INDEX idx_shipment_tracking_shipment_id ON public.shipment_tracking(shipment_id);
CREATE INDEX idx_shipment_tracking_created_at ON public.shipment_tracking(created_at DESC);

CREATE INDEX idx_delivery_zones_status ON public.delivery_zones(status);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update order status on shipment status change
CREATE OR REPLACE FUNCTION public.sync_order_shipment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status = 'picked' THEN
        UPDATE public.orders SET order_status = 'shipped', shipped_at = NOW() WHERE id = NEW.order_id;
    ELSIF NEW.status = 'out_for_delivery' THEN
        UPDATE public.orders SET order_status = 'out_for_delivery' WHERE id = NEW.order_id;
    ELSIF NEW.status = 'delivered' THEN
        UPDATE public.orders SET order_status = 'delivered', delivered_at = NEW.delivered_at WHERE id = NEW.order_id;
    ELSIF NEW.status = 'returned' THEN
        UPDATE public.orders SET order_status = 'returned' WHERE id = NEW.order_id;
    END IF;
    
    NEW.last_status_update = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_shipment_status_change
    BEFORE UPDATE OF status ON public.shipments
    FOR EACH ROW EXECUTE FUNCTION public.sync_order_shipment_status();

-- Add tracking entry on status change
CREATE OR REPLACE FUNCTION public.log_shipment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.shipment_tracking (shipment_id, status, location, description)
        VALUES (NEW.id, NEW.status, NEW.current_location, 'Status changed to ' || NEW.status);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_shipment_status_log
    AFTER UPDATE OF status ON public.shipments
    FOR EACH ROW EXECUTE FUNCTION public.log_shipment_status();

CREATE TRIGGER update_courier_partners_updated_at
    BEFORE UPDATE ON public.courier_partners
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON public.shipments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_zones_updated_at
    BEFORE UPDATE ON public.delivery_zones
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
