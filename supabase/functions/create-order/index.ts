import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { order, items } = await req.json();
    if (!order || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Missing order or items" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(supabaseUrl, serviceKey);

    // ── Step 1: Insert the order row ─────────────────────────────────────────
    // Only send columns we know exist and have valid values.
    // Enum columns (order_status, payment_status, channel, cod_risk) have DB defaults
    // so we omit them unless we are sure the value is a valid enum member.
    const orderTotal = Number(order.total ?? 0);
    const { data: newOrder, error: orderError } = await db
      .from("orders")
      .insert({
        // ── Required fields (NOT NULL, no default) ──
        shipping_name:     order.shipping_name,
        shipping_phone:    order.shipping_phone,
        shipping_district: order.shipping_district,
        shipping_city:     order.shipping_city,
        shipping_street:   order.shipping_street,
        subtotal:          orderTotal,
        total:             orderTotal,
        payment_method:    order.payment_method ?? "cod",  // enum: 'cod'|'card'|'online'
        // ── Optional fields ──
        reseller_id:       order.reseller_id    ?? null,
        shipping_email:    order.shipping_email ?? null,
        // order_status, payment_status, channel, cod_risk → use DB defaults
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return new Response(JSON.stringify({ error: orderError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 2: Insert order items linked to the new order ───────────────────
    const orderItems = items.map((item: Record<string, unknown>) => ({
      order_id:     newOrder.id,
      product_id:   item.product_id,
      product_name: String(item.product_name ?? ""),
      product_sku:  String(item.product_sku  ?? ""),  // NOT NULL in live schema
      quantity:     Number(item.quantity   ?? 1),
      unit_price:   Number(item.unit_price ?? 0),
      total:        Number(item.total_price ?? item.unit_price ?? 0),  // column is 'total' not 'total_price'
    }));

    const { error: itemsError } = await db
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      // Best-effort rollback: delete the orphaned order row
      await db.from("orders").delete().eq("id", newOrder.id);
      return new Response(JSON.stringify({ error: itemsError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Audit log ─────────────────────────────────────────────────────────────
    try {
      await db.from("audit_logs").insert({
        action:      "order_created",
        resource:    "orders",
        resource_id: newOrder.id,
        details: {
          order_number: newOrder.order_number,
          total:        newOrder.total,
          items_count:  items.length,
        },
        level:     "info",
        user_name: order.shipping_name || "Customer",
        user_role: "customer",
      });
    } catch (_auditErr) { /* audit failure must never block order success */ }

    return new Response(JSON.stringify({ order: newOrder }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
