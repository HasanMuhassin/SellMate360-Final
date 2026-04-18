// Customer Management Mock Data

export interface CustomerAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  district: string;
  city: string;
  street: string;
  postalCode?: string;
  isDefault: boolean;
  deliveryInstructions?: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: Date;
  items: number;
  total: number;
  paymentMethod: 'cod' | 'bank' | 'card' | 'online';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  codRejected?: boolean;
}

export interface CustomerNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  type: 'general' | 'complaint' | 'feedback' | 'internal';
}

export interface ExtendedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  avatar?: string;
  addresses: CustomerAddress[];
  orderCount: number;
  totalSpent: number;
  averageOrderValue: number;
  codRejectionCount: number;
  codRejectionRate: number;
  riskScore: 'low' | 'medium' | 'high';
  riskFactors: string[];
  isBlocked: boolean;
  blockedReason?: string;
  notes: CustomerNote[];
  tags: string[];
  preferredPayment?: 'cod' | 'bank' | 'card' | 'online';
  lastOrderDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Risk score calculation factors
export const riskFactors = {
  highCodRejection: 'High COD rejection rate (>15%)',
  recentRejections: 'Recent COD rejections',
  newCustomer: 'New customer with limited history',
  largeOrder: 'Large order value relative to history',
  multipleAddresses: 'Multiple delivery addresses',
  noCompletedOrders: 'No completed orders yet',
  previousComplaints: 'Previous delivery complaints',
};

