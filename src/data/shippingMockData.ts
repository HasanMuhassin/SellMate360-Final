import type { Shipment, CourierPartner } from '@/types/admin';

export interface DeliveryZone {
  id: string;
  name: string;
  districts: string[];
  baseRate: number;
  perKgRate: number;
  estimatedDays: number;
  codAvailable: boolean;
  status: 'active' | 'inactive';
}

export interface ShipmentTracking {
  id: string;
  shipmentId: string;
  status: string;
  location: string;
  description: string;
  timestamp: Date;
}

export interface ExtendedShipment extends Shipment {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  weight?: number;
  codAmount?: number;
  trackingHistory: ShipmentTracking[];
}

export const mockShipmentsExtended: ExtendedShipment[] = [
  {
    id: '1',
    orderId: '1',
    orderNumber: 'ORD-2024-001',
    courier: 'DomEx',
    trackingNumber: 'DX123456789',
    status: 'pending',
    customerName: 'Kasun Perera',
    customerPhone: '+94 77 123 4567',
    customerAddress: '45 Galle Road, Colombo 07, Sri Lanka',
    weight: 0.5,
    codAmount: 6247,
    createdAt: new Date('2024-01-20T14:30:00'),
    trackingHistory: [
      { id: '1', shipmentId: '1', status: 'pending', location: 'Warehouse', description: 'Shipment created, awaiting pickup', timestamp: new Date('2024-01-20T14:30:00') },
    ],
  },
  {
    id: '2',
    orderId: '4',
    orderNumber: 'ORD-2024-004',
    courier: 'DomEx',
    trackingNumber: 'DX987654321',
    status: 'in_transit',
    customerName: 'Dilani Jayawardena',
    customerPhone: '+94 76 456 7890',
    customerAddress: '156 Main Street, Negombo, Sri Lanka',
    weight: 2.5,
    codAmount: 12949,
    estimatedDelivery: new Date('2024-01-22'),
    createdAt: new Date('2024-01-18T14:30:00'),
    trackingHistory: [
      { id: '1', shipmentId: '2', status: 'pending', location: 'Warehouse', description: 'Shipment created', timestamp: new Date('2024-01-18T14:30:00') },
      { id: '2', shipmentId: '2', status: 'picked', location: 'Warehouse', description: 'Picked up by courier', timestamp: new Date('2024-01-19T09:00:00') },
      { id: '3', shipmentId: '2', status: 'in_transit', location: 'Colombo Hub', description: 'In transit to destination', timestamp: new Date('2024-01-19T14:00:00') },
    ],
  },
  {
    id: '3',
    orderId: '3',
    orderNumber: 'ORD-2024-003',
    courier: 'Pronto',
    trackingNumber: 'PR456789123',
    status: 'picked',
    customerName: 'Ruwan Fernando',
    customerPhone: '+94 71 345 6789',
    customerAddress: '23 Lake Drive, Kandy, Sri Lanka',
    weight: 4.2,
    estimatedDelivery: new Date('2024-01-23'),
    createdAt: new Date('2024-01-18T11:00:00'),
    trackingHistory: [
      { id: '1', shipmentId: '3', status: 'pending', location: 'Warehouse', description: 'Shipment created', timestamp: new Date('2024-01-18T11:00:00') },
      { id: '2', shipmentId: '3', status: 'picked', location: 'Warehouse', description: 'Picked up by Pronto rider', timestamp: new Date('2024-01-19T10:30:00') },
    ],
  },
  {
    id: '4',
    orderId: '5',
    orderNumber: 'ORD-2024-005',
    courier: 'Pronto',
    trackingNumber: 'PR789123456',
    status: 'delivered',
    customerName: 'Prasad Mendis',
    customerPhone: '+94 77 567 8901',
    customerAddress: '89 Beach Road, Matara, Sri Lanka',
    weight: 1.8,
    estimatedDelivery: new Date('2024-01-17'),
    actualDelivery: new Date('2024-01-17T14:30:00'),
    createdAt: new Date('2024-01-15T11:00:00'),
    trackingHistory: [
      { id: '1', shipmentId: '4', status: 'pending', location: 'Warehouse', description: 'Shipment created', timestamp: new Date('2024-01-15T11:00:00') },
      { id: '2', shipmentId: '4', status: 'picked', location: 'Warehouse', description: 'Picked up by courier', timestamp: new Date('2024-01-16T08:00:00') },
      { id: '3', shipmentId: '4', status: 'in_transit', location: 'Galle Hub', description: 'Package at sorting facility', timestamp: new Date('2024-01-16T15:00:00') },
      { id: '4', shipmentId: '4', status: 'in_transit', location: 'Matara', description: 'Out for delivery', timestamp: new Date('2024-01-17T09:00:00') },
      { id: '5', shipmentId: '4', status: 'delivered', location: 'Matara', description: 'Delivered to customer', timestamp: new Date('2024-01-17T14:30:00') },
    ],
  },
  {
    id: '5',
    orderId: '9',
    orderNumber: 'ORD-2024-008',
    courier: 'DomEx',
    trackingNumber: 'DX111222333',
    status: 'pending',
    customerName: 'Amal Rajapaksa',
    customerPhone: '+94 71 222 3344',
    customerAddress: '67 Garden Avenue, Kurunegala, Sri Lanka',
    weight: 1.2,
    codAmount: 21446,
    createdAt: new Date('2024-01-19T15:00:00'),
    trackingHistory: [
      { id: '1', shipmentId: '5', status: 'pending', location: 'Warehouse', description: 'Shipment created, awaiting pickup', timestamp: new Date('2024-01-19T15:00:00') },
    ],
  },
  {
    id: '6',
    orderId: '6',
    orderNumber: 'ORD-2024-006',
    courier: 'Speed Post',
    trackingNumber: 'SP444555666',
    status: 'returned',
    customerName: 'Chamara Rathnayake',
    customerPhone: '+94 78 678 9012',
    customerAddress: '12 Temple Lane, Anuradhapura, Sri Lanka',
    weight: 0.8,
    createdAt: new Date('2024-01-16T13:00:00'),
    trackingHistory: [
      { id: '1', shipmentId: '6', status: 'pending', location: 'Warehouse', description: 'Shipment created', timestamp: new Date('2024-01-16T13:00:00') },
      { id: '2', shipmentId: '6', status: 'picked', location: 'Warehouse', description: 'Picked up by courier', timestamp: new Date('2024-01-17T09:00:00') },
      { id: '3', shipmentId: '6', status: 'in_transit', location: 'Anuradhapura Hub', description: 'At destination hub', timestamp: new Date('2024-01-17T18:00:00') },
      { id: '4', shipmentId: '6', status: 'returned', location: 'Anuradhapura', description: 'Customer not available - returned', timestamp: new Date('2024-01-18T12:00:00') },
    ],
  },
];

