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
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      // Fetch orders with nested order_items + product cost_price + category name
      const [ordersRes, posRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total, order_status, payment_method, customer_id, created_at, order_items(quantity, unit_price, total, products(cost_price, categories(name)))')
          .gte('created_at', startDate),
        supabase.from('pos_transactions').select('*').gte('created_at', startDate).eq('status', 'completed')
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (posRes.error) throw posRes.error;

      const orders = ordersRes.data || [];
      const posTx = posRes.data || [];

      // Initialize daily map
      const dailyMap = new Map<string, SalesReportData>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        dailyMap.set(dateStr, { date: dateStr, onlineSales: 0, posSales: 0, totalSales: 0, orders: 0, avgOrderValue: 0 });
      }

      let totalRev = 0;
      let totalOrdersCount = 0;
      let totalGrossProfit = 0;
      let returnedOrCancelledCount = 0;
      let totalOrdersAllStatuses = 0;
      const customerOrderCount = new Map<string, number>();
      const categoryRevMap = new Map<string, number>();

      orders.forEach(o => {
        totalOrdersAllStatuses++;
        if (o.order_status === 'returned' || o.order_status === 'cancelled') returnedOrCancelledCount++;
        if (o.customer_id) {
          customerOrderCount.set(o.customer_id, (customerOrderCount.get(o.customer_id) || 0) + 1);
        }

        const isValid = o.order_status !== 'cancelled' && o.order_status !== 'returned';
        const date = new Date(o.created_at).toISOString().split('T')[0];
        const orderTotal = Number(o.total) || 0;

        if (dailyMap.has(date) && isValid) {
          const current = dailyMap.get(date)!;
          current.onlineSales += orderTotal;
          current.totalSales += orderTotal;
          current.orders += 1;
          totalRev += orderTotal;
          totalOrdersCount += 1;
        }

        // Real gross profit = SUM(qty × (unit_price - cost_price))
        const items: any[] = (o as any).order_items || [];
        items.forEach((item: any) => {
          const qty = Number(item.quantity) || 0;
          const unitPrice = Number(item.unit_price) || 0;
          const costPrice = Number(item.products?.cost_price) || 0;
          if (isValid) {
            totalGrossProfit += qty * (unitPrice - costPrice);
            const catName = item.products?.categories?.name || 'Uncategorized';
            const itemRevenue = Number(item.total_price) || (unitPrice * qty);
            categoryRevMap.set(catName, (categoryRevMap.get(catName) || 0) + itemRevenue);
          }
        });
      });

      posTx.forEach(p => {
        const date = new Date(p.created_at).toISOString().split('T')[0];
        if (dailyMap.has(date)) {
          const current = dailyMap.get(date)!;
          current.posSales += Number(p.total) || 0;
          current.totalSales += Number(p.total) || 0;
          current.orders += 1;
          totalRev += Number(p.total) || 0;
          totalOrdersCount += 1;
        }
      });

      const dailyData = Array.from(dailyMap.values()).map(d => ({
        ...d,
        avgOrderValue: d.orders > 0 ? d.totalSales / d.orders : 0
      }));

      // Payment method breakdown
      const paymentMap = new Map<string, { tx: number; amount: number }>();
      const addPayment = (method: string, amount: number) => {
        const m = method?.toLowerCase() || 'unknown';
        const cur = paymentMap.get(m) || { tx: 0, amount: 0 };
        cur.tx += 1;
        cur.amount += amount;
        paymentMap.set(m, cur);
      };
      orders.filter(o => o.order_status !== 'cancelled' && o.order_status !== 'returned')
            .forEach(o => addPayment((o as any).payment_method || 'cod', Number(o.total) || 0));
      posTx.forEach(p => addPayment(p.payment_method || 'cash', Number(p.total) || 0));

      const paymentReports = Array.from(paymentMap.entries()).map(([method, data]) => ({
        method: method.toUpperCase(),
        transactions: data.tx,
        amount: data.amount,
        percentage: totalRev > 0 ? Math.round((data.amount / totalRev) * 100) : 0,
        avgTransaction: data.tx > 0 ? data.amount / data.tx : 0,
        successRate: 100
      }));

      // Top category by revenue
      let topCategory = 'N/A';
      let topCatRev = 0;
      categoryRevMap.forEach((rev, cat) => { if (rev > topCatRev) { topCatRev = rev; topCategory = cat; } });

      // New (1 order) vs returning (2+ orders) customers
      let newCustomers = 0;
      let returningCustomers = 0;
      customerOrderCount.forEach(count => { if (count === 1) newCustomers++; else returningCustomers++; });

      const returnRate = totalOrdersAllStatuses > 0
        ? Math.round((returnedOrCancelledCount / totalOrdersAllStatuses) * 100)
        : 0;
      const profitMargin = totalRev > 0 ? Math.round((totalGrossProfit / totalRev) * 100) : 0;

      return {
        dailyData,
        paymentReports,
        summary: {
          totalRevenue: totalRev,
          totalOrders: totalOrdersCount,
          avgOrderValue: totalOrdersCount > 0 ? totalRev / totalOrdersCount : 0,
          grossProfit: totalGrossProfit,
          profitMargin,
          topCategory,
          newCustomers,
          returningCustomers,
          returnRate
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
  isDeadStock: boolean;
}

export function useInventoryReport() {
  return useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: async (): Promise<InventoryReportItem[]> => {
      const date90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      const date30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime();

      const [productsRes, orderItemsRes, posItemsRes] = await Promise.all([
        supabase.from('products').select('*, categories(name)'),
        supabase.from('order_items').select('*, orders!inner(created_at, order_status)').gte('orders.created_at', date90d).neq('orders.order_status', 'cancelled'),
        supabase.from('pos_transaction_items').select('*, pos_transactions!inner(created_at, status)').gte('pos_transactions.created_at', date90d).eq('pos_transactions.status', 'completed')
      ]);

      if (productsRes.error) throw productsRes.error;

      const products = productsRes.data || [];
      const orderItems = orderItemsRes.data || [];
      const posItems = posItemsRes.data || [];

      return products.map(p => {
        let sold30d = 0;
        let sold90d = 0;

        orderItems.filter((oi: any) => oi.product_id === p.id).forEach((oi: any) => {
          const qty = oi.quantity || 0;
          sold90d += qty;
          if (new Date(oi.orders.created_at).getTime() >= date30d) {
            sold30d += qty;
          }
        });

        posItems.filter((pi: any) => pi.product_id === p.id).forEach((pi: any) => {
          const qty = pi.quantity || 0;
          sold90d += qty;
          if (new Date(pi.pos_transactions.created_at).getTime() >= date30d) {
            sold30d += qty;
          }
        });

        const stock = p.stock || 0;
        const price = Number(p.selling_price) || Number(p.price) || 0;
        const avgDailySales = sold30d / 30;
        
        // Average inventory approximation
        const avgInventory = Math.max(1, stock + (sold30d / 2));
        const turnoverRate = Number((sold30d / avgInventory).toFixed(2));
        
        const daysOfStock = avgDailySales > 0 ? Math.round(stock / avgDailySales) : -1;
        
        // Reorder point = (Avg Daily Sales * Lead Time) + Safety Stock
        const reorderPoint = Math.max(Math.ceil((avgDailySales * 7) + 5), 5);
        
        // Max threshold for overstock
        const maxThreshold = Math.max(Math.ceil(avgDailySales * 30), 20);

        let status: InventoryReportItem['status'] = 'in_stock';
        if (stock === 0) status = 'out_of_stock';
        else if (stock <= reorderPoint) status = 'low_stock';
        else if (stock > maxThreshold) status = 'overstock';

        return {
          id: p.id,
          name: p.name,
          sku: p.sku || 'N/A',
          category: (p as any).categories?.name || 'Uncategorized',
          currentStock: stock,
          reservedStock: 0,
          availableStock: stock,
          reorderPoint,
          stockValue: stock * price,
          turnoverRate,
          daysOfStock,
          status,
          isDeadStock: stock > 0 && sold90d === 0
        };
      });
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
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // Fetch products
      const { data: products, error: pErr } = await supabase.from('products').select('*, categories(name)');
      if (pErr) throw pErr;

      // Fetch recent valid orders and POS transactions
      const [ordersRes, posRes] = await Promise.all([
        supabase.from('orders').select('id').gte('created_at', startDate).neq('order_status', 'cancelled'),
        supabase.from('pos_transactions').select('id').gte('created_at', startDate).eq('status', 'completed')
      ]);

      const orderIds = (ordersRes.data || []).map(o => o.id);
      const posIds = (posRes.data || []).map(p => p.id);

      // Fetch the items for these orders
      let orderItems: any[] = [];
      let posItems: any[] = [];

      if (orderIds.length > 0) {
        const chunked = [];
        for (let i = 0; i < orderIds.length; i += 100) {
          chunked.push(orderIds.slice(i, i + 100));
        }
        for (const chunk of chunked) {
          const { data } = await supabase.from('order_items').select('*').in('order_id', chunk);
          if (data) orderItems.push(...data);
        }
      }

      if (posIds.length > 0) {
        const chunked = [];
        for (let i = 0; i < posIds.length; i += 100) {
          chunked.push(posIds.slice(i, i + 100));
        }
        for (const chunk of chunked) {
          const { data } = await supabase.from('pos_transaction_items').select('*').in('transaction_id', chunk);
          if (data) posItems.push(...data);
        }
      }

      return (products || []).map(p => {
        let unitsSold = 0;
        let revenue = 0;

        orderItems.filter((oi: any) => oi.product_id === p.id).forEach((oi: any) => {
          const qty = oi.quantity || 0;
          const itemTotal = Number(oi.total_price) || (Number(oi.unit_price) * qty) || (Number(p.selling_price) * qty) || 0;
          unitsSold += qty;
          revenue += itemTotal;
        });

        posItems.filter((pi: any) => pi.product_id === p.id).forEach((pi: any) => {
          const qty = pi.quantity || 0;
          const itemTotal = Number(pi.total_price) || (Number(pi.unit_price) * qty) || (Number(p.selling_price) * qty) || 0;
          unitsSold += qty;
          revenue += itemTotal;
        });

        // Real profit: SUM(qty × (sold_unit_price - product.cost_price))
        let profit = 0;
        orderItems.filter((oi: any) => oi.product_id === p.id).forEach((oi: any) => {
          const qty = Number(oi.quantity) || 0;
          const unitPrice = Number(oi.unit_price) || Number(p.selling_price) || 0;
          const costPrice = Number((p as any).cost_price) || 0;
          profit += qty * (unitPrice - costPrice);
        });
        posItems.filter((pi: any) => pi.product_id === p.id).forEach((pi: any) => {
          const qty = Number(pi.quantity) || 0;
          const unitPrice = Number(pi.unit_price) || Number(p.selling_price) || 0;
          const costPrice = Number((p as any).cost_price) || 0;
          profit += qty * (unitPrice - costPrice);
        });

        return {
          id: p.id,
          name: p.name,
          sku: p.sku || 'N/A',
          category: (p as any).categories?.name || 'Uncategorized',
          unitsSold,
          revenue,
          profit,
          profitMargin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
          returnRate: 0,
          stockLevel: p.stock || 0,
          trend: unitsSold > 10 ? 'up' : unitsSold === 0 ? 'down' : 'stable'
        };
      });
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
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      
      const [ordersRes, posRes] = await Promise.all([
        supabase.from('orders').select('*').gte('created_at', startDate),
        supabase.from('pos_transactions').select('*').gte('created_at', startDate).eq('status', 'completed')
      ]);

      const orders = ordersRes.data || [];
      const posTx = posRes.data || [];

      const dailyMap = new Map<string, PaymentDailyData>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        dailyMap.set(dateStr, { date: dateStr, cod: 0, card: 0, cash: 0, bank: 0 });
      }

      const paymentMap = new Map<string, { tx: number; amount: number }>();
      const addPayment = (method: string, amount: number, dateStr: string) => {
        const m = method?.toLowerCase() || 'unknown';
        const cur = paymentMap.get(m) || { tx: 0, amount: 0 };
        cur.tx += 1;
        cur.amount += amount;
        paymentMap.set(m, cur);

        if (dailyMap.has(dateStr)) {
          const d = dailyMap.get(dateStr)!;
          if (m === 'cod') d.cod += amount;
          else if (m === 'card') d.card += amount;
          else if (m === 'cash') d.cash += amount;
          else if (m === 'bank' || m === 'online') d.bank += amount;
        }
      };

      orders.forEach(o => {
        const date = new Date(o.created_at).toISOString().split('T')[0];
        addPayment(o.payment_method || 'cod', Number(o.total) || 0, date);
      });
      posTx.forEach(p => {
        const date = new Date(p.created_at).toISOString().split('T')[0];
        addPayment(p.payment_method || 'cash', Number(p.total) || 0, date);
      });

      let totalRev = 0;
      paymentMap.forEach(v => totalRev += v.amount);

      const paymentReports = Array.from(paymentMap.entries()).map(([method, data]) => ({
        method: method.toUpperCase(),
        transactions: data.tx,
        amount: data.amount,
        percentage: totalRev > 0 ? Math.round((data.amount / totalRev) * 100) : 0,
        avgTransaction: data.tx > 0 ? data.amount / data.tx : 0,
        successRate: 100
      }));

      return {
        paymentReports,
        dailyPayments: Array.from(dailyMap.values())
      };
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
      const [resellersRes, ordersRes] = await Promise.all([
        supabase.from('resellers').select('*'),
        supabase.from('orders').select('reseller_id, total, order_status').not('reseller_id', 'is', null)
      ]);

      if (resellersRes.error) throw resellersRes.error;

      const resellers = resellersRes.data || [];
      const orders = ordersRes.data || [];

      return resellers.map(r => {
        const resellerOrders = orders.filter(o => o.reseller_id === r.id);
        
        // Orders that are valid (not cancelled)
        const validOrders = resellerOrders.filter(o => o.order_status !== 'cancelled' && o.order_status !== 'returned');
        
        // Dynamic aggregation
        const dynTotalOrders = validOrders.length;
        const dynTotalSales = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        
        // Calculate COD rejection rate dynamically
        const rejectedOrders = resellerOrders.filter(o => o.order_status === 'returned' || o.order_status === 'cancelled').length;
        const dynamicRejectionRate = resellerOrders.length > 0 ? (rejectedOrders / resellerOrders.length) * 100 : 0;
        
        const commRate = Number(r.commission_rate) || 10;
        const dynEarnedCommission = dynTotalSales * (commRate / 100);

        return {
          id: r.id,
          resellerId: r.id,
          resellerName: r.business_name || 'N/A',
          tier: (r.tier as 'silver' | 'gold' | 'platinum') || 'silver',
          totalOrders: Math.max(r.total_orders || 0, dynTotalOrders),
          totalSales: Math.max(Number(r.total_revenue) || 0, dynTotalSales),
          commissionRate: commRate,
          earnedCommission: Math.max(Number(r.total_profit) || 0, dynEarnedCommission),
          paidCommission: Number(r.total_withdrawn) || 0,
          pendingCommission: Number(r.available_balance) + Number(r.pending_balance) || 0,
          codRejectionRate: Math.max(Number(r.cod_rejection_rate) || 0, Math.round(dynamicRejectionRate)),
          period: 'All Time'
        };
      });
    },
  });
}
