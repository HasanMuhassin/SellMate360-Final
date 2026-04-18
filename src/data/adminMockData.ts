import type {
  AdminUser,
  AuditLogEntry,
  LoginAttempt,
  DashboardStats,
  SalesData,
  AdminProduct,
  Category,
  StockMovement,
  Supplier,
  AdminOrder,
  CashierShift,
  Shipment,
  CourierPartner,
  PaymentTransaction,
  Reseller,
  PayoutRequest,
  Customer,
  Coupon,
  Banner,
  CMSPage,
  Branch,
  NotificationTemplate,
} from '@/types/admin';

export const mockAdminUser: AdminUser = {
  id: '1',
  email: 'admin@sellmate360.com',
  name: 'John Admin',
  role: 'admin',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  lastLogin: new Date(),
  twoFactorEnabled: true,
  createdAt: new Date('2024-01-01'),
};

export const mockDashboardStats: DashboardStats = {
  todaySales: 125750,
  totalOrders: 47,
  pendingOrders: 12,
  lowStockProducts: 8,
  courierPending: 15,
  monthlyRevenue: 3450000,
  posOrders: 23,
  onlineOrders: 24,
};

export const mockSalesData: SalesData[] = [
  { date: '2024-01-14', pos: 45000, online: 62000, total: 107000 },
  { date: '2024-01-15', pos: 52000, online: 48000, total: 100000 },
  { date: '2024-01-16', pos: 38000, online: 71000, total: 109000 },
  { date: '2024-01-17', pos: 61000, online: 55000, total: 116000 },
  { date: '2024-01-18', pos: 49000, online: 68000, total: 117000 },
  { date: '2024-01-19', pos: 72000, online: 81000, total: 153000 },
  { date: '2024-01-20', pos: 58000, online: 67750, total: 125750 },
];

export const mockProducts: AdminProduct[] = [
  {
    id: '1',
    sku: 'ELEC-001',
    name: 'Wireless Bluetooth Earbuds Pro',
    category: 'Electronics',
    brand: 'SoundMax',
    costPrice: 1200,
    sellingPrice: 2499,
    resellerPrice: 1800,
    stock: 145,
    status: 'active',
    images: ['/placeholder.svg'],
    description: 'Premium wireless earbuds with noise cancellation',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: '2',
    sku: 'ELEC-002',
    name: 'Smart Watch Series X',
    category: 'Electronics',
    brand: 'TechWear',
    costPrice: 3500,
    sellingPrice: 7999,
    resellerPrice: 5500,
    stock: 5,
    status: 'active',
    images: ['/placeholder.svg'],
    description: 'Advanced smartwatch with health monitoring',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date(),
  },
  {
    id: '3',
    sku: 'HOME-001',
    name: 'Robot Vacuum Cleaner',
    category: 'Home Appliances',
    brand: 'CleanBot',
    costPrice: 8000,
    sellingPrice: 15999,
    resellerPrice: 11000,
    stock: 0,
    status: 'active',
    images: ['/placeholder.svg'],
    description: 'Smart robot vacuum with app control',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date(),
  },
];

export const mockCategories: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', productCount: 45, status: 'active' },
  { id: '2', name: 'Home Appliances', slug: 'home-appliances', productCount: 32, status: 'active' },
  { id: '3', name: 'Kitchenware', slug: 'kitchenware', productCount: 28, status: 'active' },
  { id: '4', name: 'Fashion', slug: 'fashion', productCount: 67, status: 'active' },
  { id: '5', name: 'Beauty & Health', slug: 'beauty-health', productCount: 41, status: 'active' },
];

export const mockStockMovements: StockMovement[] = [
  { id: '1', productId: '1', productName: 'Wireless Bluetooth Earbuds Pro', type: 'in', quantity: 100, reason: 'Purchase Order', reference: 'PO-001', createdAt: new Date(), createdBy: 'Admin' },
  { id: '2', productId: '2', productName: 'Smart Watch Series X', type: 'out', quantity: 5, reason: 'Sale', reference: 'ORD-1234', createdAt: new Date(), createdBy: 'System' },
  { id: '3', productId: '1', productName: 'Wireless Bluetooth Earbuds Pro', type: 'adjustment', quantity: -2, reason: 'Damage', reference: 'ADJ-001', createdAt: new Date(), createdBy: 'Admin' },
];

export const mockSuppliers: Supplier[] = [
  { id: '1', name: 'TechPro Distributors', email: 'sales@techpro.com', phone: '+94 11 234 5678', address: 'Colombo, Sri Lanka', status: 'active' },
  { id: '2', name: 'Global Electronics', email: 'info@globalelec.com', phone: '+94 11 345 6789', address: 'Kandy, Sri Lanka', status: 'active' },
];

