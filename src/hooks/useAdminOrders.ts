import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types matching the actual DB schema
export interface DbOrder {
  id: string;
  order_number: string;
  order_status: string;
  total: number;
  customer_id: string | null;
  reseller_id: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_email: string | null;
  shipping_district: string;
  shipping_city: string;
  shipping_street: string;
  created_at: string;
  updated_at: string;
  items?: DbOrderItem[];
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// =====================================================
// QUERIES
// =====================================================

export function useAdminOrders(options?: {
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['admin-orders', options],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (options?.status && options.status !== 'all') {
        query = query.eq('order_status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DbOrder[];
    },
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as DbOrder | null;
    },
    enabled: !!id,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ order_status: status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order', data.id] });
      toast.success(`Order status updated to ${data.order_status}`);
    },
    onError: (error) => {
      toast.error('Failed to update order status: ' + error.message);
    },
  });
}

// Order stats computed from data
export function computeOrderStats(orders: DbOrder[]) {
  return {
    total: orders.length,
    pending: orders.filter(o => o.order_status === 'pending').length,
    confirmed: orders.filter(o => o.order_status === 'confirmed').length,
    processing: orders.filter(o => o.order_status === 'processing').length,
    shipped: orders.filter(o => o.order_status === 'shipped').length,
    delivered: orders.filter(o => o.order_status === 'delivered').length,
    cancelled: orders.filter(o => o.order_status === 'cancelled').length,
  };
}
