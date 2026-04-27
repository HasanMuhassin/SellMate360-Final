import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, startOfMonth, format } from 'date-fns';

export interface DashboardStats {
  todaySales: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  monthlyRevenue: number;
}

export interface SalesDataPoint {
  date: string;
  total: number;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  order_status: string;
  total: number;
  shipping_name: string;
  created_at: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const monthStart = startOfMonth(new Date()).toISOString();

      // Fetch orders, POS transactions, POS returns, and products in parallel
      const [ordersRes, posRes, returnsRes, lowStockRes] = await Promise.all([
        supabase.from('orders').select('total, order_status, created_at'),
        supabase.from('pos_transactions').select('total, status, created_at').eq('status', 'completed'),
        supabase.from('pos_returns').select('refund_amount, status, created_at').eq('status', 'completed'),
        supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', 5).eq('status', 'active'),
      ]);

      if (ordersRes.error) throw ordersRes.error;

      const orders = ordersRes.data || [];
      const posTransactions = posRes.data || [];
      const posReturns = returnsRes.data || [];

      const stats: DashboardStats = {
        todaySales: 0,
        totalOrders: orders.length + posTransactions.length,
        pendingOrders: 0,
        lowStockProducts: lowStockRes.count ?? 0,
        monthlyRevenue: 0,
      };

      for (const o of orders) {
        if (o.order_status === 'pending') stats.pendingOrders++;
        if (o.created_at >= today) stats.todaySales += Number(o.total);
        if (o.created_at >= monthStart) stats.monthlyRevenue += Number(o.total);
      }

      for (const t of posTransactions) {
        if (t.created_at >= today) stats.todaySales += Number(t.total);
        if (t.created_at >= monthStart) stats.monthlyRevenue += Number(t.total);
      }

      for (const r of posReturns) {
        if (r.created_at >= today) stats.todaySales -= Number(r.refund_amount);
        if (r.created_at >= monthStart) stats.monthlyRevenue -= Number(r.refund_amount);
      }

      // Ensure sales don't go negative just in case
      stats.todaySales = Math.max(0, stats.todaySales);
      stats.monthlyRevenue = Math.max(0, stats.monthlyRevenue);

      return stats;
    },
    refetchInterval: 30000, // refresh every 30s
  });
}

export function useSalesChart() {
  return useQuery({
    queryKey: ['dashboard-sales-chart'],
    queryFn: async () => {
      const sevenDaysAgo = subDays(new Date(), 6);
      const startDate = startOfDay(sevenDaysAgo).toISOString();

      const { data, error } = await supabase
        .from('orders')
        .select('total, created_at')
        .gte('created_at', startDate)
        .neq('order_status', 'cancelled');

      if (error) throw error;

      // Group by day
      const byDay: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
        byDay[d] = 0;
      }

      for (const o of data || []) {
        const day = format(new Date(o.created_at), 'yyyy-MM-dd');
        if (byDay[day] !== undefined) {
          byDay[day] += Number(o.total);
        }
      }

      return Object.entries(byDay).map(([date, total]) => ({ date, total })) as SalesDataPoint[];
    },
  });
}

export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ['dashboard-recent-orders', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, order_status, total, shipping_name, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as RecentOrder[];
    },
  });
}

export function useLowStockProducts(threshold = 5) {
  return useQuery({
    queryKey: ['dashboard-low-stock', threshold],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, stock')
        .lte('stock', threshold)
        .eq('status', 'active')
        .order('stock', { ascending: true })
        .limit(10);

      if (error) throw error;
      return (data || []) as LowStockProduct[];
    },
  });
}
