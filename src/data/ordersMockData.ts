import type { AdminOrder } from '@/types/admin';

// Extended mock orders data for Orders Management module
export const mockOrdersExtended: AdminOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    customer: { 
      name: 'Kasun Perera', 
      email: 'kasun@email.com', 
      phone: '+94 77 123 4567', 
      address: '45 Galle Road, Colombo 07, Sri Lanka' 
    },
    items: [
      { productId: '1', name: 'Wireless Bluetooth Earbuds Pro', quantity: 2, price: 2499 },
      { productId: '3', name: 'Phone Case Premium', quantity: 1, price: 899 }
    ],
    subtotal: 5897,
    deliveryFee: 350,
    total: 6247,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'pending',
    channel: 'online',
    notes: ['Customer requested evening delivery'],
    timeline: [
      { status: 'Order Placed', timestamp: new Date('2024-01-20T10:30:00'), note: 'Order received via website' }
    ],
    codRisk: 'low',
    createdAt: new Date('2024-01-20T10:30:00'),
    updatedAt: new Date('2024-01-20T10:30:00'),
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    customer: { 
      name: 'Nimali Silva', 
      email: 'nimali@email.com', 
      phone: '+94 77 234 5678', 
      address: '78 Station Road, Gampaha, Sri Lanka' 
    },
    items: [
      { productId: '2', name: 'Smart Watch Series X', quantity: 1, price: 7999 }
    ],
    subtotal: 7999,
    deliveryFee: 400,
    total: 8399,
    paymentMethod: 'bank',
    paymentStatus: 'paid',
    orderStatus: 'confirmed',
    channel: 'online',
    notes: ['Customer confirmed via WhatsApp', 'Bank slip verified'],
    timeline: [
      { status: 'Order Placed', timestamp: new Date('2024-01-19T14:20:00') },
      { status: 'Payment Confirmed', timestamp: new Date('2024-01-19T15:45:00'), note: 'Bank transfer verified' }
    ],
    codRisk: 'low',
    createdAt: new Date('2024-01-19T14:20:00'),
    updatedAt: new Date('2024-01-19T15:45:00'),
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    customer: { 
      name: 'Ruwan Fernando', 
      email: 'ruwan@email.com', 
      phone: '+94 71 345 6789', 
      address: '23 Lake Drive, Kandy, Sri Lanka' 
    },
    items: [
      { productId: '4', name: 'Robot Vacuum Cleaner', quantity: 1, price: 15999 },
      { productId: '5', name: 'Extra Filters Set', quantity: 2, price: 1299 }
    ],
    subtotal: 18597,
    deliveryFee: 500,
    total: 19097,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    orderStatus: 'processing',
    channel: 'online',
    notes: [],
    timeline: [
      { status: 'Order Placed', timestamp: new Date('2024-01-18T09:15:00') },
      { status: 'Payment Confirmed', timestamp: new Date('2024-01-18T09:16:00'), note: 'Card payment successful' },
      { status: 'Processing', timestamp: new Date('2024-01-18T11:00:00'), note: 'Order being prepared' }
    ],
    codRisk: 'low',
    createdAt: new Date('2024-01-18T09:15:00'),
    updatedAt: new Date('2024-01-18T11:00:00'),
  },
  {
    id: '4',
    orderNumber: 'ORD-2024-004',
    customer: { 
      name: 'Dilani Jayawardena', 
      email: 'dilani@email.com', 
      phone: '+94 76 456 7890', 
      address: '156 Main Street, Negombo, Sri Lanka' 
    },
    items: [
      { productId: '6', name: 'Air Fryer Pro 5L', quantity: 1, price: 12499 }
    ],
    subtotal: 12499,
    deliveryFee: 450,
    total: 12949,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'shipped',
    channel: 'online',
    notes: ['High value COD order'],
    timeline: [
      { status: 'Order Placed', timestamp: new Date('2024-01-17T16:30:00') },
      { status: 'Confirmed', timestamp: new Date('2024-01-17T17:00:00') },
      { status: 'Processing', timestamp: new Date('2024-01-18T08:00:00') },
      { status: 'Shipped', timestamp: new Date('2024-01-18T14:30:00'), note: 'Handed to DomEx courier' }
    ],
    codRisk: 'medium',
    createdAt: new Date('2024-01-17T16:30:00'),
    updatedAt: new Date('2024-01-18T14:30:00'),
  },
  {
    id: '5',
    orderNumber: 'ORD-2024-005',
    customer: { 
      name: 'Prasad Mendis', 
      email: 'prasad@email.com', 
      phone: '+94 77 567 8901', 
      address: '89 Beach Road, Matara, Sri Lanka' 
    },
    items: [
      { productId: '7', name: 'Power Bank 20000mAh', quantity: 3, price: 3499 }
    ],
    subtotal: 10497,
    deliveryFee: 550,
    total: 11047,
    paymentMethod: 'online',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    channel: 'online',
    notes: ['Bulk order for office'],
    timeline: [
      { status: 'Order Placed', timestamp: new Date('2024-01-15T10:00:00') },
      { status: 'Payment Confirmed', timestamp: new Date('2024-01-15T10:01:00') },
      { status: 'Processing', timestamp: new Date('2024-01-15T11:30:00') },
      { status: 'Shipped', timestamp: new Date('2024-01-16T09:00:00') },
      { status: 'Delivered', timestamp: new Date('2024-01-17T14:30:00'), note: 'Signed by customer' }
    ],
    codRisk: 'low',
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-17T14:30:00'),
  },
  {
    id: '6',
    orderNumber: 'ORD-2024-006',
    customer: { 
      name: 'Chamara Rathnayake', 
      email: 'chamara@email.com', 
      phone: '+94 78 678 9012', 
      address: '12 Temple Lane, Anuradhapura, Sri Lanka' 
    },
    items: [
      { productId: '8', name: 'Wireless Keyboard & Mouse Combo', quantity: 1, price: 4999 },
      { productId: '9', name: 'USB Hub 7-Port', quantity: 1, price: 1899 }
    ],
    subtotal: 6898,
    deliveryFee: 600,
    total: 7498,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'cancelled',
    channel: 'online',
    notes: ['Customer requested cancellation - changed mind'],
    timeline: [
      { status: 'Order Placed', timestamp: new Date('2024-01-16T12:00:00') },
      { status: 'Confirmed', timestamp: new Date('2024-01-16T12:30:00') },
      { status: 'Cancelled', timestamp: new Date('2024-01-16T18:00:00'), note: 'Cancelled by customer request' }
    ],
    codRisk: 'high',
    createdAt: new Date('2024-01-16T12:00:00'),
    updatedAt: new Date('2024-01-16T18:00:00'),
  },
  {
    id: '7',
    orderNumber: 'POS-2024-001',
    customer: { 
      name: 'Walk-in Customer', 
      email: '', 
      phone: '+94 77 999 0000', 
      address: 'In-Store Purchase' 
    },
    items: [
      { productId: '1', name: 'Wireless Bluetooth Earbuds Pro', quantity: 1, price: 2499 }
    ],
    subtotal: 2499,
    deliveryFee: 0,
    total: 2499,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    channel: 'pos',
    notes: [],
    timeline: [
      { status: 'Sale Completed', timestamp: new Date('2024-01-20T11:30:00') }
    ],
    codRisk: 'low',
    createdAt: new Date('2024-01-20T11:30:00'),
    updatedAt: new Date('2024-01-20T11:30:00'),
  },
  {
    id: '8',
    orderNumber: 'ORD-2024-007',
    customer: { 
      name: 'Sanduni Wickrama', 
      email: 'sanduni@email.com', 
      phone: '+94 76 111 2233', 
      address: '34 Hill Street, Nuwara Eliya, Sri Lanka' 
    },
    items: [
      { productId: '10', name: 'Stand Mixer Professional', quantity: 1, price: 24999 }
    ],
    subtotal: 24999,
    deliveryFee: 700,
    total: 25699,
    paymentMethod: 'bank',
    paymentStatus: 'pending',
    orderStatus: 'pending',
    channel: 'online',
    notes: ['Awaiting bank slip upload'],
    timeline: [
      { status: 'Order Placed', timestamp: new Date('2024-01-20T09:00:00') }
    ],
    codRisk: 'low',
    createdAt: new Date('2024-01-20T09:00:00'),
    updatedAt: new Date('2024-01-20T09:00:00'),
  },
  {
    id: '9',
    orderNumber: 'ORD-2024-008',
    customer: { 
      name: 'Amal Rajapaksa', 
      email: 'amal@email.com', 
      phone: '+94 71 222 3344', 
      address: '67 Garden Avenue, Kurunegala, Sri Lanka' 
    },
    items: [
      { productId: '2', name: 'Smart Watch Series X', quantity: 2, price: 7999 },
      { productId: '1', name: 'Wireless Bluetooth Earbuds Pro', quantity: 2, price: 2499 }
    ],
    subtotal: 20996,
    deliveryFee: 450,
    total: 21446,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'processing',
    channel: 'online',
    notes: ['Gift wrapping requested'],
    timeline: [
      { status: 'Order Placed', timestamp: new Date('2024-01-19T08:30:00') },
      { status: 'Confirmed', timestamp: new Date('2024-01-19T09:00:00') },
      { status: 'Processing', timestamp: new Date('2024-01-19T14:00:00'), note: 'Preparing with gift wrap' }
    ],
    codRisk: 'medium',
    createdAt: new Date('2024-01-19T08:30:00'),
    updatedAt: new Date('2024-01-19T14:00:00'),
  },
  {
    id: '10',
    orderNumber: 'POS-2024-002',
    customer: { 
      name: 'Harsha Perera', 
      email: 'harsha@company.lk', 
      phone: '+94 77 333 4455', 
      address: 'In-Store Purchase' 
    },
    items: [
      { productId: '4', name: 'Robot Vacuum Cleaner', quantity: 1, price: 15999 }
    ],
    subtotal: 15999,
    deliveryFee: 0,
    total: 15999,
    paymentMethod: 'card',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    channel: 'pos',
    notes: ['Corporate purchase - invoice requested'],
    timeline: [
      { status: 'Sale Completed', timestamp: new Date('2024-01-19T16:45:00') }
    ],
    codRisk: 'low',
    createdAt: new Date('2024-01-19T16:45:00'),
    updatedAt: new Date('2024-01-19T16:45:00'),
  },
];