// Mock Extended Customers
export const mockExtendedCustomers: ExtendedCustomer[] = [
  {
    id: 'cust-001',
    name: 'Kasun Perera',
    email: 'kasun.perera@email.com',
    phone: '+94 77 123 4567',
    alternatePhone: '+94 11 234 5678',
    addresses: [
      {
        id: 'addr-001',
        label: 'Home',
        recipientName: 'Kasun Perera',
        phone: '+94 77 123 4567',
        district: 'Colombo',
        city: 'Colombo 07',
        street: '45, Flower Road, Kollupitiya',
        postalCode: '00700',
        isDefault: true,
        deliveryInstructions: 'Ring doorbell twice',
      },
      {
        id: 'addr-002',
        label: 'Office',
        recipientName: 'Kasun Perera',
        phone: '+94 77 123 4567',
        district: 'Colombo',
        city: 'Colombo 03',
        street: 'Level 5, World Trade Center',
        postalCode: '00300',
        isDefault: false,
      },
    ],
    orderCount: 12,
    totalSpent: 145000,
    averageOrderValue: 12083,
    codRejectionCount: 0,
    codRejectionRate: 0,
    riskScore: 'low',
    riskFactors: [],
    isBlocked: false,
    notes: [
      {
        id: 'note-001',
        content: 'VIP customer - always pays on time',
        createdBy: 'Admin',
        createdAt: new Date('2024-01-10'),
        type: 'general',
      },
    ],
    tags: ['VIP', 'Repeat Customer'],
    preferredPayment: 'card',
    lastOrderDate: new Date('2024-01-20'),
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'cust-002',
    name: 'Nimali Silva',
    email: 'nimali.silva@email.com',
    phone: '+94 76 234 5678',
    addresses: [
      {
        id: 'addr-003',
        label: 'Home',
        recipientName: 'Nimali Silva',
        phone: '+94 76 234 5678',
        district: 'Gampaha',
        city: 'Negombo',
        street: '123, Beach Road',
        isDefault: true,
      },
    ],
    orderCount: 5,
    totalSpent: 38500,
    averageOrderValue: 7700,
    codRejectionCount: 1,
    codRejectionRate: 20,
    riskScore: 'medium',
    riskFactors: [riskFactors.highCodRejection, riskFactors.recentRejections],
    isBlocked: false,
    notes: [
      {
        id: 'note-002',
        content: 'Rejected COD order on Jan 15 - claimed item was different from website',
        createdBy: 'Support',
        createdAt: new Date('2024-01-15'),
        type: 'complaint',
      },
    ],
    tags: ['COD Risk'],
    preferredPayment: 'cod',
    lastOrderDate: new Date('2024-01-15'),
    createdAt: new Date('2023-06-20'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'cust-003',
    name: 'Roshan Fernando',
    email: 'roshan.f@email.com',
    phone: '+94 71 345 6789',
    addresses: [
      {
        id: 'addr-004',
        label: 'Home',
        recipientName: 'Roshan Fernando',
        phone: '+94 71 345 6789',
        district: 'Kandy',
        city: 'Peradeniya',
        street: '78, University Road',
        isDefault: true,
      },
    ],
    orderCount: 8,
    totalSpent: 92000,
    averageOrderValue: 11500,
    codRejectionCount: 0,
    codRejectionRate: 0,
    riskScore: 'low',
    riskFactors: [],
    isBlocked: false,
    notes: [],
    tags: ['Repeat Customer'],
    preferredPayment: 'bank',
    lastOrderDate: new Date('2024-01-18'),
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'cust-004',
    name: 'Dilini Wickramasinghe',
    email: 'dilini.w@email.com',
    phone: '+94 72 456 7890',
    addresses: [
      {
        id: 'addr-005',
        label: 'Home',
        recipientName: 'Dilini Wickramasinghe',
        phone: '+94 72 456 7890',
        district: 'Colombo',
        city: 'Nugegoda',
        street: '56, High Level Road',
        isDefault: true,
      },
      {
        id: 'addr-006',
        label: 'Parents House',
        recipientName: 'Mr. Wickramasinghe',
        phone: '+94 77 111 2222',
        district: 'Galle',
        city: 'Galle Fort',
        street: '12, Church Street',
        isDefault: false,
      },
      {
        id: 'addr-007',
        label: 'Shop',
        recipientName: 'Dilini - Beauty Corner',
        phone: '+94 72 456 7890',
        district: 'Colombo',
        city: 'Maharagama',
        street: '89, High Level Road',
        isDefault: false,
      },
    ],
    orderCount: 2,
    totalSpent: 15000,
    averageOrderValue: 7500,
    codRejectionCount: 1,
    codRejectionRate: 50,
    riskScore: 'high',
    riskFactors: [
      riskFactors.highCodRejection,
      riskFactors.newCustomer,
      riskFactors.multipleAddresses,
    ],
    isBlocked: false,
    notes: [
      {
        id: 'note-003',
        content: 'New customer with multiple addresses - monitor for suspicious activity',
        createdBy: 'System',
        createdAt: new Date('2024-01-12'),
        type: 'internal',
      },
    ],
    tags: ['New Customer', 'High Risk'],
    preferredPayment: 'cod',
    lastOrderDate: new Date('2024-01-12'),
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: 'cust-005',
    name: 'Chaminda Rajapaksha',
    email: 'chaminda.r@email.com',
    phone: '+94 75 567 8901',
    addresses: [
      {
        id: 'addr-008',
        label: 'Home',
        recipientName: 'Chaminda Rajapaksha',
        phone: '+94 75 567 8901',
        district: 'Kurunegala',
        city: 'Kurunegala',
        street: '34, Colombo Road',
        isDefault: true,
      },
    ],
    orderCount: 15,
    totalSpent: 225000,
    averageOrderValue: 15000,
    codRejectionCount: 0,
    codRejectionRate: 0,
    riskScore: 'low',
    riskFactors: [],
    isBlocked: false,
    notes: [
      {
        id: 'note-004',
        content: 'Loyal customer - consider for VIP program',
        createdBy: 'Admin',
        createdAt: new Date('2024-01-08'),
        type: 'general',
      },
    ],
    tags: ['VIP', 'Loyal Customer', 'Wholesale'],
    preferredPayment: 'bank',
    lastOrderDate: new Date('2024-01-19'),
    createdAt: new Date('2022-08-15'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: 'cust-006',
    name: 'Sanduni Jayawardena',
    email: 'sanduni.j@email.com',
    phone: '+94 78 678 9012',
    addresses: [
      {
        id: 'addr-009',
        label: 'Home',
        recipientName: 'Sanduni Jayawardena',
        phone: '+94 78 678 9012',
        district: 'Colombo',
        city: 'Dehiwala',
        street: '67, Galle Road',
        isDefault: true,
      },
    ],
    orderCount: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    codRejectionCount: 0,
    codRejectionRate: 0,
    riskScore: 'medium',
    riskFactors: [riskFactors.newCustomer, riskFactors.noCompletedOrders],
    isBlocked: false,
    notes: [],
    tags: ['New Customer'],
    lastOrderDate: undefined,
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21'),
  },
  {
    id: 'cust-007',
    name: 'Pradeep Bandara',
    email: 'pradeep.b@email.com',
    phone: '+94 74 789 0123',
    addresses: [
      {
        id: 'addr-010',
        label: 'Home',
        recipientName: 'Pradeep Bandara',
        phone: '+94 74 789 0123',
        district: 'Matara',
        city: 'Matara',
        street: '23, Temple Road',
        isDefault: true,
      },
    ],
    orderCount: 4,
    totalSpent: 12000,
    averageOrderValue: 3000,
    codRejectionCount: 3,
    codRejectionRate: 75,
    riskScore: 'high',
    riskFactors: [
      riskFactors.highCodRejection,
      riskFactors.recentRejections,
      riskFactors.previousComplaints,
    ],
    isBlocked: true,
    blockedReason:
      'Multiple COD rejections. Customer has rejected 3 out of 4 orders. Blocked for COD orders.',
    notes: [
      {
        id: 'note-005',
        content: 'Customer claimed products were damaged but delivery photos show intact packages',
        createdBy: 'Support',
        createdAt: new Date('2024-01-10'),
        type: 'complaint',
      },
      {
        id: 'note-006',
        content: 'Blocked from COD orders due to repeated rejections',
        createdBy: 'Admin',
        createdAt: new Date('2024-01-12'),
        type: 'internal',
      },
    ],
    tags: ['Blocked', 'High Risk', 'COD Banned'],
    preferredPayment: 'cod',
    lastOrderDate: new Date('2024-01-10'),
    createdAt: new Date('2023-11-01'),
    updatedAt: new Date('2024-01-12'),
  },
];

// Mock Customer Orders
export const mockCustomerOrders: Record<string, CustomerOrder[]> = {
  'cust-001': [
    {
      id: 'ord-001',
      orderNumber: 'ORD-240120-001',
      date: new Date('2024-01-20'),
      items: 3,
      total: 18500,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
    },
    {
      id: 'ord-002',
      orderNumber: 'ORD-240115-003',
      date: new Date('2024-01-15'),
      items: 2,
      total: 12000,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
    },
    {
      id: 'ord-003',
      orderNumber: 'ORD-240110-007',
      date: new Date('2024-01-10'),
      items: 1,
      total: 8500,
      paymentMethod: 'bank',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
    },
  ],
  'cust-002': [
    {
      id: 'ord-004',
      orderNumber: 'ORD-240115-008',
      date: new Date('2024-01-15'),
      items: 2,
      total: 9500,
      paymentMethod: 'cod',
      paymentStatus: 'refunded',
      orderStatus: 'returned',
      codRejected: true,
    },
    {
      id: 'ord-005',
      orderNumber: 'ORD-240108-002',
      date: new Date('2024-01-08'),
      items: 1,
      total: 7000,
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
    },
  ],
  'cust-003': [
    {
      id: 'ord-006',
      orderNumber: 'ORD-240118-004',
      date: new Date('2024-01-18'),
      items: 4,
      total: 25000,
      paymentMethod: 'bank',
      paymentStatus: 'paid',
      orderStatus: 'shipped',
    },
  ],
  'cust-004': [
    {
      id: 'ord-007',
      orderNumber: 'ORD-240112-009',
      date: new Date('2024-01-12'),
      items: 1,
      total: 8000,
      paymentMethod: 'cod',
      paymentStatus: 'refunded',
      orderStatus: 'returned',
      codRejected: true,
    },
    {
      id: 'ord-008',
      orderNumber: 'ORD-240105-001',
      date: new Date('2024-01-05'),
      items: 1,
      total: 7000,
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
    },
  ],
  'cust-005': [
    {
      id: 'ord-009',
      orderNumber: 'ORD-240119-002',
      date: new Date('2024-01-19'),
      items: 5,
      total: 45000,
      paymentMethod: 'bank',
      paymentStatus: 'paid',
      orderStatus: 'processing',
    },
    {
      id: 'ord-010',
      orderNumber: 'ORD-240112-005',
      date: new Date('2024-01-12'),
      items: 3,
      total: 28000,
      paymentMethod: 'bank',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
    },
  ],
  'cust-007': [
    {
      id: 'ord-011',
      orderNumber: 'ORD-240110-006',
      date: new Date('2024-01-10'),
      items: 1,
      total: 3500,
      paymentMethod: 'cod',
      paymentStatus: 'refunded',
      orderStatus: 'returned',
      codRejected: true,
    },
    {
      id: 'ord-012',
      orderNumber: 'ORD-240105-004',
      date: new Date('2024-01-05'),
      items: 1,
      total: 2800,
      paymentMethod: 'cod',
      paymentStatus: 'refunded',
      orderStatus: 'returned',
      codRejected: true,
    },
    {
      id: 'ord-013',
      orderNumber: 'ORD-231228-003',
      date: new Date('2023-12-28'),
      items: 1,
      total: 3200,
      paymentMethod: 'cod',
      paymentStatus: 'refunded',
      orderStatus: 'returned',
      codRejected: true,
    },
    {
      id: 'ord-014',
      orderNumber: 'ORD-231220-008',
      date: new Date('2023-12-20'),
      items: 1,
      total: 2500,
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
    },
  ],
};
