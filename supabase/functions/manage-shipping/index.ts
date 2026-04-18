import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function logAudit(client: any, entry: { action: string; resource: string; resource_id?: string; details?: any; level?: string }) {
  try {
    await client.from("audit_logs").insert({
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id || null,
      details: entry.details || {},
      level: entry.level || "info",
      user_name: "Admin",
      user_role: "admin",
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
    const serviceKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(url, serviceKey);

    const { action, ...payload } = await req.json();

    switch (action) {
      // ==================== SHIPMENTS ====================
      case "get_shipments": {
        const { data: shipments, error } = await client
          .from("shipments")
          .select(`
            id, order_id, tracking_number, waybill_number, weight, dimensions,
            package_count, shipping_cost, cod_amount, status, current_location,
            last_status_update, estimated_delivery, picked_at, in_transit_at,
            out_for_delivery_at, delivered_at, returned_at, received_by,
            delivery_notes, return_reason, created_at, updated_at,
            courier:courier_id(id, name, code),
            order:order_id(id, order_number, shipping_name, shipping_phone, shipping_street, shipping_district, shipping_city, total, order_status)
          `)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const mapped = (shipments || []).map((s: any) => ({
          id: s.id,
          orderId: s.order?.id || s.order_id,
          orderNumber: s.order?.order_number || '',
          courier: s.courier?.name || '',
          courierId: s.courier?.id || '',
          courierCode: s.courier?.code || '',
          trackingNumber: s.tracking_number || '',
          status: s.status || 'pending',
          customerName: s.order?.shipping_name || '',
          customerPhone: s.order?.shipping_phone || '',
          customerAddress: [s.order?.shipping_street, s.order?.shipping_district, s.order?.shipping_city].filter(Boolean).join(', '),
          weight: s.weight,
          codAmount: s.cod_amount,
          estimatedDelivery: s.estimated_delivery,
          actualDelivery: s.delivered_at,
          createdAt: s.created_at,
        }));

        return jsonResponse(mapped);
      }

      case "get_shipment_detail": {
        const { id } = payload;
        const { data: shipment, error } = await client
          .from("shipments")
          .select(`
            *,
            courier:courier_id(id, name, code),
            order:order_id(id, order_number, shipping_name, shipping_phone, shipping_street, shipping_district, shipping_city, total, order_status)
          `)
          .eq("id", id)
          .single();
        if (error) throw error;

        const { data: tracking } = await client
          .from("shipment_tracking")
          .select("*")
          .eq("shipment_id", id)
          .order("created_at", { ascending: true });

        const mapped = {
          id: shipment.id,
          orderId: shipment.order?.id || shipment.order_id,
          orderNumber: shipment.order?.order_number || '',
          courier: shipment.courier?.name || '',
          courierId: shipment.courier?.id || '',
          courierCode: shipment.courier?.code || '',
          trackingNumber: shipment.tracking_number || '',
          status: shipment.status || 'pending',
          customerName: shipment.order?.shipping_name || '',
          customerPhone: shipment.order?.shipping_phone || '',
          customerAddress: [shipment.order?.shipping_street, shipment.order?.shipping_district, shipment.order?.shipping_city].filter(Boolean).join(', '),
          weight: shipment.weight,
          codAmount: shipment.cod_amount,
          estimatedDelivery: shipment.estimated_delivery,
          actualDelivery: shipment.delivered_at,
          createdAt: shipment.created_at,
          trackingHistory: (tracking || []).map((t: any) => ({
            id: t.id,
            shipmentId: t.shipment_id,
            status: t.status,
            location: t.location || '',
            description: t.description || '',
            timestamp: t.created_at,
          })),
        };

        return jsonResponse(mapped);
      }

      case "create_shipment": {
        const { order_id, courier_id, weight, dimensions, notes, cod_amount } = payload;

        const { data: courier } = await client
          .from("courier_partners")
          .select("code")
          .eq("id", courier_id)
          .single();

        const trackingNumber = `${courier?.code || 'SHP'}${Date.now().toString().slice(-9)}`;

        const { data: shipment, error } = await client
          .from("shipments")
          .insert({
            order_id,
            courier_id,
            tracking_number: trackingNumber,
            weight: weight || null,
            dimensions: dimensions || null,
            cod_amount: cod_amount || 0,
            status: "pending",
            delivery_notes: notes || null,
          })
          .select()
          .single();
        if (error) throw error;

        await client.from("shipment_tracking").insert({
          shipment_id: shipment.id,
          status: "pending",
          location: "Warehouse",
          description: "Shipment created, awaiting pickup",
        });

        await client
          .from("orders")
          .update({ order_status: "shipped" })
          .eq("id", order_id);

        await logAudit(client, {
          action: "shipment_created",
          resource: "shipments",
          resource_id: shipment.id,
          details: { tracking_number: trackingNumber, order_id },
        });

        return jsonResponse({ success: true, shipment, trackingNumber });
      }

      case "update_shipment_status": {
        const { id, status: newStatus } = payload;

        const updateFields: any = { status: newStatus, last_status_update: new Date().toISOString() };
        if (newStatus === "picked") updateFields.picked_at = new Date().toISOString();
        if (newStatus === "in_transit") updateFields.in_transit_at = new Date().toISOString();
        if (newStatus === "out_for_delivery") updateFields.out_for_delivery_at = new Date().toISOString();
        if (newStatus === "delivered") updateFields.delivered_at = new Date().toISOString();
        if (newStatus === "returned") updateFields.returned_at = new Date().toISOString();

        const { error } = await client
          .from("shipments")
          .update(updateFields)
          .eq("id", id);
        if (error) throw error;

        await client.from("shipment_tracking").insert({
          shipment_id: id,
          status: newStatus,
          location: "",
          description: `Status updated to ${newStatus}`,
        });

        if (newStatus === "delivered") {
          const { data: shipment } = await client
            .from("shipments")
            .select("order_id")
            .eq("id", id)
            .single();
          if (shipment) {
            await client
              .from("orders")
              .update({ order_status: "delivered" })
              .eq("id", shipment.order_id);
          }
        }

        await logAudit(client, {
          action: "shipment_status_changed",
          resource: "shipments",
          resource_id: id,
          details: { new_status: newStatus },
          level: newStatus === "returned" ? "warning" : "info",
        });

        return jsonResponse({ success: true });
      }

      // ==================== COURIER PARTNERS ====================
      case "get_couriers": {
        const { data: couriers, error } = await client
          .from("courier_partners")
          .select("*")
          .order("name");
        if (error) throw error;

        const mapped = (couriers || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          logoUrl: c.logo_url,
          apiEndpoint: c.api_endpoint,
          apiKey: c.api_key ? '••••••••••••' : undefined,
          hasApiKey: !!c.api_key,
          webhookUrl: c.webhook_url,
          deliveryZones: c.delivery_zones || [],
          baseRate: c.base_rate || 0,
          perKgRate: c.per_kg_rate || 0,
          codFee: c.cod_fee || 0,
          codPercentage: c.cod_percentage || 0,
          estimatedDays: c.estimated_days || 3,
          status: c.status || 'active',
        }));

        return jsonResponse(mapped);
      }

      case "create_courier": {
        const { name, code, api_key, delivery_zones, status, base_rate, per_kg_rate, cod_fee, estimated_days } = payload;
        const { data, error } = await client
          .from("courier_partners")
          .insert({
            name, code,
            api_key: api_key || null,
            delivery_zones: delivery_zones || [],
            status: status || "active",
            base_rate: base_rate || 0,
            per_kg_rate: per_kg_rate || 0,
            cod_fee: cod_fee || 0,
            estimated_days: estimated_days || 3,
          })
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "courier_created", resource: "courier_partners", resource_id: data.id, details: { name, code } });
        return jsonResponse({ success: true, courier: data });
      }

      case "update_courier": {
        const { id, ...updates } = payload;
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.code !== undefined) dbUpdates.code = updates.code;
        if (updates.api_key !== undefined) dbUpdates.api_key = updates.api_key;
        if (updates.delivery_zones !== undefined) dbUpdates.delivery_zones = updates.delivery_zones;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.base_rate !== undefined) dbUpdates.base_rate = updates.base_rate;
        if (updates.per_kg_rate !== undefined) dbUpdates.per_kg_rate = updates.per_kg_rate;

        const { error } = await client
          .from("courier_partners")
          .update(dbUpdates)
          .eq("id", id);
        if (error) throw error;
        await logAudit(client, { action: "courier_updated", resource: "courier_partners", resource_id: id, details: { updated_fields: Object.keys(dbUpdates) } });
        return jsonResponse({ success: true });
      }

      case "delete_courier": {
        const { id } = payload;
        const { error } = await client
          .from("courier_partners")
          .delete()
          .eq("id", id);
        if (error) throw error;
        await logAudit(client, { action: "courier_deleted", resource: "courier_partners", resource_id: id, level: "warning" });
        return jsonResponse({ success: true });
      }

      // ==================== DELIVERY ZONES ====================
      case "get_delivery_zones": {
        const { data: zones, error } = await client
          .from("delivery_zones")
          .select("*")
          .order("name");
        if (error) throw error;

        const mapped = (zones || []).map((z: any) => ({
          id: z.id,
          name: z.name,
          districts: z.districts || [],
          baseRate: z.base_rate || 0,
          perKgRate: z.per_kg_rate || 0,
          freeShippingThreshold: z.free_shipping_threshold,
          estimatedDays: z.estimated_days || 3,
          codAvailable: true,
          status: z.status || 'active',
        }));

        return jsonResponse(mapped);
      }

      case "create_delivery_zone": {
        const { name, districts, base_rate, per_kg_rate, estimated_days, free_shipping_threshold, status } = payload;
        const { data, error } = await client
          .from("delivery_zones")
          .insert({
            name,
            districts: districts || [],
            base_rate: base_rate || 0,
            per_kg_rate: per_kg_rate || 0,
            estimated_days: estimated_days || 3,
            free_shipping_threshold: free_shipping_threshold || null,
            status: status || "active",
          })
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "delivery_zone_created", resource: "delivery_zones", resource_id: data.id, details: { name } });
        return jsonResponse({ success: true, zone: data });
      }

      case "update_delivery_zone": {
        const { id, ...updates } = payload;
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.districts !== undefined) dbUpdates.districts = updates.districts;
        if (updates.base_rate !== undefined) dbUpdates.base_rate = updates.base_rate;
        if (updates.per_kg_rate !== undefined) dbUpdates.per_kg_rate = updates.per_kg_rate;
        if (updates.estimated_days !== undefined) dbUpdates.estimated_days = updates.estimated_days;
        if (updates.status !== undefined) dbUpdates.status = updates.status;

        const { error } = await client
          .from("delivery_zones")
          .update(dbUpdates)
          .eq("id", id);
        if (error) throw error;
        await logAudit(client, { action: "delivery_zone_updated", resource: "delivery_zones", resource_id: id });
        return jsonResponse({ success: true });
      }

      case "delete_delivery_zone": {
        const { id } = payload;
        const { error } = await client
          .from("delivery_zones")
          .delete()
          .eq("id", id);
        if (error) throw error;
        await logAudit(client, { action: "delivery_zone_deleted", resource: "delivery_zones", resource_id: id, level: "warning" });
        return jsonResponse({ success: true });
      }

      // ==================== SHIPPABLE ORDERS ====================
      case "get_shippable_orders": {
        const { data: orders, error } = await client
          .from("orders")
          .select("id, order_number, shipping_name, shipping_phone, shipping_street, shipping_district, shipping_city, total, order_status")
          .in("order_status", ["confirmed", "processing"])
          .order("created_at", { ascending: false });
        if (error) throw error;

        const { data: existingShipments } = await client
          .from("shipments")
          .select("order_id");

        const shippedOrderIds = new Set((existingShipments || []).map((s: any) => s.order_id));

        const shippable = (orders || [])
          .filter((o: any) => !shippedOrderIds.has(o.id))
          .map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number,
            customerName: o.shipping_name,
            customerPhone: o.shipping_phone,
            customerAddress: [o.shipping_street, o.shipping_district, o.shipping_city].filter(Boolean).join(', '),
            total: o.total,
            orderStatus: o.order_status,
          }));

        return jsonResponse(shippable);
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error("manage-shipping error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
