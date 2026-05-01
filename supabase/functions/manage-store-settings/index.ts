import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "No authorization header" }, 401);

    const externalUrl = Deno.env.get("SUPABASE_URL")!;
    const externalAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const externalServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const anonClient = createClient(externalUrl, externalAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    const serviceClient = createClient(externalUrl, externalServiceKey);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const isAdmin = ["admin", "manager"].includes(roleData?.role || "");
    if (!isAdmin) return jsonResponse({ error: "Insufficient permissions" }, 403);

    const body = await req.json();
    const { module, action } = body;

    // ===== NOTIFICATION TEMPLATES =====
    if (module === "notifications") {
      if (action === "list") {
        const { data, error } = await serviceClient
          .from("notification_templates")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ data: data || [] });
      }

      if (action === "upsert") {
        const { template } = body;
        if (template.id) {
          const { data, error } = await serviceClient
            .from("notification_templates")
            .update({
              name: template.name,
              type: template.type,
              trigger_event: template.trigger_event,
              subject: template.subject || null,
              content: template.content,
              variables: template.variables || [],
              status: template.status || "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", template.id)
            .select()
            .single();
          if (error) return jsonResponse({ error: error.message }, 500);
          await logAudit(serviceClient, { action: "notification_template_updated", resource: "notification_templates", resource_id: template.id, details: { name: template.name } });
          return jsonResponse({ data });
        } else {
          const { data, error } = await serviceClient
            .from("notification_templates")
            .upsert({
              name: template.name,
              type: template.type,
              trigger_event: template.trigger_event,
              subject: template.subject || null,
              content: template.content,
              variables: template.variables || [],
              status: template.status || "active",
            }, { onConflict: "type,trigger_event" })
            .select()
            .single();
          if (error) return jsonResponse({ error: error.message }, 500);
          await logAudit(serviceClient, { action: "notification_template_created", resource: "notification_templates", resource_id: data.id, details: { name: template.name } });
          return jsonResponse({ data });
        }
      }

      if (action === "toggle_status") {
        const { id, status } = body;
        const { data, error } = await serviceClient
          .from("notification_templates")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) return jsonResponse({ error: error.message }, 500);
        await logAudit(serviceClient, { action: "notification_template_status_toggled", resource: "notification_templates", resource_id: id, details: { new_status: status } });
        return jsonResponse({ data });
      }

      if (action === "delete") {
        const { id } = body;
        const { error } = await serviceClient
          .from("notification_templates")
          .delete()
          .eq("id", id);
        if (error) return jsonResponse({ error: error.message }, 500);
        await logAudit(serviceClient, { action: "notification_template_deleted", resource: "notification_templates", resource_id: id, level: "warning" });
        return jsonResponse({ success: true });
      }
    }

    // ===== BRANCHES =====
    if (module === "branches") {
      if (action === "list") {
        const { data, error } = await serviceClient
          .from("branches")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ data: data || [] });
      }

      if (action === "upsert") {
        const { branch } = body;
        const row = {
          name: branch.name,
          code: branch.code,
          type: branch.type,
          address: branch.address,
          city: branch.city,
          district: branch.district,
          phone: branch.phone,
          email: branch.email,
          manager: branch.manager,
          opening_hours: branch.opening_hours || {},
          is_pickup_location: branch.is_pickup_location ?? true,
          accepts_returns: branch.accepts_returns ?? true,
          status: branch.status || "active",
          updated_at: new Date().toISOString(),
        };

        if (branch.id) {
          const { data, error } = await serviceClient
            .from("branches")
            .update(row)
            .eq("id", branch.id)
            .select()
            .single();
          if (error) return jsonResponse({ error: error.message }, 500);
          await logAudit(serviceClient, { action: "branch_updated", resource: "branches", resource_id: branch.id, details: { name: branch.name } });
          return jsonResponse({ data });
        } else {
          const { data, error } = await serviceClient
            .from("branches")
            .insert(row)
            .select()
            .single();
          if (error) return jsonResponse({ error: error.message }, 500);
          await logAudit(serviceClient, { action: "branch_created", resource: "branches", resource_id: data.id, details: { name: branch.name } });
          return jsonResponse({ data });
        }
      }

      if (action === "toggle_status") {
        const { id, status } = body;
        const { data, error } = await serviceClient
          .from("branches")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) return jsonResponse({ error: error.message }, 500);
        await logAudit(serviceClient, { action: "branch_status_toggled", resource: "branches", resource_id: id, details: { new_status: status } });
        return jsonResponse({ data });
      }

      if (action === "delete") {
        const { id } = body;
        const { error } = await serviceClient
          .from("branches")
          .delete()
          .eq("id", id);
        if (error) return jsonResponse({ error: error.message }, 500);
        await logAudit(serviceClient, { action: "branch_deleted", resource: "branches", resource_id: id, level: "warning" });
        return jsonResponse({ success: true });
      }
    }

    // ===== TAX CONFIGS =====
    if (module === "taxes") {
      if (action === "list") {
        const { data, error } = await serviceClient
          .from("tax_configs")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ data: data || [] });
      }

      if (action === "upsert") {
        const { tax } = body;
        const row = {
          name: tax.name,
          rate: tax.rate,
          type: tax.type,
          apply_to: tax.apply_to,
          categories: tax.categories || null,
          status: tax.status || "active",
          updated_at: new Date().toISOString(),
        };

        if (tax.id) {
          const { data, error } = await serviceClient
            .from("tax_configs")
            .update(row)
            .eq("id", tax.id)
            .select()
            .single();
          if (error) return jsonResponse({ error: error.message }, 500);
          await logAudit(serviceClient, { action: "tax_config_updated", resource: "tax_configs", resource_id: tax.id, details: { name: tax.name } });
          return jsonResponse({ data });
        } else {
          const { data, error } = await serviceClient
            .from("tax_configs")
            .insert(row)
            .select()
            .single();
          if (error) return jsonResponse({ error: error.message }, 500);
          await logAudit(serviceClient, { action: "tax_config_created", resource: "tax_configs", resource_id: data.id, details: { name: tax.name } });
          return jsonResponse({ data });
        }
      }

      if (action === "toggle_status") {
        const { id, status } = body;
        const { data, error } = await serviceClient
          .from("tax_configs")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) return jsonResponse({ error: error.message }, 500);
        await logAudit(serviceClient, { action: "tax_config_status_toggled", resource: "tax_configs", resource_id: id, details: { new_status: status } });
        return jsonResponse({ data });
      }

      if (action === "delete") {
        const { id } = body;
        const { error } = await serviceClient
          .from("tax_configs")
          .delete()
          .eq("id", id);
        if (error) return jsonResponse({ error: error.message }, 500);
        await logAudit(serviceClient, { action: "tax_config_deleted", resource: "tax_configs", resource_id: id, level: "warning" });
        return jsonResponse({ success: true });
      }
    }

    // ===== PAYMENT METHODS =====
    if (module === "payment_methods") {
      if (action === "list") {
        const { data, error } = await serviceClient
          .from("payment_methods")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ data: data || [] });
      }

      if (action === "upsert") {
        const { method } = body;
        const row = {
          name: method.name,
          code: method.code,
          type: method.type,
          instructions: method.instructions || null,
          bank_name: method.bank_name || null,
          account_number: method.account_number || null,
          account_name: method.account_name || null,
          bank_branch: method.bank_branch || null,
          processing_fee: method.processing_fee || 0,
          fee_type: method.fee_type || "fixed",
          min_order: method.min_order || null,
          max_order: method.max_order || null,
          status: method.status || "active",
          updated_at: new Date().toISOString(),
        };

        if (method.id) {
          const { data, error } = await serviceClient
            .from("payment_methods")
            .update(row)
            .eq("id", method.id)
            .select()
            .single();
          if (error) return jsonResponse({ error: error.message }, 500);
          await logAudit(serviceClient, { action: "payment_method_updated", resource: "payment_methods", resource_id: method.id, details: { name: method.name } });
          return jsonResponse({ data });
        } else {
          const { data, error } = await serviceClient
            .from("payment_methods")
            .insert(row)
            .select()
            .single();
          if (error) return jsonResponse({ error: error.message }, 500);
          await logAudit(serviceClient, { action: "payment_method_created", resource: "payment_methods", resource_id: data.id, details: { name: method.name } });
          return jsonResponse({ data });
        }
      }

      if (action === "toggle_status") {
        const { id, status } = body;
        const { data, error } = await serviceClient
          .from("payment_methods")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) return jsonResponse({ error: error.message }, 500);
        await logAudit(serviceClient, { action: "payment_method_status_toggled", resource: "payment_methods", resource_id: id, details: { new_status: status } });
        return jsonResponse({ data });
      }

      if (action === "delete") {
        const { id } = body;
        const { error } = await serviceClient
          .from("payment_methods")
          .delete()
          .eq("id", id);
        if (error) return jsonResponse({ error: error.message }, 500);
        await logAudit(serviceClient, { action: "payment_method_deleted", resource: "payment_methods", resource_id: id, level: "warning" });
        return jsonResponse({ success: true });
      }
    }

    // ===== INTEGRATIONS =====
    if (module === "integrations") {
      if (action === "list") {
        const { data, error } = await serviceClient
          .from("integrations")
          .select("*")
          .order("created_at", { ascending: true });
        if (error) return jsonResponse({ error: error.message }, 500);
        return jsonResponse({ data: data || [] });
      }

      if (action === "upsert") {
        const { integration } = body;
        const row = {
          name: integration.name,
          category: integration.category,
          description: integration.description || null,
          icon: integration.icon || null,
          status: integration.status || "disconnected",
          configured_at: integration.configured_at || null,
          credentials: integration.credentials || {},
          updated_at: new Date().toISOString(),
        };

        if (integration.id) {
          const { data, error } = await serviceClient
            .from("integrations")
            .update(row)
            .eq("id", integration.id)
            .select()
            .single();
          if (error) return jsonResponse({ error: error.message }, 500);
          await logAudit(serviceClient, { action: "integration_updated", resource: "integrations", resource_id: integration.id, details: { name: integration.name } });
          return jsonResponse({ data });
        } else {
          const { data, error } = await serviceClient
            .from("integrations")
            .insert(row)
            .select()
            .single();
          if (error) return jsonResponse({ error: error.message }, 500);
          await logAudit(serviceClient, { action: "integration_created", resource: "integrations", resource_id: data.id, details: { name: integration.name } });
          return jsonResponse({ data });
        }
      }

      if (action === "connect") {
        const { id, credentials } = body;
        const { data, error } = await serviceClient
          .from("integrations")
          .update({ status: "connected", configured_at: new Date().toISOString(), credentials: credentials || {}, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) return jsonResponse({ error: error.message }, 500);
        await logAudit(serviceClient, { action: "integration_connected", resource: "integrations", resource_id: id, details: { name: data.name } });
        return jsonResponse({ data });
      }

      if (action === "disconnect") {
        const { id } = body;
        const { data, error } = await serviceClient
          .from("integrations")
          .update({ status: "disconnected", configured_at: null, credentials: {}, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) return jsonResponse({ error: error.message }, 500);
        await logAudit(serviceClient, { action: "integration_disconnected", resource: "integrations", resource_id: id, details: { name: data.name }, level: "warning" });
        return jsonResponse({ data });
      }

      if (action === "delete") {
        const { id } = body;
        const { error } = await serviceClient
          .from("integrations")
          .delete()
          .eq("id", id);
        if (error) return jsonResponse({ error: error.message }, 500);
        await logAudit(serviceClient, { action: "integration_deleted", resource: "integrations", resource_id: id, level: "warning" });
        return jsonResponse({ success: true });
      }
    }

    return jsonResponse({ error: "Unknown module or action" }, 400);
  } catch (err) {
    console.error("manage-store-settings error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