// Helper to get orders by status
export const getOrdersByStatus = (status: string) => {
  if (status === 'all') return mockOrdersExtended;
  return mockOrdersExtended.filter(order => order.orderStatus === status);
};

// Order statistics
export const getOrderStats = () => {
  const total = mockOrdersExtended.length;
  const pending = mockOrdersExtended.filter(o => o.orderStatus === 'pending').length;
  const processing = mockOrdersExtended.filter(o => o.orderStatus === 'processing' || o.orderStatus === 'confirmed').length;
  const shipped = mockOrdersExtended.filter(o => o.orderStatus === 'shipped').length;
  const delivered = mockOrdersExtended.filter(o => o.orderStatus === 'delivered').length;
  const cancelled = mockOrdersExtended.filter(o => o.orderStatus === 'cancelled').length;
  
  const totalRevenue = mockOrdersExtended
    .filter(o => o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  
  const codOrders = mockOrdersExtended.filter(o => o.paymentMethod === 'cod').length;
  const highRiskCOD = mockOrdersExtended.filter(o => o.codRisk === 'high' || o.codRisk === 'medium').length;

  return {
    total,
    pending,
    processing,
    shipped,
    delivered,
    cancelled,
    totalRevenue,
    codOrders,
    highRiskCOD,
  };
};
