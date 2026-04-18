// Settings Module Mock Data

export interface CompanySettings {
  id: string;
  name: string;
  legalName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  taxId: string;
  vatNumber: string;
  logo: string;
  favicon: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  orderPrefix: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
}

export interface SystemUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff' | 'cashier';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  phone?: string;
  branch?: string;
  lastLogin?: Date;
  twoFactorEnabled: boolean;
  createdAt: Date;
}

export interface NotificationSetting {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'sms';
  trigger: string;
  subject?: string;
  content: string;
  variables: string[];
  status: 'active' | 'inactive';
  updatedAt: Date;
}

export interface BranchLocation {
  id: string;
  name: string;
  code: string;
  type: 'store' | 'warehouse';
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  manager: string;
  openingHours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  isPickupLocation: boolean;
  acceptsReturns: boolean;
  status: 'active' | 'inactive';
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  type: 'cod' | 'bank' | 'card' | 'wallet';
  icon: string;
  instructions?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    branch: string;
  };
  processingFee: number;
  feeType: 'fixed' | 'percentage';
  minOrder?: number;
  maxOrder?: number;
  status: 'active' | 'inactive';
}

export interface TaxConfig {
  id: string;
  name: string;
  rate: number;
  type: 'inclusive' | 'exclusive';
  applyTo: 'all' | 'specific';
  categories?: string[];
  status: 'active' | 'inactive';
}

export interface Integration {
  id: string;
  name: string;
  category: 'payment' | 'shipping' | 'marketing' | 'analytics' | 'communication';
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'pending';
  configuredAt?: Date;
  credentials?: Record<string, string>;
}

// Mock Data

export const mockCompanySettings: CompanySettings = {
  id: '1',
  name: 'SellMate360',
  legalName: 'SellMate360 (Pvt) Ltd',
  email: 'info@sellmate360.lk',
  phone: '+94 11 234 5678',
  whatsapp: '+94 77 123 4567',
  address: '123 Galle Road, Colombo 03',
  city: 'Colombo',
  country: 'Sri Lanka',
  postalCode: '00300',
  taxId: 'TIN-123456789',
  vatNumber: 'VAT-987654321',
  logo: '/placeholder.svg',
  favicon: '/favicon.ico',
  currency: 'LKR',
  timezone: 'Asia/Colombo',
  dateFormat: 'DD/MM/YYYY',
  orderPrefix: 'ORD',
  socialLinks: {
    facebook: 'https://facebook.com/sellmate360',
    instagram: 'https://instagram.com/sellmate360',
    twitter: '',
    youtube: '',
    tiktok: '',
  },
};

export const mockSystemUsers: SystemUser[] = [
  {
    id: '1',
    email: 'admin@sellmate360.lk',
    name: 'Super Admin',
    role: 'admin',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    phone: '+94 77 111 1111',
    branch: 'Main Store - Colombo',
    lastLogin: new Date('2024-01-20T09:30:00'),
    twoFactorEnabled: true,
    createdAt: new Date('2023-01-01'),
  },
  {
    id: '2',
    email: 'manager@sellmate360.lk',
    name: 'Store Manager',
    role: 'manager',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
    phone: '+94 77 222 2222',
    branch: 'Main Store - Colombo',
    lastLogin: new Date('2024-01-20T08:15:00'),
    twoFactorEnabled: true,
    createdAt: new Date('2023-03-15'),
  },
  {
    id: '3',
    email: 'staff@sellmate360.lk',
    name: 'Sales Staff',
    role: 'staff',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=staff',
    phone: '+94 77 333 3333',
    branch: 'Main Store - Colombo',
    lastLogin: new Date('2024-01-19T17:45:00'),
    twoFactorEnabled: false,
    createdAt: new Date('2023-06-01'),
  },
  {
    id: '4',
    email: 'cashier@sellmate360.lk',
    name: 'POS Cashier',
    role: 'cashier',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cashier',
    phone: '+94 77 444 4444',
    branch: 'Main Store - Colombo',
    lastLogin: new Date('2024-01-20T10:00:00'),
    twoFactorEnabled: false,
    createdAt: new Date('2023-09-01'),
  },
  {
    id: '5',
    email: 'warehouse@sellmate360.lk',
    name: 'Warehouse Staff',
    role: 'staff',
    status: 'inactive',
    phone: '+94 77 555 5555',
    branch: 'Warehouse - Kelaniya',
    twoFactorEnabled: false,
    createdAt: new Date('2023-07-15'),
  },
];