export const mockCouriersExtended: CourierPartner[] = [
  { 
    id: '1', 
    name: 'DomEx', 
    code: 'DOMEX', 
    status: 'active', 
    deliveryZones: ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Kurunegala', 'Negombo'],
    apiKey: '••••••••••••'
  },
  { 
    id: '2', 
    name: 'Pronto', 
    code: 'PRONTO', 
    status: 'active', 
    deliveryZones: ['All Island'],
    apiKey: '••••••••••••'
  },
  { 
    id: '3', 
    name: 'Speed Post', 
    code: 'SPEEDPOST', 
    status: 'inactive', 
    deliveryZones: ['Colombo', 'Gampaha']
  },
  { 
    id: '4', 
    name: 'SL Express', 
    code: 'SLEXPRESS', 
    status: 'active', 
    deliveryZones: ['Western Province', 'Southern Province', 'Central Province']
  },
];

export const mockDeliveryZones: DeliveryZone[] = [
  { 
    id: '1', 
    name: 'Colombo Metro', 
    districts: ['Colombo 01', 'Colombo 02', 'Colombo 03', 'Colombo 04', 'Colombo 05', 'Colombo 06', 'Colombo 07'], 
    baseRate: 250, 
    perKgRate: 50, 
    estimatedDays: 1, 
    codAvailable: true, 
    status: 'active' 
  },
  { 
    id: '2', 
    name: 'Colombo Suburbs', 
    districts: ['Colombo 08', 'Colombo 09', 'Colombo 10', 'Colombo 11', 'Colombo 12', 'Colombo 13', 'Colombo 14', 'Colombo 15'], 
    baseRate: 300, 
    perKgRate: 50, 
    estimatedDays: 1, 
    codAvailable: true, 
    status: 'active' 
  },
  { 
    id: '3', 
    name: 'Gampaha District', 
    districts: ['Gampaha', 'Negombo', 'Ja-Ela', 'Wattala', 'Kelaniya', 'Kadawatha', 'Ragama'], 
    baseRate: 350, 
    perKgRate: 60, 
    estimatedDays: 1, 
    codAvailable: true, 
    status: 'active' 
  },
  { 
    id: '4', 
    name: 'Kalutara District', 
    districts: ['Kalutara', 'Panadura', 'Horana', 'Bandaragama', 'Moratuwa'], 
    baseRate: 400, 
    perKgRate: 70, 
    estimatedDays: 2, 
    codAvailable: true, 
    status: 'active' 
  },
  { 
    id: '5', 
    name: 'Southern Province', 
    districts: ['Galle', 'Matara', 'Hambantota', 'Hikkaduwa', 'Weligama'], 
    baseRate: 500, 
    perKgRate: 80, 
    estimatedDays: 2, 
    codAvailable: true, 
    status: 'active' 
  },
  { 
    id: '6', 
    name: 'Central Province', 
    districts: ['Kandy', 'Matale', 'Nuwara Eliya', 'Peradeniya', 'Gampola'], 
    baseRate: 550, 
    perKgRate: 90, 
    estimatedDays: 2, 
    codAvailable: true, 
    status: 'active' 
  },
  { 
    id: '7', 
    name: 'North Western Province', 
    districts: ['Kurunegala', 'Puttalam', 'Chilaw', 'Kuliyapitiya'], 
    baseRate: 550, 
    perKgRate: 85, 
    estimatedDays: 2, 
    codAvailable: true, 
    status: 'active' 
  },
  { 
    id: '8', 
    name: 'Northern Province', 
    districts: ['Jaffna', 'Vavuniya', 'Kilinochchi', 'Mannar', 'Mullaitivu'], 
    baseRate: 700, 
    perKgRate: 100, 
    estimatedDays: 3, 
    codAvailable: false, 
    status: 'active' 
  },
  { 
    id: '9', 
    name: 'Eastern Province', 
    districts: ['Trincomalee', 'Batticaloa', 'Ampara', 'Kalmunai'], 
    baseRate: 650, 
    perKgRate: 95, 
    estimatedDays: 3, 
    codAvailable: false, 
    status: 'active' 
  },
  { 
    id: '10', 
    name: 'North Central Province', 
    districts: ['Anuradhapura', 'Polonnaruwa', 'Dambulla'], 
    baseRate: 600, 
    perKgRate: 90, 
    estimatedDays: 2, 
    codAvailable: true, 
    status: 'active' 
  },
];

// Statistics
export const getShippingStats = () => {
  const total = mockShipmentsExtended.length;
  const pending = mockShipmentsExtended.filter(s => s.status === 'pending').length;
  const picked = mockShipmentsExtended.filter(s => s.status === 'picked').length;
  const inTransit = mockShipmentsExtended.filter(s => s.status === 'in_transit').length;
  const delivered = mockShipmentsExtended.filter(s => s.status === 'delivered').length;
  const returned = mockShipmentsExtended.filter(s => s.status === 'returned').length;
  
  const activeCouriers = mockCouriersExtended.filter(c => c.status === 'active').length;
  const activeZones = mockDeliveryZones.filter(z => z.status === 'active').length;

  return {
    total,
    pending,
    picked,
    inTransit,
    delivered,
    returned,
    activeCouriers,
    activeZones,
  };
};
