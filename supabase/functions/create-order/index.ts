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
    const externalUrl        = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
    const externalServiceKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;

    const { order, items } = await req.json();
    if (!order || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Missing order or items" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(externalUrl, externalServiceKey);

    // ── FIX: Use atomic Postgres function instead of two separate inserts ──────
    // The create_order_atomic RPC wraps both inserts in a single transaction.
    // If order_items insertion fails, the order row is automatically rolled back.
    // This eliminates the "ghost order" bug from the original two-step approach.
    const { data: createdOrder, error: orderError } = await adminClient.rpc(
      "create_order_atomic",
      {
        p_order: order,
        p_items: items,
      }
    );

    if (orderError) {
      console.error("Atomic order creation error:", orderError);
      return new Response(JSON.stringify({ error: orderError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit log for new order
    try {
      await adminClient.from("audit_logs").insert({
        action:    "order_created",
        resource:  "orders",
        resource_id: createdOrder.id,
        details: {
          order_number: createdOrder.order_number,
          total:        createdOrder.total,
          items_count:  items.length,
        },
        level:     "info",
        user_name: order.shipping_name || "Customer",
        user_role: "customer",
      });
    } catch (_) {}

    return new Response(JSON.stringify({ order: createdOrder }), {
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
