import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Order, OrderItem, OrderTimeline, OrderStatus } from '@/types/database';

// =====================================================
// QUERIES
// =====================================================

export function useOrders(options?: {
  status?: OrderStatus;
  customer_id?: string;
  channel?: 'online' | 'pos';
  limit?: number;
  from_date?: string;
  to_date?: string;
}) {
  return useQuery({
    queryKey: ['orders', options],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('order_status', options.status);
      }
      if (options?.customer_id) {
        query = query.eq('customer_id', options.customer_id);
      }
      if (options?.channel) {
        query = query.eq('channel', options.channel);
      }
      if (options?.from_date) {
        query = query.gte('created_at', options.from_date);
      }
      if (options?.to_date) {
        query = query.lte('created_at', options.to_date);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(*),
          timeline:order_timeline(*)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Order | null;
    },
    enabled: !!id,
  });
}

export function useOrderByNumber(orderNumber: string) {
  return useQuery({
    queryKey: ['order', 'number', orderNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*),
          items:order_items(*),
          timeline:order_timeline(*)
        `)
        .eq('order_number', orderNumber)
        .maybeSingle();
      
      if (error) throw error;
      return data as Order | null;
    },
    enabled: !!orderNumber,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      order, 
      items 
    }: { 
      order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'order_number' | 'customer' | 'items' | 'timeline'>;
      items: Omit<OrderItem, 'id' | 'created_at' | 'order_id'>[];
    }) => {
      // Create order first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Add items with order_id
      if (items.length > 0) {
        const orderItems = items.map(item => ({
          ...item,
          order_id: orderData.id,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (itemsError) throw itemsError;
      }

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const updateData: Partial<Order> = { order_status: status };
      
      // Set timestamp based on status
      if (status === 'confirmed') updateData.confirmed_at = new Date().toISOString();
      if (status === 'shipped') updateData.shipped_at = new Date().toISOString();
      if (status === 'delivered') updateData.delivered_at = new Date().toISOString();
      if (status === 'cancelled') updateData.cancelled_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.id] });
    },
  });
}

export function useAddOrderNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      order_id, 
      status, 
      note 
    }: { 
      order_id: string; 
      status: string; 
      note?: string;
    }) => {
      const { data, error } = await supabase
        .from('order_timeline')
        .insert({ order_id, status, note })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['order', data.order_id] });
    },
  });
}
