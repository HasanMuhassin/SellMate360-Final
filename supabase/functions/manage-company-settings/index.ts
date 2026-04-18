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

    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
    const externalAnonKey = Deno.env.get("EXTERNAL_SUPABASE_ANON_KEY")!;
    const externalServiceKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;

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

    const contentType = req.headers.get("content-type") || "";

    // Handle file upload (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const uploadType = formData.get("type") as string;

      if (!file || !uploadType) {
        return jsonResponse({ error: "Missing file or type" }, 400);
      }

      const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/x-icon", "image/svg+xml"];
      if (!allowedTypes.includes(file.type)) {
        return jsonResponse({ error: "Invalid file type. Allowed: PNG, JPG, WebP, ICO, SVG" }, 400);
      }
      if (file.size > 5 * 1024 * 1024) {
        return jsonResponse({ error: "File too large. Max 5MB" }, 400);
      }

      const ext = file.name.split(".").pop() || "png";
      const path = `branding/${uploadType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const fileBuffer = await file.arrayBuffer();
      const { error: uploadError } = await serviceClient.storage
        .from("catalog-images")
        .upload(path, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return jsonResponse({ error: `Upload failed: ${uploadError.message}` }, 500);
      }

      const { data: urlData } = serviceClient.storage
        .from("catalog-images")
        .getPublicUrl(path);

      const publicUrl = urlData.publicUrl;

      const column = uploadType === "logo" ? "logo" : "favicon";
      const { data: existing } = await serviceClient
        .from("company_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        await serviceClient
          .from("company_settings")
          .update({ [column]: publicUrl, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      }

      await logAudit(serviceClient, {
        action: `company_${uploadType}_uploaded`,
        resource: "company_settings",
        resource_id: existing?.id,
        details: { type: uploadType, file_name: file.name },
      });

      return jsonResponse({ url: publicUrl });
    }

    // Handle JSON actions
    const { action, settings } = await req.json();

    if (action === "get") {
      const { data, error } = await serviceClient
        .from("company_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ data });
    }

    if (action === "update" && settings) {
      const { data: existing } = await serviceClient
        .from("company_settings")
        .select("id")
        .limit(1)
        .single();

      const row = {
        name: settings.name || '',
        legal_name: settings.legalName || '',
        email: settings.email || '',
        phone: settings.phone || '',
        whatsapp: settings.whatsapp || '',
        address: settings.address || '',
        city: settings.city || '',
        country: settings.country || '',
        postal_code: settings.postalCode || '',
        tax_id: settings.taxId || '',
        vat_number: settings.vatNumber || '',
        logo: settings.logo || '',
        favicon: settings.favicon || '',
        currency: settings.currency || 'LKR',
        timezone: settings.timezone || 'Asia/Colombo',
        date_format: settings.dateFormat || 'DD/MM/YYYY',
        order_prefix: settings.orderPrefix || 'ORD',
        social_facebook: settings.socialLinks?.facebook || '',
        social_instagram: settings.socialLinks?.instagram || '',
        social_twitter: settings.socialLinks?.twitter || '',
        social_youtube: settings.socialLinks?.youtube || '',
        social_tiktok: settings.socialLinks?.tiktok || '',
        updated_at: new Date().toISOString(),
      };

      if (!existing) {
        const { data, error } = await serviceClient
          .from("company_settings")
          .insert(row)
          .select()
          .single();
        if (error) return jsonResponse({ error: error.message }, 400);

        await logAudit(serviceClient, {
          action: "company_settings_created",
          resource: "company_settings",
          resource_id: data.id,
          details: { name: settings.name },
        });

        return jsonResponse({ data });
      }

      const { data, error } = await serviceClient
        .from("company_settings")
        .update(row)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) return jsonResponse({ error: error.message }, 400);

      await logAudit(serviceClient, {
        action: "company_settings_updated",
        resource: "company_settings",
        resource_id: existing.id,
        details: { updated_fields: Object.keys(settings) },
      });

      return jsonResponse({ data });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
});
