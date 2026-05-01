import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const STATUS_NOTIFY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-order-status`;

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

// ==================== Mappers ====================

function mapShipment(s: any): ShipmentListItem {
  return {
    id: s.id,
    orderId: s.order?.id || s.order_id,
    orderNumber: s.order?.order_number || '',
    courier: s.courier?.name || '',
    courierId: s.courier?.id || s.courier_id || '',
    courierCode: s.courier?.code || '',
    trackingNumber: s.tracking_number || '',
    status: s.status || 'pending',
    customerName: s.order?.shipping_name || '',
    customerPhone: s.order?.shipping_phone || '',
    customerAddress: [s.order?.shipping_street, s.order?.shipping_district, s.order?.shipping_city]
      .filter(Boolean).join(', '),
    weight: s.weight,
    codAmount: s.cod_amount,
    estimatedDelivery: s.estimated_delivery,
    actualDelivery: s.delivered_at,
    createdAt: s.created_at,
  };
}

function mapCourier(c: any): CourierPartnerData {
  return {
    id: c.id,
    name: c.name,
    code: c.code,
    logoUrl: c.logo_url,
    apiEndpoint: c.api_endpoint,
    hasApiKey: !!c.api_key,
    webhookUrl: c.webhook_url,
    deliveryZones: c.delivery_zones || [],
    baseRate: c.base_rate || 0,
    perKgRate: c.per_kg_rate || 0,
    codFee: c.cod_fee || 0,
    codPercentage: c.cod_percentage || 0,
    estimatedDays: c.estimated_days || 3,
    status: c.status || 'active',
  };
}

function mapZone(z: any): DeliveryZoneData {
  return {
    id: z.id,
    name: z.name,
    districts: z.districts || [],
    baseRate: z.base_rate || 0,
    perKgRate: z.per_kg_rate || 0,
    freeShippingThreshold: z.free_shipping_threshold,
    estimatedDays: z.estimated_days || 3,
    codAvailable: true,
    status: z.status || 'active',
  };
}

// ==================== Hooks ====================

export function useShipments() {
  return useQuery<ShipmentListItem[]>({
    queryKey: ['shipments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          id, order_id, tracking_number, weight, cod_amount, status,
          estimated_delivery, delivered_at, created_at,
          courier:courier_id(id, name, code),
          order:order_id(id, order_number, shipping_name, shipping_phone, shipping_street, shipping_district, shipping_city)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapShipment);
    },
    staleTime: 30_000,
  });
}

export function useShipmentDetail(id: string | undefined) {
  return useQuery<ShipmentDetail>({
    queryKey: ['shipment', id],
    queryFn: async () => {
      const { data: shipment, error } = await supabase
        .from('shipments')
        .select(`
          *,
          courier:courier_id(id, name, code),
          order:order_id(id, order_number, shipping_name, shipping_phone, shipping_street, shipping_district, shipping_city, total)
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;

      const { data: tracking } = await supabase
        .from('shipment_tracking')
        .select('*')
        .eq('shipment_id', id!)
        .order('created_at', { ascending: true });

      return {
        ...mapShipment(shipment),
        trackingHistory: (tracking || []).map((t: any) => ({
          id: t.id,
          shipmentId: t.shipment_id,
          status: t.status,
          location: t.location || '',
          description: t.description || '',
          timestamp: t.created_at,
        })),
      };
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCouriers() {
  return useQuery<CourierPartnerData[]>({
    queryKey: ['couriers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courier_partners')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []).map(mapCourier);
    },
    staleTime: 60_000,
  });
}

export function useDeliveryZones() {
  return useQuery<DeliveryZoneData[]>({
    queryKey: ['delivery-zones'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []).map(mapZone);
    },
    staleTime: 60_000,
  });
}

