import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ---- Sales Report ----
export interface SalesReportData {
  date: string;
  onlineSales: number;
  posSales: number;
  totalSales: number;
  orders: number;
  avgOrderValue: number;
}

export interface PaymentReport {
  method: string;
  transactions: number;
  amount: number;
  percentage: number;
  avgTransaction: number;
  successRate: number;
}

export interface MonthlySummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  grossProfit: number;
  profitMargin: number;
  topCategory: string;
  newCustomers: number;
  returningCustomers: number;
  returnRate: number;
}

export function useSalesReport(days = 30) {
  return useQuery({
    queryKey: ['reports', 'sales', days],
    queryFn: async (): Promise<{ dailyData: SalesReportData[]; paymentReports: PaymentReport[]; summary: MonthlySummary }> => {
      // Basic implementation querying orders
      const last30d = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', last30d);
      
      if (error) throw error;

      // Group by day
      const dailyMap = new Map<string, SalesReportData>();
      let totalRev = 0;
      
      orders?.forEach(o => {
        const date = new Date(o.created_at).toISOString().split('T')[0];
        const current = dailyMap.get(date) || { date, onlineSales: 0, posSales: 0, totalSales: 0, orders: 0, avgOrderValue: 0 };
        current.onlineSales += o.total_amount;
        current.totalSales += o.total_amount;
        current.orders += 1;
        totalRev += o.total_amount;
        dailyMap.set(date, current);
      });

      const dailyData = Array.from(dailyMap.values());

      return {
        dailyData,
        paymentReports: [],
        summary: {
          totalRevenue: totalRev,
          totalOrders: orders?.length || 0,
          avgOrderValue: (orders?.length || 0) > 0 ? totalRev / (orders?.length || 1) : 0,
          grossProfit: totalRev * 0.3, // Placeholder
          profitMargin: 30,
          topCategory: 'Electronics',
          newCustomers: 0,
          returningCustomers: 0,
          returnRate: 0
        }
      };
    },
  });
}

// ---- Inventory Report ----
export interface InventoryReportItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  stockValue: number;
  turnoverRate: number;
  daysOfStock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
}

export function useInventoryReport() {
  return useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: async (): Promise<InventoryReportItem[]> => {
      const { data: products, error } = await supabase
        .from('products')
        .select('*, categories(name)');
      
      if (error) throw error;

      return (products || []).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku || '',
        category: (p as any).categories?.name || 'General',
        currentStock: p.stock || 0,
        reservedStock: 0,
        availableStock: p.stock || 0,
        reorderPoint: 10,
        stockValue: (p.stock || 0) * (p.price || 0),
        turnoverRate: 0,
        daysOfStock: 30,
        status: (p.stock || 0) > 10 ? 'in_stock' : (p.stock || 0) > 0 ? 'low_stock' : 'out_of_stock'
      }));
    },
  });
}

// ---- Products Report ----
export interface ProductPerformance {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  returnRate: number;
  stockLevel: number;
  trend: 'up' | 'down' | 'stable';
}

export function useProductsReport(days = 30) {
  return useQuery({
    queryKey: ['reports', 'products', days],
    queryFn: async (): Promise<ProductPerformance[]> => {
      // Very basic placeholder
      const { data: products, error } = await supabase.from('products').select('*').limit(20);
      if (error) throw error;
      return (products || []).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku || '',
        category: 'General',
        unitsSold: 0,
        revenue: 0,
        profit: 0,
        profitMargin: 0,
        returnRate: 0,
        stockLevel: p.stock || 0,
        trend: 'stable'
      }));
    },
  });
}

// ---- Payments Report ----
export interface PaymentDailyData {
  date: string;
  cod: number;
  card: number;
  cash: number;
  bank: number;
}

export function usePaymentsReport(days = 30) {
  return useQuery({
    queryKey: ['reports', 'payments', days],
    queryFn: async (): Promise<{ paymentReports: PaymentReport[]; dailyPayments: PaymentDailyData[] }> => {
      return { paymentReports: [], dailyPayments: [] };
    },
  });
}

// ---- Resellers Report ----
export interface ResellerCommission {
  id: string;
  resellerId: string;
  resellerName: string;
  tier: 'silver' | 'gold' | 'platinum';
  totalOrders: number;
  totalSales: number;
  commissionRate: number;
  earnedCommission: number;
  paidCommission: number;
  pendingCommission: number;
  codRejectionRate: number;
  period: string;
}

export function useResellersReport() {
  return useQuery({
    queryKey: ['reports', 'resellers'],
    queryFn: async (): Promise<ResellerCommission[]> => {
      return [];
    },
  });
}
