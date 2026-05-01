import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/useAuth';
import type { Reseller, ResellerOrder, ResellerLedger, PayoutRequest, Order } from '@/types/database';

// Fields required for reseller application (server defaults the rest)
interface ResellerApplicationData {
  business_name: string;
  business_registration?: string | null;
  tax_id?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

// =====================================================
// RESELLER QUERIES
// =====================================================

export function useReseller() {
  const { user } = useSession();

  return useQuery({
    queryKey: ['reseller', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('reseller_metrics_view' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Reseller | null;
    },
    enabled: !!user,
  });
}

export function useIsApprovedReseller() {
  const { data: reseller, isLoading, error } = useReseller();
  
  return {
    isApprovedReseller: reseller?.status === 'approved',
    reseller,
    isLoading,
    error,
    status: reseller?.status ?? null,
  };
}

export function useResellerStatus() {
  const { data: reseller, isLoading } = useReseller();
  
  return {
    hasApplied: !!reseller,
    status: reseller?.status ?? null,
    isLoading,
    reseller,
  };
}

// =====================================================
// RESELLER ORDERS
// =====================================================

interface ResellerOrderWithDetails extends ResellerOrder {
  order?: Order;
}

export function useResellerOrders(resellerId?: string, options?: { limit?: number }) {
  return useQuery({
    queryKey: ['reseller-orders', resellerId, options],
    queryFn: async () => {
      if (!resellerId) return [];
      
      let query = supabase
        .from('reseller_orders')
        .select(`
          *,
          order:orders(
            id,
            order_number,
            order_status,
            shipping_name,
            shipping_phone,
            total,
            created_at
          )
        `)
        .eq('reseller_id', resellerId)
        .order('created_at', { ascending: false });
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ResellerOrderWithDetails[];
    },
    enabled: !!resellerId,
  });
}

// =====================================================
// RESELLER LEDGER
// =====================================================

export function useResellerLedger(resellerId?: string, options?: { limit?: number }) {
  return useQuery({
    queryKey: ['reseller-ledger', resellerId, options],
    queryFn: async () => {
      if (!resellerId) return [];
      
      let query = supabase
        .from('reseller_ledger')
        .select('*')
        .eq('reseller_id', resellerId)
        .order('created_at', { ascending: false });
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ResellerLedger[];
    },
    enabled: !!resellerId,
  });
}

// =====================================================
// PAYOUT REQUESTS
// =====================================================

export function usePayoutRequests(resellerId?: string) {
  return useQuery({
    queryKey: ['payout-requests', resellerId],
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
// COD & PERFORMANCE STATS
// =====================================================

export function useResellerCODStats(resellerId?: string) {
  return useQuery({
    queryKey: ['reseller-cod-stats', resellerId],
    queryFn: async () => {
      if (!resellerId) return { pendingCollection: 0, totalCodOrders: 0, successRate: 100 };

      // Get all COD orders for this reseller
      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, order_status, payment_status')
        .eq('reseller_id', resellerId)
        .eq('payment_method', 'cod');

      if (error) throw error;

      const stats = {
        pendingCollection: orders
          ?.filter(o => ['shipped', 'out_for_delivery'].includes(o.order_status) && o.payment_status === 'pending')
          .reduce((sum, o) => sum + Number(o.total), 0) || 0,
        totalCodOrders: orders?.length || 0,
        successRate: 100, // Default if no orders
      };

      if (stats.totalCodOrders > 0) {
        const successful = orders.filter(o => o.order_status === 'delivered').length;
        const failed = orders.filter(o => o.order_status === 'returned').length;
        if (successful + failed > 0) {
          stats.successRate = Math.round((successful / (successful + failed)) * 100);
        }
      }

      return stats;
    },
    enabled: !!resellerId,
  });
}

// =====================================================
// RESELLER MUTATIONS
// =====================================================

export function useApplyAsReseller() {
  const queryClient = useQueryClient();
  const { user } = useSession();

  return useMutation({
    mutationFn: async (application: ResellerApplicationData) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('resellers')
        .insert({
          ...application,
          user_id: user.id,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller', user?.id] });
    },
  });
}

interface PayoutRequestData {
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  branch?: string | null;
}

export function useCreatePayoutRequest() {
  const queryClient = useQueryClient();
  const { data: reseller } = useReseller();

  return useMutation({
    mutationFn: async (request: PayoutRequestData) => {
      if (!reseller) throw new Error('Reseller not found');
      
      const { data, error } = await supabase
        .from('payout_requests')
        .insert({
          reseller_id: reseller.id,
          ...request,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-requests', reseller?.id] });
    },
  });
}

// =====================================================
// ORDER PLACEMENT
// =====================================================

interface OrderItem {
  productId: string;
  productSku: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  unitPrice: number;
  resellerPrice: number;
}

interface PlaceOrderData {
  customerName: string;
  customerPhone: string;
  customerDistrict: string;
  customerCity: string;
  customerAddress: string;
  items: OrderItem[];
  deliveryFee: number;
}

export function usePlaceResellerOrder() {
  const queryClient = useQueryClient();
  const { data: reseller } = useReseller();

  return useMutation({
    mutationFn: async (orderData: PlaceOrderData) => {
      if (!reseller) throw new Error('Reseller not found');

      // Calculate totals
      const subtotal = orderData.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );
      const resellerSubtotal = orderData.items.reduce(
        (sum, item) => sum + item.resellerPrice * item.quantity,
        0
      );
      const profit = subtotal - resellerSubtotal;
      const total = subtotal + orderData.deliveryFee;

      // Generate order number
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          reseller_id: reseller.id,
          shipping_name: orderData.customerName,
          shipping_phone: orderData.customerPhone,
          shipping_district: orderData.customerDistrict,
          shipping_city: orderData.customerCity,
          shipping_street: orderData.customerAddress,
          subtotal,
          delivery_fee: orderData.deliveryFee,
          total,
          order_status: 'pending',
          payment_method: 'cod',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = orderData.items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_sku: item.productSku,
        product_name: item.productName,
        product_image: item.productImage || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: 0,
        total: item.unitPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create reseller order record for profit tracking
      const { error: resellerOrderError } = await supabase
        .from('reseller_orders')
        .insert({
          reseller_id: reseller.id,
          order_id: order.id,
          reseller_price: resellerSubtotal,
          selling_price: subtotal,
          profit,
          commission_amount: 0,
          is_paid: false,
        });

      if (resellerOrderError) throw resellerOrderError;

      return { order, profit };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['reseller'] });
    },
  });
}

// =====================================================
// NOTIFICATIONS
// =====================================================

export interface ResellerNotification {
  id: string;
  reseller_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export function useResellerNotifications(resellerId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!resellerId) return;

    const channel = supabase
      .channel(`reseller_notifications_${resellerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reseller_notifications',
          filter: `reseller_id=eq.${resellerId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['reseller-notifications', resellerId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [resellerId, qc]);

  return useQuery({
    queryKey: ['reseller-notifications', resellerId],
    queryFn: async () => {
      if (!resellerId) return [];
      
      const { data, error } = await supabase
        .from('reseller_notifications')
        .select('*')
        .eq('reseller_id', resellerId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ResellerNotification[];
    },
    enabled: !!resellerId,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { data: reseller } = useReseller();

  return useMutation({
    mutationFn: async (notificationId: string | 'all') => {
      if (!reseller) throw new Error('Reseller not found');
      
      let query = supabase.from('reseller_notifications').update({ is_read: true });
      
      if (notificationId === 'all') {
        query = query.eq('reseller_id', reseller.id).eq('is_read', false);
      } else {
        query = query.eq('id', notificationId).eq('reseller_id', reseller.id);
      }
      
      const { error } = await query;
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reseller-notifications', reseller?.id] });
    },
  });
}

