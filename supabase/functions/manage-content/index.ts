import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: any, status = 200) {
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
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(url, key);

    const { action, ...payload } = await req.json();

    switch (action) {
      // ==================== CMS PAGES ====================
      case "list_pages": {
        const { data, error } = await client
          .from("cms_pages")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json(data);
      }

      case "create_page": {
        const { title, slug, content, meta_title, meta_description, meta_keywords, show_in_footer, show_in_menu, menu_position, status } = payload;
        const { data, error } = await client
          .from("cms_pages")
          .insert({ title, slug, content, meta_title, meta_description, meta_keywords, show_in_footer, show_in_menu, menu_position, status, published_at: status === "published" ? new Date().toISOString() : null })
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "cms_page_created", resource: "cms_pages", resource_id: data.id, details: { title, slug } });
        return json(data);
      }

      case "update_page": {
        const { id, ...updates } = payload;
        if (updates.status === "published") {
          updates.published_at = new Date().toISOString();
        }
        const { data, error } = await client
          .from("cms_pages")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "cms_page_updated", resource: "cms_pages", resource_id: id, details: { updated_fields: Object.keys(updates) } });
        return json(data);
      }

      case "delete_page": {
        const { id } = payload;
        const { error } = await client.from("cms_pages").delete().eq("id", id);
        if (error) throw error;
        await logAudit(client, { action: "cms_page_deleted", resource: "cms_pages", resource_id: id, level: "warning" });
        return json({ success: true });
      }

      // ==================== ANNOUNCEMENTS ====================
      case "list_announcements": {
        const { data, error } = await client
          .from("announcements")
          .select("*")
          .order("priority", { ascending: true });
        if (error) throw error;
        return json(data);
      }

      case "create_announcement": {
        const { message, link, link_text, background_color, text_color, position, show_close_button, starts_at, ends_at, is_active, priority, target_pages } = payload;
        const { data, error } = await client
          .from("announcements")
          .insert({ message, link, link_text, background_color, text_color, position, show_close_button, starts_at, ends_at, is_active, priority, target_pages })
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "announcement_created", resource: "announcements", resource_id: data.id, details: { message: message?.substring(0, 50) } });
        return json(data);
      }

      case "update_announcement": {
        const { id, ...updates } = payload;
        const { data, error } = await client
          .from("announcements")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "announcement_updated", resource: "announcements", resource_id: id });
        return json(data);
      }

      case "delete_announcement": {
        const { id } = payload;
        const { error } = await client.from("announcements").delete().eq("id", id);
        if (error) throw error;
        await logAudit(client, { action: "announcement_deleted", resource: "announcements", resource_id: id, level: "warning" });
        return json({ success: true });
      }

      // ==================== SEO SETTINGS ====================
      case "list_seo_settings": {
        const { data, error } = await client
          .from("seo_settings")
          .select("*")
          .order("page_type");
        if (error) throw error;
        return json(data);
      }

      case "update_seo_setting": {
        const { id, ...updates } = payload;
        const { data, error } = await client
          .from("seo_settings")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "seo_setting_updated", resource: "seo_settings", resource_id: id, details: { updated_fields: Object.keys(updates) } });
        return json(data);
      }

      case "create_seo_setting": {
        const { data, error } = await client
          .from("seo_settings")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        await logAudit(client, { action: "seo_setting_created", resource: "seo_settings", resource_id: data.id });
        return json(data);
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error("manage-content error:", err);
    return json({ error: err.message }, 500);
  }
});
