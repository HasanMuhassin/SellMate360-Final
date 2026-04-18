import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-reports`;

async function callReports(action: string, payload: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

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
      return callReports('sales_report', { days });
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
      return callReports('inventory_report');
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
      return callReports('products_report', { days });
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
      return callReports('payments_report', { days });
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
      return callReports('resellers_report');
    },
  });
}
