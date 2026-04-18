import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function callShippingFn(action: string, payload: Record<string, any> = {}) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-shipping`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ==================== Types ====================
export interface ShipmentListItem {
  id: string;
  orderId: string;
  orderNumber: string;
  courier: string;
  courierId: string;
  courierCode: string;
  trackingNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  weight?: number;
  codAmount?: number;
  estimatedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
}

export interface ShipmentDetail extends ShipmentListItem {
  trackingHistory: TrackingEvent[];
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  status: string;
  location: string;
  description: string;
  timestamp: string;
}

export interface CourierPartnerData {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  apiEndpoint?: string;
  apiKey?: string;
  hasApiKey: boolean;
  webhookUrl?: string;
  deliveryZones: string[];
  baseRate: number;
  perKgRate: number;
  codFee: number;
  codPercentage: number;
  estimatedDays: number;
  status: string;
}

export interface DeliveryZoneData {
  id: string;
  name: string;
  districts: string[];
  baseRate: number;
  perKgRate: number;
  freeShippingThreshold?: number;
  estimatedDays: number;
  codAvailable: boolean;
  status: string;
}

export interface ShippableOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  total: number;
  orderStatus: string;
}

// ==================== Hooks ====================

export function useShipments() {
  return useQuery<ShipmentListItem[]>({
    queryKey: ['shipments'],
    queryFn: () => callShippingFn('get_shipments'),
  });
}

export function useShipmentDetail(id: string | undefined) {
  return useQuery<ShipmentDetail>({
    queryKey: ['shipment', id],
    queryFn: () => callShippingFn('get_shipment_detail', { id }),
    enabled: !!id,
  });
}

export function useCouriers() {
  return useQuery<CourierPartnerData[]>({
    queryKey: ['couriers'],
    queryFn: () => callShippingFn('get_couriers'),
  });
}

export function useDeliveryZones() {
  return useQuery<DeliveryZoneData[]>({
    queryKey: ['delivery-zones'],
    queryFn: () => callShippingFn('get_delivery_zones'),
  });
}

export function useShippableOrders() {
  return useQuery<ShippableOrder[]>({
    queryKey: ['shippable-orders'],
    queryFn: () => callShippingFn('get_shippable_orders'),
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { order_id: string; courier_id: string; weight?: number; dimensions?: any; notes?: string; cod_amount?: number }) =>
      callShippingFn('create_shipment', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      qc.invalidateQueries({ queryKey: ['shippable-orders'] });
      toast.success('Shipment created successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateShipmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: string; status: string }) =>
      callShippingFn('update_shipment_status', payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      qc.invalidateQueries({ queryKey: ['shipment', vars.id] });
      toast.success('Shipment status updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => callShippingFn('create_courier', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['couriers'] });
      toast.success('Courier partner added');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => callShippingFn('update_courier', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['couriers'] });
      toast.success('Courier partner updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callShippingFn('delete_courier', { id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['couriers'] });
      toast.success('Courier partner deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => callShippingFn('create_delivery_zone', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast.success('Delivery zone added');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => callShippingFn('update_delivery_zone', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast.success('Delivery zone updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callShippingFn('delete_delivery_zone', { id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast.success('Delivery zone deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ==================== Stats Helper ====================
export function getShippingStatsFromData(shipments: ShipmentListItem[], couriers: CourierPartnerData[], zones: DeliveryZoneData[]) {
  return {
    total: shipments.length,
    pending: shipments.filter(s => s.status === 'pending').length,
    picked: shipments.filter(s => s.status === 'picked').length,
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    returned: shipments.filter(s => s.status === 'returned').length,
    activeCouriers: couriers.filter(c => c.status === 'active').length,
    activeZones: zones.filter(z => z.status === 'active').length,
  };
}