export const mockOrders: AdminOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    customer: { name: 'Kasun Perera', email: 'kasun@email.com', phone: '+94 77 123 4567', address: 'Colombo 07, Sri Lanka' },
    items: [{ productId: '1', name: 'Wireless Bluetooth Earbuds Pro', quantity: 2, price: 2499 }],
    subtotal: 4998,
    deliveryFee: 350,
    total: 5348,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'pending',
    channel: 'online',
    notes: [],
    timeline: [{ status: 'Order Placed', timestamp: new Date() }],
    codRisk: 'low',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    customer: { name: 'Nimali Silva', email: 'nimali@email.com', phone: '+94 77 234 5678', address: 'Gampaha, Sri Lanka' },
    items: [{ productId: '2', name: 'Smart Watch Series X', quantity: 1, price: 7999 }],
    subtotal: 7999,
    deliveryFee: 400,
    total: 8399,
    paymentMethod: 'bank',
    paymentStatus: 'paid',
    orderStatus: 'confirmed',
    channel: 'online',
    notes: ['Customer confirmed via WhatsApp'],
    timeline: [{ status: 'Order Placed', timestamp: new Date() }, { status: 'Payment Confirmed', timestamp: new Date() }],
    codRisk: 'low',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockCashierShifts: CashierShift[] = [
  {
    id: '1',
    cashierId: 'c1',
    cashierName: 'Priya Fernando',
    openedAt: new Date(),
    status: 'open',
    openingBalance: 10000,
    cashSales: 45000,
    cardSales: 23000,
    refunds: 2500,
  },
];

export const mockShipments: Shipment[] = [
  { id: '1', orderId: '1', orderNumber: 'ORD-2024-001', courier: 'DomEx', trackingNumber: 'DX123456789', status: 'pending', createdAt: new Date() },
  { id: '2', orderId: '2', orderNumber: 'ORD-2024-002', courier: 'Pronto', trackingNumber: 'PR987654321', status: 'in_transit', estimatedDelivery: new Date(), createdAt: new Date() },
];

export const mockCouriers: CourierPartner[] = [
  { id: '1', name: 'DomEx', code: 'DOMEX', status: 'active', deliveryZones: ['Colombo', 'Gampaha', 'Kalutara'] },
  { id: '2', name: 'Pronto', code: 'PRONTO', status: 'active', deliveryZones: ['All Island'] },
  { id: '3', name: 'Speed Post', code: 'SPEEDPOST', status: 'inactive', deliveryZones: ['Colombo'] },
];

export const mockPayments: PaymentTransaction[] = [
  { id: '1', orderId: '1', orderNumber: 'ORD-2024-001', amount: 5348, method: 'cod', status: 'pending', createdAt: new Date() },
  { id: '2', orderId: '2', orderNumber: 'ORD-2024-002', amount: 8399, method: 'bank', status: 'completed', reference: 'REF123', verifiedAt: new Date(), verifiedBy: 'Admin', createdAt: new Date() },
];

export const mockResellers: Reseller[] = [
  { id: '1', name: 'Saman Traders', email: 'saman@traders.com', phone: '+94 77 111 2222', tier: 'gold', status: 'approved', totalOrders: 156, totalRevenue: 1250000, codRejectionRate: 5, joinedAt: new Date('2023-06-01') },
  { id: '2', name: 'Lanka Deals', email: 'info@lankadeals.com', phone: '+94 77 333 4444', tier: 'silver', status: 'approved', totalOrders: 45, totalRevenue: 380000, codRejectionRate: 12, joinedAt: new Date('2023-09-15') },
  { id: '3', name: 'New Seller', email: 'new@seller.com', phone: '+94 77 555 6666', tier: 'silver', status: 'pending', totalOrders: 0, totalRevenue: 0, codRejectionRate: 0, joinedAt: new Date() },
];

export const mockPayoutRequests: PayoutRequest[] = [
  { id: '1', resellerId: '1', resellerName: 'Saman Traders', amount: 45000, status: 'pending', bankDetails: { bankName: 'BOC', accountNumber: '1234567890', accountHolder: 'Saman Perera' }, requestedAt: new Date() },
];

