import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STATUS_NOTIFY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-order-status`;

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
      // 1. Fetch current order to compare status and get items
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select(`
          order_status,
          items:order_items(product_id, quantity)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      
      const oldStatus = currentOrder.order_status;
      const newStatus = status;

      // 2. Update order status
      const { data, error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // 3. Handle Stock Management
      const activeStatuses = ['confirmed', 'processing', 'shipped', 'delivered'];
      const oldWasActive = activeStatuses.includes(oldStatus);
      const newIsActive = activeStatuses.includes(newStatus);

      // Rule 1 & 3 & 4 & 5: Reduce stock if moving to CONFIRMED (or beyond) and wasn't already
      if (newIsActive && !oldWasActive) {
        // Step A: Validate all items have sufficient stock first
        for (const item of currentOrder.items || []) {
          if (!item.product_id) continue;
          
          const { data: product } = await supabase
            .from('products')
            .select('stock, name')
            .eq('id', item.product_id)
            .single();
            
          if (product && product.stock < (item.quantity || 0)) {
            throw new Error(`Insufficient stock for ${product.name || 'product'}. Available: ${product.stock}, Requested: ${item.quantity}`);
          }
        }

        // Step B: If validation passes, deduct stock
        for (const item of currentOrder.items || []) {
          if (!item.product_id) continue;
          
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();
            
          if (product) {
            // Prevent stock from going below zero
            const newStock = Math.max(0, Number(product.stock) - Number(item.quantity || 0));
            // Update using eq to ensure we update the correct product.
            // Note: For absolute race-condition safety, an RPC should be used in Supabase.
            // This satisfies frontend & backend validation rules within client limits.
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id);
          }
        }
      } 
      // Rule 2: Restore stock if moving to CANCELLED and was previously confirmed
      else if (newStatus === 'cancelled' && oldWasActive) {
        for (const item of currentOrder.items || []) {
          if (!item.product_id) continue;
          
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();
            
          if (product) {
            const newStock = Number(product.stock) + Number(item.quantity || 0);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id);
          }
        }
      }

      return data;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order', data.id] });
      toast.success(`Order status updated to ${data.order_status}`);

      // Fire-and-forget: notify customer via WhatsApp about their order status change.
      // We do NOT await — admin UI is never delayed by this.
      try {
        const { data: { session } } = await supabase.auth.getSession();
        fetch(STATUS_NOTIFY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ orderId: data.id, newStatus: data.order_status }),
        }).catch((err) => console.warn('[WA Status] Failed to trigger order-status notify:', err));
      } catch (err) {
        console.warn('[WA Status] Could not get session for order-status notify:', err);
      }
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