export const mockNotificationSettings: NotificationSetting[] = [
  {
    id: '1',
    name: 'Order Confirmation',
    type: 'email',
    trigger: 'order_placed',
    subject: 'Order #{order_number} Confirmed!',
    content: `Dear {customer_name},

Thank you for your order! Your order #{order_number} has been confirmed.

Order Total: {currency} {order_total}
Payment Method: {payment_method}

We will notify you once your order is shipped.

Best regards,
{store_name}`,
    variables: ['customer_name', 'order_number', 'order_total', 'currency', 'payment_method', 'store_name'],
    status: 'active',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Order Confirmation (WhatsApp)',
    type: 'whatsapp',
    trigger: 'order_placed',
    content: `Hi {customer_name}! 👋

Your order *#{order_number}* has been confirmed! ✅

💰 Total: {currency} {order_total}
📍 Delivery to: {delivery_city}

We'll update you when it's on the way! 🚚`,
    variables: ['customer_name', 'order_number', 'order_total', 'currency', 'delivery_city'],
    status: 'active',
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    name: 'Shipping Update',
    type: 'sms',
    trigger: 'order_shipped',
    content: 'Your order #{order_number} has been shipped! Track: {tracking_url}',
    variables: ['order_number', 'tracking_url'],
    status: 'active',
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '4',
    name: 'Delivery Complete',
    type: 'whatsapp',
    trigger: 'order_delivered',
    content: `Hi {customer_name}! 🎉

Your order *#{order_number}* has been delivered!

We hope you love your purchase! If you have any questions, feel free to reach out.

⭐ Don't forget to leave a review!`,
    variables: ['customer_name', 'order_number'],
    status: 'active',
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '5',
    name: 'Password Reset',
    type: 'email',
    trigger: 'password_reset',
    subject: 'Reset Your Password',
    content: `Dear {customer_name},

You requested to reset your password. Click the link below:

{reset_link}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.`,
    variables: ['customer_name', 'reset_link'],
    status: 'active',
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: '6',
    name: 'Low Stock Alert',
    type: 'email',
    trigger: 'low_stock',
    subject: '⚠️ Low Stock Alert: {product_name}',
    content: `Stock Alert!

Product: {product_name}
SKU: {sku}
Current Stock: {current_stock}
Reorder Level: {reorder_level}

Please restock soon to avoid stockouts.`,
    variables: ['product_name', 'sku', 'current_stock', 'reorder_level'],
    status: 'active',
    updatedAt: new Date('2024-01-01'),
  },
];

export const mockBranchLocations: BranchLocation[] = [
  {
    id: '1',
    name: 'Main Store - Colombo',
    code: 'COL-01',
    type: 'store',
    address: '123 Galle Road',
    city: 'Colombo',
    district: 'Colombo',
    phone: '+94 11 234 5678',
    email: 'colombo@sellmate360.lk',
    manager: 'Store Manager',
    openingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: '10:00', close: '14:00', closed: false },
    },
    isPickupLocation: true,
    acceptsReturns: true,
    status: 'active',
  },
  {
    id: '2',
    name: 'Warehouse - Kelaniya',
    code: 'KEL-WH',
    type: 'warehouse',
    address: '45 Industrial Zone',
    city: 'Kelaniya',
    district: 'Gampaha',
    phone: '+94 11 345 6789',
    email: 'warehouse@sellmate360.lk',
    manager: 'Warehouse Manager',
    openingHours: {
      monday: { open: '08:00', close: '17:00' },
      tuesday: { open: '08:00', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '08:00', close: '17:00' },
      friday: { open: '08:00', close: '17:00' },
      saturday: { open: '08:00', close: '13:00' },
      sunday: { open: '00:00', close: '00:00', closed: true },
    },
    isPickupLocation: false,
    acceptsReturns: true,
    status: 'active',
  },
  {
    id: '3',
    name: 'Branch Store - Kandy',
    code: 'KDY-01',
    type: 'store',
    address: '78 Peradeniya Road',
    city: 'Kandy',
    district: 'Kandy',
    phone: '+94 81 234 5678',
    email: 'kandy@sellmate360.lk',
    manager: 'Branch Manager',
    openingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: '00:00', close: '00:00', closed: true },
    },
    isPickupLocation: true,
    acceptsReturns: true,
    status: 'active',
  },
];

