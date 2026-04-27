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
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(url, serviceKey);

    const { action, ...payload } = await req.json();

    switch (action) {
      // ==================== COUPONS ====================
      case "get_coupons": {
        const { data, error } = await client
          .from("coupons")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return jsonResponse(data);
      }

      case "create_coupon": {
        const { data, error } = await client
          .from("coupons")
          .insert(payload.coupon)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "coupon_created", resource: "coupons", resource_id: data.id, details: { code: payload.coupon.code } });
        return jsonResponse(data);
      }

      case "update_coupon": {
        const { id, ...updates } = payload.coupon;
        const { data, error } = await client
          .from("coupons")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "coupon_updated", resource: "coupons", resource_id: id, details: { updated_fields: Object.keys(updates) } });
        return jsonResponse(data);
      }

      case "delete_coupon": {
        const { error } = await client
          .from("coupons")
          .delete()
          .eq("id", payload.id);
        if (error) throw error;
        await logAudit(client, { action: "coupon_deleted", resource: "coupons", resource_id: payload.id, level: "warning" });
        return jsonResponse({ success: true });
      }

      case "toggle_coupon_status": {
        const { data: current, error: fetchErr } = await client
          .from("coupons")
          .select("status")
          .eq("id", payload.id)
          .single();
        if (fetchErr) throw fetchErr;
        const newStatus = current.status === "active" ? "inactive" : "active";
        const { data, error } = await client
          .from("coupons")
          .update({ status: newStatus })
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "coupon_status_toggled", resource: "coupons", resource_id: payload.id, details: { new_status: newStatus } });
        return jsonResponse(data);
      }

      // ==================== DISCOUNT RULES ====================
      case "get_discount_rules": {
        const { data, error } = await client
          .from("discount_rules")
          .select("*")
          .order("priority", { ascending: true });
        if (error) throw error;
        return jsonResponse(data);
      }

      case "create_discount_rule": {
        const { data, error } = await client
          .from("discount_rules")
          .insert(payload.rule)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "discount_rule_created", resource: "discount_rules", resource_id: data.id, details: { name: payload.rule.name } });
        return jsonResponse(data);
      }

      case "update_discount_rule": {
        const { id, ...updates } = payload.rule;
        const { data, error } = await client
          .from("discount_rules")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "discount_rule_updated", resource: "discount_rules", resource_id: id });
        return jsonResponse(data);
      }

      case "delete_discount_rule": {
        const { error } = await client
          .from("discount_rules")
          .delete()
          .eq("id", payload.id);
        if (error) throw error;
        await logAudit(client, { action: "discount_rule_deleted", resource: "discount_rules", resource_id: payload.id, level: "warning" });
        return jsonResponse({ success: true });
      }

      case "toggle_discount_rule_status": {
        const { data: current, error: fetchErr } = await client
          .from("discount_rules")
          .select("status")
          .eq("id", payload.id)
          .single();
        if (fetchErr) throw fetchErr;
        const newStatus = current.status === "active" ? "inactive" : "active";
        const { data, error } = await client
          .from("discount_rules")
          .update({ status: newStatus })
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "discount_rule_status_toggled", resource: "discount_rules", resource_id: payload.id, details: { new_status: newStatus } });
        return jsonResponse(data);
      }

      // ==================== FLASH SALES ====================
      case "get_flash_sales": {
        const { data, error } = await client
          .from("promotions")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return jsonResponse(data);
      }

      case "create_flash_sale": {
        const { data, error } = await client
          .from("promotions")
          .insert(payload.sale)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "flash_sale_created", resource: "promotions", resource_id: data.id, details: { name: payload.sale.name } });

        // ── Fire-and-forget: Broadcast to all WhatsApp customers ──────────────
        // We intentionally do NOT await this. The admin gets their response
        // immediately; the broadcast runs asynchronously in its own function.
        const broadcastUrl = `${url}/functions/v1/whatsapp-broadcast`;
        fetch(broadcastUrl, {
          method:  "POST",
          headers: {
            "Authorization": `Bearer ${serviceKey}`,
            "Content-Type":  "application/json",
          },
          body: JSON.stringify({ sale: data }),
        }).catch((err) => console.error("Failed to trigger WA broadcast:", err));

        return jsonResponse(data);
      }

      case "update_flash_sale": {
        const { id, ...updates } = payload.sale;
        const { data, error } = await client
          .from("promotions")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "flash_sale_updated", resource: "promotions", resource_id: id });
        return jsonResponse(data);
      }

      case "delete_flash_sale": {
        const { error } = await client
          .from("promotions")
          .delete()
          .eq("id", payload.id);
        if (error) throw error;
        await logAudit(client, { action: "flash_sale_deleted", resource: "promotions", resource_id: payload.id, level: "warning" });
        return jsonResponse({ success: true });
      }

      case "cancel_flash_sale": {
        const { data, error } = await client
          .from("promotions")
          .update({ status: "cancelled" })
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "flash_sale_cancelled", resource: "promotions", resource_id: payload.id, level: "warning" });
        return jsonResponse(data);
      }

      // ==================== BANNERS ====================
      case "get_banners": {
        const { data, error } = await client
          .from("banners")
          .select("*")
          .order("position", { ascending: true });
        if (error) throw error;
        return jsonResponse(data);
      }

      case "create_banner": {
        const { data, error } = await client
          .from("banners")
          .insert(payload.banner)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "banner_created", resource: "banners", resource_id: data.id, details: { title: payload.banner.title } });
        return jsonResponse(data);
      }

      case "update_banner": {
        const { id, ...updates } = payload.banner;
        const { data, error } = await client
          .from("banners")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "banner_updated", resource: "banners", resource_id: id });
        return jsonResponse(data);
      }

      case "delete_banner": {
        const { error } = await client
          .from("banners")
          .delete()
          .eq("id", payload.id);
        if (error) throw error;
        await logAudit(client, { action: "banner_deleted", resource: "banners", resource_id: payload.id, level: "warning" });
        return jsonResponse({ success: true });
      }

      case "toggle_banner_status": {
        const { data: current, error: fetchErr } = await client
          .from("banners")
          .select("is_active")
          .eq("id", payload.id)
          .single();
        if (fetchErr) throw fetchErr;
        const { data, error } = await client
          .from("banners")
          .update({ is_active: !current.is_active })
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "banner_status_toggled", resource: "banners", resource_id: payload.id, details: { is_active: !current.is_active } });
        return jsonResponse(data);
      }

      // ==================== CUSTOMER: validate coupon ====================
      case "validate_coupon": {
        const { code, order_total } = payload;
        const { data: coupon, error } = await client
          .from("coupons")
          .select("*")
          .eq("code", code.toUpperCase())
          .eq("status", "active")
          .single();
        
        if (error || !coupon) {
          return jsonResponse({ is_valid: false, error_message: "Invalid coupon code" });
        }

        const now = new Date();
        if (now < new Date(coupon.valid_from) || now > new Date(coupon.valid_to)) {
          return jsonResponse({ is_valid: false, error_message: "Coupon has expired or is not yet valid" });
        }

        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
          return jsonResponse({ is_valid: false, error_message: "Coupon usage limit reached" });
        }

        if (coupon.min_order_value && order_total < coupon.min_order_value) {
          return jsonResponse({ is_valid: false, error_message: `Minimum order value is Rs. ${coupon.min_order_value}` });
        }

        let discount_amount = 0;
        if (coupon.type === "percentage") {
          discount_amount = order_total * (coupon.value / 100);
          if (coupon.max_discount) discount_amount = Math.min(discount_amount, coupon.max_discount);
        } else {
          discount_amount = coupon.value;
        }

        return jsonResponse({
          is_valid: true,
          coupon_id: coupon.id,
          discount_amount,
          coupon_code: coupon.code,
          type: coupon.type,
          value: coupon.value,
        });
      }

      // ==================== CUSTOMER: active promotions ====================
      case "get_active_promotions": {
        const now = new Date().toISOString();
        
        const { data: flashSales, error: fsErr } = await client
          .from("promotions")
          .select("*")
          .eq("status", "active")
          .lte("starts_at", now)
          .gte("ends_at", now);
        if (fsErr) throw fsErr;

        const { data: discountRules, error: drErr } = await client
          .from("discount_rules")
          .select("*")
          .eq("status", "active")
          .order("priority", { ascending: true });
        if (drErr) throw drErr;

        const { data: banners, error: bErr } = await client
          .from("banners")
          .select("*")
          .eq("is_active", true)
          .order("position", { ascending: true });
        if (bErr) throw bErr;

        return jsonResponse({ flash_sales: flashSales || [], discount_rules: discountRules || [], banners: banners || [] });
      }

      // ==================== CUSTOMER: flash sale products ====================
      case "get_flash_sale_products": {
        const { sale_id } = payload;
        const { data: sale, error: saleErr } = await client
          .from("promotions")
          .select("*")
          .eq("id", sale_id)
          .single();
        if (saleErr) throw saleErr;

        let productsQuery = client.from("products").select("*, categories:category_id(slug), brands:brand_id(name)").eq("status", "active");
        
        if (sale.product_ids && sale.product_ids.length > 0) {
          productsQuery = productsQuery.in("id", sale.product_ids);
        } else if (sale.category_ids && sale.category_ids.length > 0) {
          productsQuery = productsQuery.in("category_id", sale.category_ids);
        }

        const { data: products, error: pErr } = await productsQuery.limit(20);
        if (pErr) throw pErr;

        return jsonResponse({ sale, products: products || [] });
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error("manage-promotions error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
