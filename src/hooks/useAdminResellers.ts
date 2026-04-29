import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  Reseller, 
  ResellerOrder, 
  ResellerLedger, 
  PayoutRequest, 
  ResellerTierBenefit,
  ApprovalStatus,
  ResellerTier,
  PayoutStatus
} from '@/types/database';

// =====================================================
// ADMIN RESELLER QUERIES
// =====================================================

interface ResellerFilters {
  status?: ApprovalStatus | 'all';
  tier?: ResellerTier | 'all';
  search?: string;
}

export function useAdminResellers(filters?: ResellerFilters) {
  return useQuery({
    queryKey: ['admin-resellers', filters],
    queryFn: async () => {
      let query = supabase
        .from('reseller_metrics_view' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.tier && filters.tier !== 'all') {
        query = query.eq('tier', filters.tier);
      }

      if (filters?.search) {
        query = query.or(
          `business_name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Reseller[];
    },
  });
}

export function useAdminResellerById(id?: string) {
  return useQuery({
    queryKey: ['admin-reseller', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('reseller_metrics_view' as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Reseller;
    },
    enabled: !!id,
  });
}

export function useResellerApplications() {
  return useQuery({
    queryKey: ['reseller-applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reseller_metrics_view' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Reseller[];
    },
  });
}

// =====================================================
// RESELLER ORDERS (Admin View)
// =====================================================

interface ResellerOrderWithOrder extends ResellerOrder {
  order?: {
    id: string;
    order_number: string;
    order_status: string;
    shipping_name: string;
    shipping_phone: string;
    created_at: string;
  };
}

export function useAdminResellerOrders(resellerId?: string) {
  return useQuery({
    queryKey: ['admin-reseller-orders', resellerId],
    queryFn: async () => {
      if (!resellerId) return [];

      const { data, error } = await supabase
        .from('reseller_orders')
        .select('*')
        .eq('reseller_id', resellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ResellerOrder[];
    },
    enabled: !!resellerId,
  });
}

// =====================================================
// RESELLER LEDGER (Admin View)
// =====================================================

export function useAdminResellerLedger(resellerId?: string) {
  return useQuery({
    queryKey: ['admin-reseller-ledger', resellerId],
    queryFn: async () => {
      if (!resellerId) return [];

      const { data, error } = await supabase
        .from('reseller_ledger')
        .select('*')
        .eq('reseller_id', resellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ResellerLedger[];
    },
    enabled: !!resellerId,
  });
}

// =====================================================
// PAYOUT REQUESTS (Admin View)
// =====================================================

interface PayoutRequestWithReseller extends PayoutRequest {
  reseller?: Reseller;
}

export function useAdminPayoutRequests(filters?: { status?: PayoutStatus | 'all' }) {
  return useQuery({
    queryKey: ['admin-payout-requests', filters],
    queryFn: async () => {
      let query = supabase
        .from('payout_requests')
        .select(`
          *,
          reseller:resellers(id, business_name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PayoutRequestWithReseller[];
    },
  });
}

export function useAdminResellerPayouts(resellerId?: string) {
  return useQuery({
    queryKey: ['admin-reseller-payouts', resellerId],
    queryFn: async () => {
      if (!resellerId) return [];

      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('reseller_id', resellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PayoutRequest[];
    },
    enabled: !!resellerId,
  });
}

// =====================================================
// TIER BENEFITS
// =====================================================

export function useResellerTierBenefits() {
  return useQuery({
    queryKey: ['reseller-tier-benefits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reseller_tier_benefits')
        .select('*')
        .order('discount_percentage', { ascending: true });

      if (error) throw error;
      return data as ResellerTierBenefit[];
    },
  });
}

// =====================================================
// STATS AGGREGATION
// =====================================================

export function useResellerStats() {
  const { data: resellers } = useAdminResellers();

  const stats = {
    total: resellers?.length ?? 0,
    active: resellers?.filter((r) => r.status === 'approved').length ?? 0,
    pending: resellers?.filter((r) => r.status === 'pending').length ?? 0,
    blocked: resellers?.filter((r) => r.status === 'blocked').length ?? 0,
    totalRevenue: resellers?.reduce((sum, r) => sum + Number(r.total_revenue), 0) ?? 0,
  };

  return stats;
}

// =====================================================
// MUTATIONS
// =====================================================

export function useApproveReseller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resellerId, approvedBy }: { resellerId: string; approvedBy?: string }) => {
      const { data, error } = await supabase
        .from('resellers')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: approvedBy ?? null,
        })
        .eq('id', resellerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resellers'] });
      queryClient.invalidateQueries({ queryKey: ['reseller-applications'] });
    },
  });
}

export function useRejectReseller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resellerId, reason }: { resellerId: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('resellers')
        .update({
          status: 'rejected',
          blocked_reason: reason ?? null,
        })
        .eq('id', resellerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resellers'] });
      queryClient.invalidateQueries({ queryKey: ['reseller-applications'] });
    },
  });
}

export function useBlockReseller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resellerId, reason }: { resellerId: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('resellers')
        .update({
          status: 'blocked',
          blocked_reason: reason ?? null,
        })
        .eq('id', resellerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resellers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reseller'] });
    },
  });
}

export function useUnblockReseller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resellerId: string) => {
      const { data, error } = await supabase
        .from('resellers')
        .update({
          status: 'approved',
          blocked_reason: null,
        })
        .eq('id', resellerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resellers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reseller'] });
    },
  });
}

export function useUpdateResellerTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resellerId, tier }: { resellerId: string; tier: ResellerTier }) => {
      const { data, error } = await supabase
        .from('resellers')
        .update({ tier })
        .eq('id', resellerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-resellers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reseller'] });
    },
  });
}

// =====================================================
// PAYOUT MUTATIONS
// =====================================================

export function useApprovePayoutRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payoutId, approvedBy }: { payoutId: string; approvedBy?: string }) => {
      const { data, error } = await supabase
        .from('payout_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: approvedBy ?? null,
        })
        .eq('id', payoutId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payout-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reseller-payouts'] });
    },
  });
}

export function useRejectPayoutRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payoutId, reason }: { payoutId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('payout_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', payoutId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payout-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reseller-payouts'] });
    },
  });
}

export function useProcessPayoutRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payoutId,
      paymentReference,
      paymentProofUrl,
      processedBy,
    }: {
      payoutId: string;
      paymentReference: string;
      paymentProofUrl?: string;
      processedBy?: string;
    }) => {
      const { data, error } = await supabase
        .from('payout_requests')
        .update({
          status: 'paid',
          processed_at: new Date().toISOString(),
          processed_by: processedBy ?? null,
          payment_reference: paymentReference,
          payment_proof_url: paymentProofUrl ?? null,
        })
        .eq('id', payoutId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payout-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reseller-payouts'] });
    },
  });
}

// =====================================================
// TIER BENEFIT MUTATIONS
// =====================================================

export function useUpdateTierBenefit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ResellerTierBenefit>;
    }) => {
      const { data, error } = await supabase
        .from('reseller_tier_benefits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-tier-benefits'] });
    },
  });
}