export function useShippableOrders() {
  return useQuery<ShippableOrder[]>({
    queryKey: ['shippable-orders'],
    queryFn: async () => {
      // Get all order_ids that already have shipments
      const { data: existingShipments } = await supabase
        .from('shipments')
        .select('order_id');
      const shippedIds = new Set((existingShipments || []).map((s: any) => s.order_id));

      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, order_number, shipping_name, shipping_phone, shipping_street, shipping_district, shipping_city, total, order_status')
        .in('order_status', ['confirmed', 'processing', 'packed', 'shipped'])
        .order('created_at', { ascending: false });
      if (error) throw error;

      return (orders || [])
        .filter((o: any) => !shippedIds.has(o.id))
        .map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          customerName: o.shipping_name,
          customerPhone: o.shipping_phone,
          customerAddress: [o.shipping_street, o.shipping_district, o.shipping_city].filter(Boolean).join(', '),
          total: o.total,
          orderStatus: o.order_status,
        }));
    },
    staleTime: 20_000,
  });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { order_id: string; courier_id: string; weight?: number; dimensions?: any; notes?: string; cod_amount?: number }) => {
      // Get courier code for tracking number prefix
      const { data: courier } = await supabase
        .from('courier_partners')
        .select('code')
        .eq('id', payload.courier_id)
        .single();

      const trackingNumber = `${courier?.code || 'SHP'}${Date.now().toString().slice(-9)}`;

      const { data: shipment, error } = await supabase
        .from('shipments')
        .insert({
          order_id: payload.order_id,
          courier_id: payload.courier_id,
          tracking_number: trackingNumber,
          weight: payload.weight || null,
          dimensions: payload.dimensions || null,
          cod_amount: payload.cod_amount || 0,
          status: 'pending',
          delivery_notes: payload.notes || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Add initial tracking event
      await supabase.from('shipment_tracking').insert({
        shipment_id: shipment.id,
        status: 'pending',
        location: 'Warehouse',
        description: 'Shipment created, awaiting pickup',
      });

      // Update order status to shipped
      await supabase
        .from('orders')
        .update({ order_status: 'shipped' })
        .eq('id', payload.order_id);

      return { shipment, trackingNumber, orderId: payload.order_id };
    },
    onSuccess: async (data) => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      qc.invalidateQueries({ queryKey: ['shippable-orders'] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Shipment created successfully');

      // Fire-and-forget: notify customer that their order has been shipped.
      try {
        const { data: { session } } = await supabase.auth.getSession();
        fetch(STATUS_NOTIFY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ orderId: data.orderId, newStatus: 'shipped' }),
        }).catch((err) => console.warn('[WA Status] Failed to trigger shipped notify:', err));
      } catch (err) {
        console.warn('[WA Status] Could not get session for shipped notify:', err);
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateShipmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string; status: string }) => {
      const updateFields: any = { status: payload.status, last_status_update: new Date().toISOString() };
      if (payload.status === 'picked') updateFields.picked_at = new Date().toISOString();
      if (payload.status === 'in_transit') updateFields.in_transit_at = new Date().toISOString();
      if (payload.status === 'out_for_delivery') updateFields.out_for_delivery_at = new Date().toISOString();
      if (payload.status === 'delivered') updateFields.delivered_at = new Date().toISOString();
      if (payload.status === 'returned') updateFields.returned_at = new Date().toISOString();

      const { error } = await supabase
        .from('shipments')
        .update(updateFields)
        .eq('id', payload.id);
      if (error) throw error;

      // Log tracking event
      await supabase.from('shipment_tracking').insert({
        shipment_id: payload.id,
        status: payload.status,
        location: '',
        description: `Status updated to ${payload.status.replace('_', ' ')}`,
      });

      // Fetch the shipment details to get the order ID and COD amount
      const { data: shipment } = await supabase
        .from('shipments')
        .select('order_id, cod_amount')
        .eq('id', payload.id)
        .single();

      if (shipment) {
        // 1. Sync the status back to the order
        let orderStatus = '';
        if (payload.status === 'in_transit') orderStatus = 'shipped';
        else if (payload.status === 'out_for_delivery') orderStatus = 'out_for_delivery';
        else if (payload.status === 'delivered') orderStatus = 'delivered';
        else if (payload.status === 'returned') orderStatus = 'returned';
        else if (payload.status === 'cancelled') orderStatus = 'cancelled';
        
        if (orderStatus) {
          await supabase
            .from('orders')
            .update({ order_status: orderStatus })
            .eq('id', shipment.order_id);
        }

        // 2. Transaction Integration (Payments)
        if (payload.status === 'delivered') {
          // Check if payment already exists
          const { data: existingPayment } = await supabase
            .from('payments')
            .select('id')
            .eq('order_id', shipment.order_id)
            .maybeSingle();

          if (!existingPayment) {
            // Create a new collected COD payment
            await supabase.from('payments').insert({
              order_id: shipment.order_id,
              amount: shipment.cod_amount,
              method: 'cod',
              status: 'collected',
              notes: 'Automatically generated upon successful delivery'
            });
          } else {
             // Mark existing pending payment as collected
             await supabase
               .from('payments')
               .update({ status: 'collected' })
               .eq('id', existingPayment.id)
               .eq('status', 'pending');
          }
        } else if (payload.status === 'returned' || payload.status === 'cancelled') {
          // Reject any pending payments
          await supabase
            .from('payments')
            .update({ status: 'rejected' })
            .eq('order_id', shipment.order_id)
            .eq('status', 'pending');
        }
      }

      // Return orderId + orderStatus so onSuccess can fire the WA notification
      return { orderId: shipment?.order_id ?? null, orderStatus };
    },
    onSuccess: async (data, vars) => {
      qc.invalidateQueries({ queryKey: ['shipments'] });
      qc.invalidateQueries({ queryKey: ['shipment', vars.id] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Shipment status updated');

      // Fire-and-forget: notify customer about the new order status.
      if (data?.orderId && data?.orderStatus) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          fetch(STATUS_NOTIFY_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token ?? ''}`,
            },
            body: JSON.stringify({ orderId: data.orderId, newStatus: data.orderStatus }),
          }).catch((err) => console.warn('[WA Status] Failed to trigger shipment-status notify:', err));
        } catch (err) {
          console.warn('[WA Status] Could not get session for shipment-status notify:', err);
        }
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from('courier_partners')
        .insert({
          name: payload.name,
          code: payload.code,
          api_key: payload.api_key || null,
          delivery_zones: payload.delivery_zones || [],
          status: payload.status || 'active',
          base_rate: payload.base_rate || 0,
          per_kg_rate: payload.per_kg_rate || 0,
          cod_fee: payload.cod_fee || 0,
          estimated_days: payload.estimated_days || 3,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['couriers'] }); toast.success('Courier partner added'); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { id, ...updates } = payload;
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.code !== undefined) dbUpdates.code = updates.code;
      if (updates.api_key !== undefined) dbUpdates.api_key = updates.api_key;
      if (updates.delivery_zones !== undefined) dbUpdates.delivery_zones = updates.delivery_zones;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.base_rate !== undefined) dbUpdates.base_rate = updates.base_rate;
      if (updates.per_kg_rate !== undefined) dbUpdates.per_kg_rate = updates.per_kg_rate;

      const { error } = await supabase.from('courier_partners').update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['couriers'] }); toast.success('Courier partner updated'); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('courier_partners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['couriers'] }); toast.success('Courier partner deleted'); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from('delivery_zones')
        .insert({
          name: payload.name,
          districts: payload.districts || [],
          base_rate: payload.base_rate || 0,
          per_kg_rate: payload.per_kg_rate || 0,
          estimated_days: payload.estimated_days || 3,
          free_shipping_threshold: payload.free_shipping_threshold || null,
          status: payload.status || 'active',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-zones'] }); toast.success('Delivery zone added'); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { id, ...updates } = payload;
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.districts !== undefined) dbUpdates.districts = updates.districts;
      if (updates.base_rate !== undefined) dbUpdates.base_rate = updates.base_rate;
      if (updates.per_kg_rate !== undefined) dbUpdates.per_kg_rate = updates.per_kg_rate;
      if (updates.estimated_days !== undefined) dbUpdates.estimated_days = updates.estimated_days;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { error } = await supabase.from('delivery_zones').update(dbUpdates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-zones'] }); toast.success('Delivery zone updated'); },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteDeliveryZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('delivery_zones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['delivery-zones'] }); toast.success('Delivery zone deleted'); },
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
