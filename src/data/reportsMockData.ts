// Reports Module Mock Data

export interface SalesReportData {
  date: string;
  onlineSales: number;
  posSales: number;
  totalSales: number;
  orders: number;
  avgOrderValue: number;
}

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

export interface InventoryReport {
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

export interface PaymentReport {
  method: string;
  transactions: number;
  amount: number;
  percentage: number;
  avgTransaction: number;
  successRate: number;
}

// Daily sales data for the last 30 days
export const mockSalesReportData: SalesReportData[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const onlineSales = Math.floor(Math.random() * 150000) + 50000;
  const posSales = Math.floor(Math.random() * 100000) + 30000;
  const orders = Math.floor(Math.random() * 50) + 20;
  return {
    date: date.toISOString().split('T')[0],
    onlineSales,
    posSales,
    totalSales: onlineSales + posSales,
    orders,
    avgOrderValue: Math.round((onlineSales + posSales) / orders),
  };
});

export const mockProductPerformance: ProductPerformance[] = [
  {
    id: 'prod-1',
    name: 'Smart Watch Pro X',
    sku: 'EL-SW-001',
    category: 'Electronics',
    unitsSold: 342,
    revenue: 4788000,
    profit: 1196970,
    profitMargin: 25,
    returnRate: 2.3,
    stockLevel: 45,
    trend: 'up',
  },
  {
    id: 'prod-2',
    name: 'Wireless Earbuds Elite',
    sku: 'EL-WE-002',
    category: 'Electronics',
    unitsSold: 521,
    revenue: 3386500,
    profit: 1016000,
    profitMargin: 30,
    returnRate: 1.8,
    stockLevel: 89,
    trend: 'up',
  },
  {
    id: 'prod-3',
    name: 'Power Bank 20000mAh',
    sku: 'EL-PB-003',
    category: 'Electronics',
    unitsSold: 287,
    revenue: 1148000,
    profit: 287000,
    profitMargin: 25,
    returnRate: 0.7,
    stockLevel: 156,
    trend: 'stable',
  },
  {
    id: 'prod-4',
    name: 'Air Fryer Deluxe 5L',
    sku: 'KI-AF-001',
    category: 'Kitchenware',
    unitsSold: 198,
    revenue: 2772000,
    profit: 693000,
    profitMargin: 25,
    returnRate: 1.5,
    stockLevel: 32,
    trend: 'up',
  },
  {
    id: 'prod-5',
    name: 'Stand Mixer Professional',
    sku: 'KI-SM-002',
    category: 'Kitchenware',
    unitsSold: 89,
    revenue: 2225000,
    profit: 445000,
    profitMargin: 20,
    returnRate: 0.0,
    stockLevel: 18,
    trend: 'stable',
  },
  {
    id: 'prod-6',
    name: 'Robot Vacuum Smart',
    sku: 'HA-RV-001',
    category: 'Home Appliances',
    unitsSold: 156,
    revenue: 5460000,
    profit: 1365000,
    profitMargin: 25,
    returnRate: 3.2,
    stockLevel: 23,
    trend: 'down',
  },
  {
    id: 'prod-7',
    name: 'Split AC Inverter 12000BTU',
    sku: 'HA-AC-002',
    category: 'Home Appliances',
    unitsSold: 67,
    revenue: 5360000,
    profit: 1072000,
    profitMargin: 20,
    returnRate: 1.5,
    stockLevel: 12,
    trend: 'stable',
  },
  {
    id: 'prod-8',
    name: 'Premium Cookware Set 10pc',
    sku: 'KI-CW-003',
    category: 'Kitchenware',
    unitsSold: 134,
    revenue: 2010000,
    profit: 603000,
    profitMargin: 30,
    returnRate: 2.2,
    stockLevel: 45,
    trend: 'up',
  },
];