export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    name: 'Cash on Delivery',
    code: 'cod',
    type: 'cod',
    icon: 'Banknote',
    instructions: 'Pay with cash when your order is delivered.',
    processingFee: 0,
    feeType: 'fixed',
    maxOrder: 50000,
    status: 'active',
  },
  {
    id: '2',
    name: 'Bank Transfer',
    code: 'bank',
    type: 'bank',
    icon: 'Building2',
    instructions: 'Transfer to our bank account and upload the slip.',
    bankDetails: {
      bankName: 'Commercial Bank',
      accountNumber: '1234567890',
      accountName: 'SellMate360 (Pvt) Ltd',
      branch: 'Colombo Fort',
    },
    processingFee: 0,
    feeType: 'fixed',
    status: 'active',
  },
  {
    id: '3',
    name: 'Credit/Debit Card',
    code: 'card',
    type: 'card',
    icon: 'CreditCard',
    instructions: 'Pay securely with Visa or Mastercard.',
    processingFee: 2.5,
    feeType: 'percentage',
    minOrder: 1000,
    status: 'active',
  },
  {
    id: '4',
    name: 'FriMi Wallet',
    code: 'frimi',
    type: 'wallet',
    icon: 'Wallet',
    instructions: 'Pay using your FriMi digital wallet.',
    processingFee: 50,
    feeType: 'fixed',
    status: 'inactive',
  },
];

export const mockTaxConfigs: TaxConfig[] = [
  {
    id: '1',
    name: 'Standard VAT',
    rate: 15,
    type: 'inclusive',
    applyTo: 'all',
    status: 'active',
  },
  {
    id: '2',
    name: 'Electronics Tax',
    rate: 18,
    type: 'exclusive',
    applyTo: 'specific',
    categories: ['Electronics', 'Appliances'],
    status: 'inactive',
  },
];

export const mockIntegrations: Integration[] = [
  {
    id: '1',
    name: 'Stripe',
    category: 'payment',
    description: 'Accept credit card payments globally',
    icon: 'CreditCard',
    status: 'disconnected',
  },
  {
    id: '2',
    name: 'PayHere',
    category: 'payment',
    description: 'Local Sri Lankan payment gateway',
    icon: 'Wallet',
    status: 'connected',
    configuredAt: new Date('2024-01-01'),
  },
  {
    id: '3',
    name: 'DHL Express',
    category: 'shipping',
    description: 'International courier service',
    icon: 'Truck',
    status: 'disconnected',
  },
  {
    id: '4',
    name: 'Domex',
    category: 'shipping',
    description: 'Local courier partner',
    icon: 'Package',
    status: 'connected',
    configuredAt: new Date('2024-01-05'),
  },
  {
    id: '5',
    name: 'Google Analytics',
    category: 'analytics',
    description: 'Website traffic and user analytics',
    icon: 'BarChart3',
    status: 'connected',
    configuredAt: new Date('2023-12-01'),
  },
  {
    id: '6',
    name: 'Facebook Pixel',
    category: 'marketing',
    description: 'Track conversions from Facebook ads',
    icon: 'Target',
    status: 'pending',
  },
  {
    id: '7',
    name: 'WhatsApp Business API',
    category: 'communication',
    description: 'Automated WhatsApp notifications',
    icon: 'MessageCircle',
    status: 'connected',
    configuredAt: new Date('2024-01-10'),
  },
  {
    id: '8',
    name: 'Mailchimp',
    category: 'marketing',
    description: 'Email marketing automation',
    icon: 'Mail',
    status: 'disconnected',
  },
];

// Role permissions configuration
export const rolePermissions: Record<string, string[]> = {
  admin: [
    'dashboard.view',
    'catalog.*',
    'inventory.*',
    'orders.*',
    'pos.*',
    'shipping.*',
    'payments.*',
    'resellers.*',
    'customers.*',
    'promotions.*',
    'content.*',
    'reports.*',
    'settings.*',
    'security.*',
  ],
  manager: [
    'dashboard.view',
    'catalog.view',
    'catalog.edit',
    'inventory.*',
    'orders.*',
    'pos.*',
    'shipping.*',
    'payments.view',
    'resellers.view',
    'customers.*',
    'promotions.view',
    'reports.view',
  ],
  staff: [
    'dashboard.view',
    'catalog.view',
    'inventory.view',
    'orders.view',
    'orders.edit',
    'shipping.view',
    'customers.view',
  ],
  cashier: [
    'dashboard.view',
    'pos.*',
    'orders.view',
  ],
};
