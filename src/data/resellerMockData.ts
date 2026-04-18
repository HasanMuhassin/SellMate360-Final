// Reseller Management Mock Data

export interface ResellerApplication {
  id: string;
  userId: string;
  businessName: string;
  businessRegistration?: string;
  taxId?: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  reason: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface ResellerTier {
  id: string;
  tier: 'silver' | 'gold' | 'platinum';
  name: string;
  discountPercentage: number;
  minOrderValue: number;
  maxCodPercentage: number;
  prioritySupport: boolean;
  freeShippingThreshold: number;
  description: string;
  resellerCount: number;
}

export interface ResellerOrder {
  id: string;
  orderNumber: string;
  resellerId: string;
  resellerName: string;
  customerName: string;
  customerPhone: string;
  resellerPrice: number;
  sellingPrice: number;
  profit: number;
  commissionAmount: number;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  isPaid: boolean;
  createdAt: Date;
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
    branch?: string;
  };
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  processedAt?: Date;
  processedBy?: string;
  paymentReference?: string;
  paymentProofUrl?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface ResellerLedgerEntry {
  id: string;
  resellerId: string;
  type: 'order_profit' | 'payout' | 'adjustment' | 'cod_penalty' | 'bonus';
  referenceId?: string;
  referenceNumber?: string;
  credit: number;
  debit: number;
  balance: number;
  description: string;
  createdAt: Date;
}

export interface ExtendedReseller {
  id: string;
  userId: string;
  businessName: string;
  businessRegistration?: string;
  taxId?: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  tier: 'silver' | 'gold' | 'platinum';
  status: 'pending' | 'approved' | 'blocked';
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  codRejectionCount: number;
  codRejectionRate: number;
  commissionRate: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
  approvedBy?: string;
  approvedAt?: Date;
  blockedReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock Applications
export const mockResellerApplications: ResellerApplication[] = [
  {
    id: 'app-001',
    userId: 'user-app-001',
    businessName: 'Fashion Hub Store',
    businessRegistration: 'BR-2024-001234',
    contactPerson: 'Amal Perera',
    phone: '+94 77 123 4567',
    email: 'amal@fashionhub.lk',
    address: '123 Galle Road, Colombo 03',
    reason: 'I run an online fashion store on Instagram with 50K followers and want to expand product range.',
    socialLinks: {
      instagram: '@fashionhublk',
      facebook: 'fashionhubstore',
    },
    status: 'pending',
    submittedAt: new Date('2024-01-20'),
  },
  {
    id: 'app-002',
    userId: 'user-app-002',
    businessName: 'Tech Galaxy',
    taxId: 'TX-2024-5678',
    contactPerson: 'Nuwan Silva',
    phone: '+94 71 987 6543',
    email: 'nuwan@techgalaxy.lk',
    address: '45 Union Place, Colombo 02',
    reason: 'We have a physical electronics store and want to add more products through reselling.',
    socialLinks: {
      facebook: 'techgalaxylk',
      tiktok: '@techgalaxylk',
    },
    status: 'pending',
    submittedAt: new Date('2024-01-19'),
  },
  {
    id: 'app-003',
    userId: 'user-app-003',
    businessName: 'Home Essentials LK',
    businessRegistration: 'BR-2023-009876',
    contactPerson: 'Kamala Jayasuriya',
    phone: '+94 76 456 7890',
    email: 'kamala@homeessentials.lk',
    address: '78 Baseline Road, Colombo 09',
    reason: 'Experienced in home goods sales for 5 years, looking to partner with quality suppliers.',
    status: 'approved',
    submittedAt: new Date('2024-01-15'),
    reviewedAt: new Date('2024-01-16'),
    reviewedBy: 'Admin User',
  },
  {
    id: 'app-004',
    userId: 'user-app-004',
    businessName: 'Quick Deals',
    contactPerson: 'Samith Fernando',
    phone: '+94 78 111 2222',
    email: 'samith@quickdeals.lk',
    address: '12 Negombo Road, Ja-Ela',
    reason: 'Want to start reselling business',
    status: 'rejected',
    submittedAt: new Date('2024-01-10'),
    reviewedAt: new Date('2024-01-12'),
    reviewedBy: 'Admin User',
    rejectionReason: 'Incomplete business information and no prior sales experience provided.',
  },
];

// Mock Tiers
export const mockResellerTiers: ResellerTier[] = [
  {
    id: 'tier-silver',
    tier: 'silver',
    name: 'Silver Partner',
    discountPercentage: 10,
    minOrderValue: 5000,
    maxCodPercentage: 80,
    prioritySupport: false,
    freeShippingThreshold: 10000,
    description: 'Entry level reseller tier with basic benefits',
    resellerCount: 45,
  },
  {
    id: 'tier-gold',
    tier: 'gold',
    name: 'Gold Partner',
    discountPercentage: 15,
    minOrderValue: 3000,
    maxCodPercentage: 90,
    prioritySupport: true,
    freeShippingThreshold: 7500,
    description: 'Established reseller tier with enhanced benefits',
    resellerCount: 18,
  },
  {
    id: 'tier-platinum',
    tier: 'platinum',
    name: 'Platinum Partner',
    discountPercentage: 20,
    minOrderValue: 0,
    maxCodPercentage: 100,
    prioritySupport: true,
    freeShippingThreshold: 5000,
    description: 'Premium reseller tier with maximum benefits',
    resellerCount: 7,
  },
];

// Mock Extended Resellers
export const mockExtendedResellers: ExtendedReseller[] = [
  {
    id: 'res-001',
    userId: 'user-res-001',
    businessName: 'Fashion Hub Store',
    businessRegistration: 'BR-2024-001234',
    contactPerson: 'Amal Perera',
    phone: '+94 77 123 4567',
    email: 'amal@fashionhub.lk',
    address: '123 Galle Road, Colombo 03',
    tier: 'gold',
    status: 'approved',
    totalOrders: 156,
    totalRevenue: 1250000,
    totalProfit: 187500,
    codRejectionCount: 3,
    codRejectionRate: 1.92,
    commissionRate: 15,
    availableBalance: 45000,
    pendingBalance: 12500,
    totalWithdrawn: 130000,
    approvedAt: new Date('2023-06-15'),
    createdAt: new Date('2023-06-10'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'res-002',
    userId: 'user-res-002',
    businessName: 'Tech Galaxy',
    taxId: 'TX-2024-5678',
    contactPerson: 'Nuwan Silva',
    phone: '+94 71 987 6543',
    email: 'nuwan@techgalaxy.lk',
    address: '45 Union Place, Colombo 02',
    tier: 'platinum',
    status: 'approved',
    totalOrders: 312,
    totalRevenue: 4500000,
    totalProfit: 675000,
    codRejectionCount: 5,
    codRejectionRate: 1.6,
    commissionRate: 20,
    availableBalance: 125000,
    pendingBalance: 35000,
    totalWithdrawn: 515000,
    approvedAt: new Date('2022-03-20'),
    createdAt: new Date('2022-03-15'),
    updatedAt: new Date('2024-01-21'),
  },
  {
    id: 'res-003',
    userId: 'user-res-003',
    businessName: 'Home Essentials LK',
    businessRegistration: 'BR-2023-009876',
    contactPerson: 'Kamala Jayasuriya',
    phone: '+94 76 456 7890',
    email: 'kamala@homeessentials.lk',
    address: '78 Baseline Road, Colombo 09',
    tier: 'silver',
    status: 'approved',
    totalOrders: 42,
    totalRevenue: 320000,
    totalProfit: 32000,
    codRejectionCount: 2,
    codRejectionRate: 4.76,
    commissionRate: 10,
    availableBalance: 15000,
    pendingBalance: 5000,
    totalWithdrawn: 12000,
    approvedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'res-004',
    userId: 'user-res-004',
    businessName: 'Urban Style Boutique',
    contactPerson: 'Dilini Weerasinghe',
    phone: '+94 72 333 4444',
    email: 'dilini@urbanstyle.lk',
    address: '89 Duplication Road, Colombo 04',
    tier: 'gold',
    status: 'approved',
    totalOrders: 89,
    totalRevenue: 780000,
    totalProfit: 117000,
    codRejectionCount: 1,
    codRejectionRate: 1.12,
    commissionRate: 15,
    availableBalance: 28000,
    pendingBalance: 8500,
    totalWithdrawn: 80500,
    approvedAt: new Date('2023-09-10'),
    createdAt: new Date('2023-09-05'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: 'res-005',
    userId: 'user-res-005',
    businessName: 'Budget Mart',
    contactPerson: 'Roshan Bandara',
    phone: '+94 75 555 6666',
    email: 'roshan@budgetmart.lk',
    address: '23 High Level Road, Nugegoda',
    tier: 'silver',
    status: 'blocked',
    totalOrders: 28,
    totalRevenue: 180000,
    totalProfit: 18000,
    codRejectionCount: 8,
    codRejectionRate: 28.57,
    commissionRate: 10,
    availableBalance: 0,
    pendingBalance: 0,
    totalWithdrawn: 18000,
    approvedAt: new Date('2023-11-01'),
    blockedReason: 'High COD rejection rate exceeding 25%. Multiple customer complaints.',
    createdAt: new Date('2023-10-25'),
    updatedAt: new Date('2024-01-15'),
  },
];

// Mock Reseller Orders
export const mockResellerOrders: ResellerOrder[] = [
  {
    id: 'ro-001',
    orderNumber: 'ORD-240121-001',
    resellerId: 'res-001',
    resellerName: 'Fashion Hub Store',
    customerName: 'Nimal Perera',
    customerPhone: '+94 77 888 9999',
    resellerPrice: 8500,
    sellingPrice: 12000,
    profit: 3500,
    commissionAmount: 1800,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    isPaid: true,
    createdAt: new Date('2024-01-21'),
  },
  {
    id: 'ro-002',
    orderNumber: 'ORD-240120-002',
    resellerId: 'res-002',
    resellerName: 'Tech Galaxy',
    customerName: 'Sunil Fernando',
    customerPhone: '+94 71 222 3333',
    resellerPrice: 45000,
    sellingPrice: 58000,
    profit: 13000,
    commissionAmount: 11600,
    orderStatus: 'shipped',
    paymentStatus: 'pending',
    isPaid: false,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'ro-003',
    orderNumber: 'ORD-240120-003',
    resellerId: 'res-001',
    resellerName: 'Fashion Hub Store',
    customerName: 'Malini Silva',
    customerPhone: '+94 76 444 5555',
    resellerPrice: 3200,
    sellingPrice: 4500,
    profit: 1300,
    commissionAmount: 675,
    orderStatus: 'processing',
    paymentStatus: 'pending',
    isPaid: false,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: 'ro-004',
    orderNumber: 'ORD-240119-001',
    resellerId: 'res-003',
    resellerName: 'Home Essentials LK',
    customerName: 'Ravi Kumar',
    customerPhone: '+94 78 666 7777',
    resellerPrice: 12000,
    sellingPrice: 15000,
    profit: 3000,
    commissionAmount: 1500,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    isPaid: true,
    createdAt: new Date('2024-01-19'),
  },
  {
    id: 'ro-005',
    orderNumber: 'ORD-240118-002',
    resellerId: 'res-004',
    resellerName: 'Urban Style Boutique',
    customerName: 'Chamari Dias',
    customerPhone: '+94 72 888 9999',
    resellerPrice: 6800,
    sellingPrice: 9500,
    profit: 2700,
    commissionAmount: 1425,
    orderStatus: 'cancelled',
    paymentStatus: 'refunded',
    isPaid: false,
    createdAt: new Date('2024-01-18'),
  },
  {
    id: 'ro-006',
    orderNumber: 'ORD-240118-003',
    resellerId: 'res-002',
    resellerName: 'Tech Galaxy',
    customerName: 'Pradeep Jayawardena',
    customerPhone: '+94 77 111 0000',
    resellerPrice: 28000,
    sellingPrice: 35000,
    profit: 7000,
    commissionAmount: 7000,
    orderStatus: 'delivered',
    paymentStatus: 'paid',
    isPaid: true,
    createdAt: new Date('2024-01-18'),
  },
];

// Mock Payout Requests
export const mockPayoutRequests: PayoutRequest[] = [
  {
    id: 'pay-001',
    resellerId: 'res-001',
    resellerName: 'Fashion Hub Store',
    amount: 25000,
    status: 'pending',
    bankDetails: {
      bankName: 'Commercial Bank',
      accountNumber: '8012345678',
      accountHolder: 'Amal Perera',
      branch: 'Colombo 03',
    },
    requestedAt: new Date('2024-01-21'),
  },
  {
    id: 'pay-002',
    resellerId: 'res-002',
    resellerName: 'Tech Galaxy',
    amount: 75000,
    status: 'approved',
    bankDetails: {
      bankName: 'Sampath Bank',
      accountNumber: '1098765432',
      accountHolder: 'Nuwan Silva',
      branch: 'Union Place',
    },
    requestedAt: new Date('2024-01-20'),
    approvedAt: new Date('2024-01-21'),
    approvedBy: 'Admin User',
  },
  {
    id: 'pay-003',
    resellerId: 'res-004',
    resellerName: 'Urban Style Boutique',
    amount: 20000,
    status: 'paid',
    bankDetails: {
      bankName: 'HNB',
      accountNumber: '2034567890',
      accountHolder: 'Dilini Weerasinghe',
      branch: 'Colombo 04',
    },
    requestedAt: new Date('2024-01-18'),
    approvedAt: new Date('2024-01-19'),
    approvedBy: 'Admin User',
    processedAt: new Date('2024-01-20'),
    processedBy: 'Finance Team',
    paymentReference: 'TXN-2024012001',
  },
  {
    id: 'pay-004',
    resellerId: 'res-003',
    resellerName: 'Home Essentials LK',
    amount: 10000,
    status: 'rejected',
    bankDetails: {
      bankName: 'BOC',
      accountNumber: '5012345678',
      accountHolder: 'Kamala Jayasuriya',
      branch: 'Colombo 09',
    },
    requestedAt: new Date('2024-01-17'),
    rejectionReason: 'Insufficient available balance. Current balance: LKR 8,500.',
  },
  {
    id: 'pay-005',
    resellerId: 'res-002',
    resellerName: 'Tech Galaxy',
    amount: 50000,
    status: 'paid',
    bankDetails: {
      bankName: 'Sampath Bank',
      accountNumber: '1098765432',
      accountHolder: 'Nuwan Silva',
      branch: 'Union Place',
    },
    requestedAt: new Date('2024-01-10'),
    approvedAt: new Date('2024-01-11'),
    approvedBy: 'Admin User',
    processedAt: new Date('2024-01-12'),
    processedBy: 'Finance Team',
    paymentReference: 'TXN-2024011201',
  },
];

// Mock Ledger Entries
export const mockResellerLedger: ResellerLedgerEntry[] = [
  {
    id: 'led-001',
    resellerId: 'res-001',
    type: 'order_profit',
    referenceId: 'ro-001',
    referenceNumber: 'ORD-240121-001',
    credit: 3500,
    debit: 0,
    balance: 48500,
    description: 'Profit from order ORD-240121-001',
    createdAt: new Date('2024-01-21'),
  },
  {
    id: 'led-002',
    resellerId: 'res-002',
    type: 'payout',
    referenceId: 'pay-005',
    credit: 0,
    debit: 50000,
    balance: 125000,
    description: 'Payout processed - Ref: TXN-2024011201',
    createdAt: new Date('2024-01-12'),
  },
  {
    id: 'led-003',
    resellerId: 'res-002',
    type: 'order_profit',
    referenceId: 'ro-006',
    referenceNumber: 'ORD-240118-003',
    credit: 7000,
    debit: 0,
    balance: 175000,
    description: 'Profit from order ORD-240118-003',
    createdAt: new Date('2024-01-18'),
  },
  {
    id: 'led-004',
    resellerId: 'res-005',
    type: 'cod_penalty',
    credit: 0,
    debit: 500,
    balance: 0,
    description: 'COD rejection penalty - Order returned due to customer refusal',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'led-005',
    resellerId: 'res-004',
    type: 'bonus',
    credit: 5000,
    debit: 0,
    balance: 33000,
    description: 'Monthly performance bonus - December 2023',
    createdAt: new Date('2024-01-05'),
  },
];
