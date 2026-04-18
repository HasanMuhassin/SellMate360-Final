-- =====================================================
-- SELLMATE360 DATABASE SCHEMA
-- Migration 001: Enums and Types
-- =====================================================

-- User roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff', 'cashier');

-- Status enums
CREATE TYPE public.entity_status AS ENUM ('active', 'inactive');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'blocked', 'rejected');

-- Product related enums
CREATE TYPE public.stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
CREATE TYPE public.stock_movement_type AS ENUM ('in', 'out', 'adjustment', 'transfer');

-- Order related enums
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned');
CREATE TYPE public.payment_method AS ENUM ('cod', 'bank', 'card', 'online');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'verified', 'failed', 'refunded');
CREATE TYPE public.order_channel AS ENUM ('online', 'pos');
CREATE TYPE public.risk_score AS ENUM ('low', 'medium', 'high');

-- Shipping enums
CREATE TYPE public.shipment_status AS ENUM ('pending', 'picked', 'in_transit', 'out_for_delivery', 'delivered', 'returned', 'failed');

-- POS enums
CREATE TYPE public.shift_status AS ENUM ('open', 'closed');
CREATE TYPE public.pos_transaction_status AS ENUM ('completed', 'refunded', 'partial_refund', 'voided');
CREATE TYPE public.return_status AS ENUM ('pending', 'completed', 'rejected');
CREATE TYPE public.refund_method AS ENUM ('cash', 'card', 'store_credit', 'original_method');

-- Reseller enums
CREATE TYPE public.reseller_tier AS ENUM ('silver', 'gold', 'platinum');
CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- COD collection enums
CREATE TYPE public.cod_status AS ENUM ('pending', 'collected', 'remitted', 'rejected');

-- Content enums
CREATE TYPE public.coupon_type AS ENUM ('percentage', 'fixed');
CREATE TYPE public.coupon_status AS ENUM ('active', 'inactive', 'expired');
CREATE TYPE public.page_status AS ENUM ('published', 'draft');
CREATE TYPE public.branch_type AS ENUM ('store', 'warehouse');
CREATE TYPE public.notification_type AS ENUM ('whatsapp', 'sms', 'email');

-- Audit log level
CREATE TYPE public.audit_level AS ENUM ('info', 'warning', 'critical');
