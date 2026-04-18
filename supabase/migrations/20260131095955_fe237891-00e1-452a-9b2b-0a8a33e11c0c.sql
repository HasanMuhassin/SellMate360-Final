-- =====================================================
-- RESELLER MODULE TABLES
-- =====================================================

-- Resellers table
CREATE TABLE public.resellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  business_registration TEXT,
  tax_id TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tier TEXT NOT NULL DEFAULT 'silver' CHECK (tier IN ('silver', 'gold', 'platinum')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'blocked', 'rejected')),
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_profit NUMERIC(12,2) NOT NULL DEFAULT 0,
  cod_rejection_count INTEGER NOT NULL DEFAULT 0,
  cod_rejection_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 10,
  available_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(12,2) NOT NULL DEFAULT 0,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  blocked_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Orders table (simplified for reseller order linking)
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  reseller_id UUID REFERENCES public.resellers(id),
  shipping_name TEXT NOT NULL,
  shipping_phone TEXT NOT NULL,
  shipping_email TEXT,
  shipping_district TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_street TEXT NOT NULL,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reseller orders (linking resellers to orders with profit tracking)
CREATE TABLE public.reseller_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reseller_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  profit NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reseller ledger for tracking financial transactions
CREATE TABLE public.reseller_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'payout', 'commission', 'adjustment')),
  reference_id UUID,
  reference_number TEXT,
  credit NUMERIC(12,2) NOT NULL DEFAULT 0,
  debit NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Payout requests
CREATE TABLE public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES public.resellers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  branch TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  payment_proof_url TEXT,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_resellers_updated_at
  BEFORE UPDATE ON public.resellers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payout_requests_updated_at
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- RESELLERS policies
-- Users can read their own reseller profile
CREATE POLICY "Users can read own reseller profile"
  ON public.resellers FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own reseller application
CREATE POLICY "Users can insert own reseller application"
  ON public.resellers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can read all resellers
CREATE POLICY "Admins can read all resellers"
  ON public.resellers FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Admins can update all resellers
CREATE POLICY "Admins can update all resellers"
  ON public.resellers FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- ORDERS policies
-- Resellers can read their own orders
CREATE POLICY "Resellers can read own orders"
  ON public.orders FOR SELECT
  USING (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Admins can manage all orders
CREATE POLICY "Admins can manage orders"
  ON public.orders FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RESELLER_ORDERS policies
-- Resellers can read their own order details
CREATE POLICY "Resellers can read own order details"
  ON public.reseller_orders FOR SELECT
  USING (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Admins can manage reseller orders
CREATE POLICY "Admins can manage reseller orders"
  ON public.reseller_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RESELLER_LEDGER policies
-- Resellers can read their own ledger
CREATE POLICY "Resellers can read own ledger"
  ON public.reseller_ledger FOR SELECT
  USING (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Admins can manage ledger entries
CREATE POLICY "Admins can manage ledger"
  ON public.reseller_ledger FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- PAYOUT_REQUESTS policies
-- Resellers can read their own payout requests
CREATE POLICY "Resellers can read own payout requests"
  ON public.payout_requests FOR SELECT
  USING (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Resellers can insert payout requests
CREATE POLICY "Resellers can insert payout requests"
  ON public.payout_requests FOR INSERT
  WITH CHECK (
    reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid())
  );

-- Admins can manage all payout requests
CREATE POLICY "Admins can manage payout requests"
  ON public.payout_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'));