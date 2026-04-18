import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerOrder {
  id: string;
  order_number: string;
  order_status: string;
  total: number;
  created_at: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_district: string;
  shipping_city: string;
  shipping_street: string;
  items: CustomerOrderItem[];
}

export interface CustomerOrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export function useCustomerOrders() {
  return useQuery({
    queryKey: ['customer-orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Find customer record linked to this auth user
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!customer) return [];

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!orders || orders.length === 0) return [];

      // Fetch order items for all orders
      const orderIds = orders.map(o => o.id);
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      return orders.map(order => ({
        ...order,
        items: (items || []).filter((item: any) => item.order_id === order.id) as CustomerOrderItem[],
      })) as CustomerOrder[];
    },
  });
}
