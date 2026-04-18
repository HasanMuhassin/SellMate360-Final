// Admin Dashboard Types

export type UserRole = 'admin' | 'manager' | 'staff' | 'cashier';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  lastLogin?: Date;
  twoFactorEnabled: boolean;
  createdAt: Date;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'critical';
}

export interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  failureReason?: string;
}

export interface DashboardStats {
  todaySales: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  courierPending: number;
  monthlyRevenue: number;
  posOrders: number;
  onlineOrders: number;
}

export interface SalesData {
  date: string;
  pos: number;
  online: number;
  total: number;
}

export interface AdminProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  costPrice: number;
  sellingPrice: number;
  resellerPrice: number;
  stock: number;
  status: 'active' | 'inactive';
  images: string[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  status: 'active' | 'inactive';
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer';
  quantity: number;
  reason: string;
  reference: string;
  createdAt: Date;
  createdBy: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'cod' | 'bank' | 'card' | 'online';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  channel: 'online' | 'pos';
  notes: string[];
  timeline: {
    status: string;
    timestamp: Date;
    note?: string;
  }[];
  codRisk: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface CashierShift {
  id: string;
  cashierId: string;
  cashierName: string;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  closingBalance?: number;
  cashSales: number;
  cardSales: number;
  refunds: number;
  status: 'open' | 'closed';
}

export interface Shipment {
  id: string;
  orderId: string;
  orderNumber: string;
  courier: string;
  trackingNumber: string;
  status: 'pending' | 'picked' | 'in_transit' | 'delivered' | 'returned';
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  createdAt: Date;
}

export interface CourierPartner {
  id: string;
  name: string;
  code: string;
  apiKey?: string;
  status: 'active' | 'inactive';
  deliveryZones: string[];
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  method: 'cod' | 'bank' | 'card' | 'online';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  reference?: string;
  bankSlip?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  createdAt: Date;
}

export interface Reseller {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: 'silver' | 'gold' | 'platinum';
  status: 'pending' | 'approved' | 'blocked';
  totalOrders: number;
  totalRevenue: number;
  codRejectionRate: number;
  joinedAt: Date;
}

export interface PayoutRequest {
  id: string;
  resellerId: string;
  resellerName: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  requestedAt: Date;
  processedAt?: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: {
    id: string;
    label: string;
    address: string;
    isDefault: boolean;
  }[];
  orderCount: number;
  totalSpent: number;
  codRejectionCount: number;
  riskScore: 'low' | 'medium' | 'high';
  notes: string[];
  createdAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: Date;
  validTo: Date;
  status: 'active' | 'inactive' | 'expired';
}

export interface Banner {
  id: string;
  title: string;
  image: string;
  link?: string;
  position: number;
  status: 'active' | 'inactive';
}

export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  status: 'published' | 'draft';
  updatedAt: Date;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  type: 'store' | 'warehouse';
  status: 'active' | 'inactive';
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'whatsapp' | 'sms' | 'email';
  trigger: string;
  content: string;
  status: 'active' | 'inactive';
}