export const mockInventoryReport: InventoryReport[] = [
  {
    id: 'inv-1',
    name: 'Smart Watch Pro X',
    sku: 'EL-SW-001',
    category: 'Electronics',
    currentStock: 45,
    reservedStock: 12,
    availableStock: 33,
    reorderPoint: 50,
    stockValue: 630000,
    turnoverRate: 7.6,
    daysOfStock: 14,
    status: 'low_stock',
  },
  {
    id: 'inv-2',
    name: 'Wireless Earbuds Elite',
    sku: 'EL-WE-002',
    category: 'Electronics',
    currentStock: 89,
    reservedStock: 5,
    availableStock: 84,
    reorderPoint: 30,
    stockValue: 578500,
    turnoverRate: 5.8,
    daysOfStock: 42,
    status: 'in_stock',
  },
  {
    id: 'inv-3',
    name: 'Power Bank 20000mAh',
    sku: 'EL-PB-003',
    category: 'Electronics',
    currentStock: 156,
    reservedStock: 8,
    availableStock: 148,
    reorderPoint: 40,
    stockValue: 624000,
    turnoverRate: 3.2,
    daysOfStock: 89,
    status: 'overstock',
  },
  {
    id: 'inv-4',
    name: 'Air Fryer Deluxe 5L',
    sku: 'KI-AF-001',
    category: 'Kitchenware',
    currentStock: 32,
    reservedStock: 7,
    availableStock: 25,
    reorderPoint: 25,
    stockValue: 448000,
    turnoverRate: 6.2,
    daysOfStock: 21,
    status: 'in_stock',
  },
  {
    id: 'inv-5',
    name: 'Stand Mixer Professional',
    sku: 'KI-SM-002',
    category: 'Kitchenware',
    currentStock: 18,
    reservedStock: 3,
    availableStock: 15,
    reorderPoint: 20,
    stockValue: 450000,
    turnoverRate: 4.9,
    daysOfStock: 32,
    status: 'low_stock',
  },
  {
    id: 'inv-6',
    name: 'Robot Vacuum Smart',
    sku: 'HA-RV-001',
    category: 'Home Appliances',
    currentStock: 23,
    reservedStock: 4,
    availableStock: 19,
    reorderPoint: 15,
    stockValue: 805000,
    turnoverRate: 6.8,
    daysOfStock: 18,
    status: 'in_stock',
  },
  {
    id: 'inv-7',
    name: 'Split AC Inverter 12000BTU',
    sku: 'HA-AC-002',
    category: 'Home Appliances',
    currentStock: 12,
    reservedStock: 2,
    availableStock: 10,
    reorderPoint: 8,
    stockValue: 960000,
    turnoverRate: 5.6,
    daysOfStock: 24,
    status: 'in_stock',
  },
  {
    id: 'inv-8',
    name: 'Premium Cookware Set 10pc',
    sku: 'KI-CW-003',
    category: 'Kitchenware',
    currentStock: 0,
    reservedStock: 0,
    availableStock: 0,
    reorderPoint: 20,
    stockValue: 0,
    turnoverRate: 4.5,
    daysOfStock: 0,
    status: 'out_of_stock',
  },
];

export const mockResellerCommissions: ResellerCommission[] = [
  {
    id: 'comm-1',
    resellerId: 'res-1',
    resellerName: 'Colombo Electronics Hub',
    tier: 'platinum',
    totalOrders: 156,
    totalSales: 2340000,
    commissionRate: 15,
    earnedCommission: 351000,
    paidCommission: 280000,
    pendingCommission: 71000,
    codRejectionRate: 2.1,
    period: '2024-01',
  },
  {
    id: 'comm-2',
    resellerId: 'res-2',
    resellerName: 'Kandy Home Store',
    tier: 'gold',
    totalOrders: 89,
    totalSales: 1335000,
    commissionRate: 12,
    earnedCommission: 160200,
    paidCommission: 120000,
    pendingCommission: 40200,
    codRejectionRate: 5.6,
    period: '2024-01',
  },
  {
    id: 'comm-3',
    resellerId: 'res-3',
    resellerName: 'Galle Gadgets',
    tier: 'silver',
    totalOrders: 45,
    totalSales: 675000,
    commissionRate: 10,
    earnedCommission: 67500,
    paidCommission: 50000,
    pendingCommission: 17500,
    codRejectionRate: 8.9,
    period: '2024-01',
  },
  {
    id: 'comm-4',
    resellerId: 'res-4',
    resellerName: 'Negombo Tech World',
    tier: 'gold',
    totalOrders: 112,
    totalSales: 1680000,
    commissionRate: 12,
    earnedCommission: 201600,
    paidCommission: 180000,
    pendingCommission: 21600,
    codRejectionRate: 3.5,
    period: '2024-01',
  },
  {
    id: 'comm-5',
    resellerId: 'res-5',
    resellerName: 'Jaffna Appliances',
    tier: 'silver',
    totalOrders: 34,
    totalSales: 510000,
    commissionRate: 10,
    earnedCommission: 51000,
    paidCommission: 40000,
    pendingCommission: 11000,
    codRejectionRate: 11.7,
    period: '2024-01',
  },
];

export const mockPaymentReports: PaymentReport[] = [
  {
    method: 'Cash on Delivery',
    transactions: 1245,
    amount: 8715000,
    percentage: 45,
    avgTransaction: 7000,
    successRate: 92.3,
  },
  {
    method: 'Card Payment',
    transactions: 567,
    amount: 4536000,
    percentage: 23,
    avgTransaction: 8000,
    successRate: 98.7,
  },
  {
    method: 'Bank Transfer',
    transactions: 423,
    amount: 4230000,
    percentage: 22,
    avgTransaction: 10000,
    successRate: 99.1,
  },
  {
    method: 'Online Payment',
    transactions: 234,
    amount: 1872000,
    percentage: 10,
    avgTransaction: 8000,
    successRate: 97.8,
  },
];

// Monthly summary data
export const mockMonthlySummary = {
  totalRevenue: 19353000,
  totalOrders: 2469,
  avgOrderValue: 7837,
  grossProfit: 4838250,
  profitMargin: 25,
  topCategory: 'Electronics',
  topProduct: 'Smart Watch Pro X',
  newCustomers: 456,
  returningCustomers: 789,
  returnRate: 2.1,
};