export const mockCustomers: Customer[] = [
  { id: '1', name: 'Kasun Perera', email: 'kasun@email.com', phone: '+94 77 123 4567', addresses: [{ id: '1', label: 'Home', address: 'Colombo 07, Sri Lanka', isDefault: true }], orderCount: 8, totalSpent: 45000, codRejectionCount: 0, riskScore: 'low', notes: [], createdAt: new Date('2023-01-01') },
  { id: '2', name: 'Nimali Silva', email: 'nimali@email.com', phone: '+94 77 234 5678', addresses: [{ id: '1', label: 'Office', address: 'Gampaha, Sri Lanka', isDefault: true }], orderCount: 3, totalSpent: 24000, codRejectionCount: 1, riskScore: 'medium', notes: ['Called for delivery timing'], createdAt: new Date('2023-06-01') },
];

export const mockCoupons: Coupon[] = [
  { id: '1', code: 'WELCOME10', type: 'percentage', value: 10, minOrder: 5000, maxDiscount: 1000, usageLimit: 100, usedCount: 45, validFrom: new Date('2024-01-01'), validTo: new Date('2024-12-31'), status: 'active' },
  { id: '2', code: 'FLAT500', type: 'fixed', value: 500, minOrder: 3000, usageLimit: 50, usedCount: 50, validFrom: new Date('2024-01-01'), validTo: new Date('2024-06-30'), status: 'expired' },
];

export const mockBanners: Banner[] = [
  { id: '1', title: 'New Year Sale', image: '/placeholder.svg', link: '/shop', position: 1, status: 'active' },
  { id: '2', title: 'Electronics Week', image: '/placeholder.svg', link: '/shop?category=electronics', position: 2, status: 'active' },
];

export const mockCMSPages: CMSPage[] = [
  { id: '1', title: 'Delivery Information', slug: 'delivery', content: '<p>Delivery info content...</p>', metaTitle: 'Delivery Information', metaDescription: 'Learn about our delivery options', status: 'published', updatedAt: new Date() },
  { id: '2', title: 'Return Policy', slug: 'returns', content: '<p>Return policy content...</p>', metaTitle: 'Return Policy', metaDescription: 'Our return and refund policy', status: 'published', updatedAt: new Date() },
];

export const mockBranches: Branch[] = [
  { id: '1', name: 'Main Store - Colombo', address: '123 Galle Road, Colombo 03', phone: '+94 11 234 5678', type: 'store', status: 'active' },
  { id: '2', name: 'Warehouse - Kelaniya', address: '45 Industrial Zone, Kelaniya', phone: '+94 11 345 6789', type: 'warehouse', status: 'active' },
];

export const mockNotificationTemplates: NotificationTemplate[] = [
  { id: '1', name: 'Order Confirmation', type: 'whatsapp', trigger: 'order_placed', content: 'Hi {customer_name}, your order #{order_number} has been received!', status: 'active' },
  { id: '2', name: 'Shipping Update', type: 'sms', trigger: 'order_shipped', content: 'Your order #{order_number} has been shipped. Track: {tracking_url}', status: 'active' },
];

export const mockAuditLogs: AuditLogEntry[] = [
  { id: '1', userId: '1', userName: 'John Admin', action: 'LOGIN', resource: 'Auth', details: 'Successful login', ipAddress: '192.168.1.1', timestamp: new Date(), level: 'info' },
  { id: '2', userId: '1', userName: 'John Admin', action: 'UPDATE', resource: 'Product', details: 'Updated price for SKU: ELEC-001', ipAddress: '192.168.1.1', timestamp: new Date(), level: 'info' },
  { id: '3', userId: '2', userName: 'Jane Manager', action: 'DELETE', resource: 'Order', details: 'Cancelled order ORD-2024-003', ipAddress: '192.168.1.2', timestamp: new Date(), level: 'warning' },
];

export const mockLoginAttempts: LoginAttempt[] = [
  { id: '1', email: 'admin@sellmate360.com', success: true, ipAddress: '192.168.1.1', userAgent: 'Chrome/120', timestamp: new Date() },
  { id: '2', email: 'unknown@email.com', success: false, ipAddress: '10.0.0.1', userAgent: 'Firefox/115', timestamp: new Date(), failureReason: 'Invalid credentials' },
];

export const mockUsers: AdminUser[] = [
  mockAdminUser,
  { id: '2', email: 'manager@sellmate360.com', name: 'Jane Manager', role: 'manager', twoFactorEnabled: false, createdAt: new Date('2024-02-01') },
  { id: '3', email: 'staff@sellmate360.com', name: 'Bob Staff', role: 'staff', twoFactorEnabled: false, createdAt: new Date('2024-03-01') },
  { id: '4', email: 'cashier@sellmate360.com', name: 'Alice Cashier', role: 'cashier', twoFactorEnabled: false, createdAt: new Date('2024-04-01') },
];
