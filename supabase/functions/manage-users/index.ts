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

async function logAudit(client: any, entry: { action: string; resource: string; resource_id?: string; details?: any; level?: string; user_name?: string }) {
  try {
    await client.from("audit_logs").insert({
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id || null,
      details: entry.details || {},
      level: entry.level || "info",
      user_name: entry.user_name || "Admin",
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

    const { action, user_id, role, name, email, phone } = await req.json();

    if (action === "list") {
      const { data: roles, error: rolesError } = await serviceClient
        .from("user_roles")
        .select("*")
        .in("role", ["admin", "manager", "staff", "cashier"]);

      if (rolesError) return jsonResponse({ error: rolesError.message }, 500);

      if (!roles || roles.length === 0) {
        return jsonResponse({ users: [] });
      }

      const userIds = roles.map((r: any) => r.user_id);

      const { data: profiles } = await serviceClient
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      const usersWithDetails = [];
      for (const role of roles) {
        const { data: authData } = await serviceClient.auth.admin.getUserById(role.user_id);
        const profile = (profiles || []).find((p: any) => p.user_id === role.user_id);
        
        usersWithDetails.push({
          id: role.user_id,
          role_id: role.id,
          email: authData?.user?.email || "",
          name: profile?.name || authData?.user?.user_metadata?.name || "Unknown",
          phone: profile?.phone || "",
          avatar: profile?.avatar_url || "",
          role: role.role,
          status: authData?.user?.banned_until ? "suspended" : 
                  authData?.user?.email_confirmed_at ? "active" : "inactive",
          last_sign_in: authData?.user?.last_sign_in_at || null,
          created_at: role.created_at,
        });
      }

      return jsonResponse({ users: usersWithDetails });
    }

    if (action === "update_role" && user_id && role) {
      // Get old role for audit
      const { data: oldRole } = await serviceClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user_id)
        .in("role", ["admin", "manager", "staff", "cashier"])
        .single();

      const { data, error } = await serviceClient
        .from("user_roles")
        .update({ role })
        .eq("user_id", user_id)
        .in("role", ["admin", "manager", "staff", "cashier"])
        .select()
        .single();

      if (error) return jsonResponse({ error: error.message }, 500);

      await logAudit(serviceClient, {
        action: "user_role_changed",
        resource: "user_roles",
        resource_id: user_id,
        details: { previous_role: oldRole?.role, new_role: role },
        level: "critical",
      });

      return jsonResponse({ success: true, data });
    }

    if (action === "create" && email && name && role) {
      const tempPassword = crypto.randomUUID().slice(0, 12) + "Aa1!";
      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name },
      });

      if (createError) return jsonResponse({ error: createError.message }, 500);

      await serviceClient.from("profiles").insert({
        user_id: newUser.user.id,
        name,
        phone: phone || null,
      });

      await serviceClient.from("user_roles").insert({
        user_id: newUser.user.id,
        role,
      });

      await logAudit(serviceClient, {
        action: "user_created",
        resource: "users",
        resource_id: newUser.user.id,
        details: { email, name, role },
        level: "critical",
      });

      return jsonResponse({ success: true, user_id: newUser.user.id, temp_password: tempPassword });
    }

    if (action === "toggle_status" && user_id) {
      const { data: targetUser } = await serviceClient.auth.admin.getUserById(user_id);
      
      const wasBanned = !!targetUser?.user?.banned_until;
      if (wasBanned) {
        await serviceClient.auth.admin.updateUserById(user_id, { ban_duration: "none" });
      } else {
        await serviceClient.auth.admin.updateUserById(user_id, { ban_duration: "876000h" });
      }

      await logAudit(serviceClient, {
        action: wasBanned ? "user_unbanned" : "user_banned",
        resource: "users",
        resource_id: user_id,
        details: { email: targetUser?.user?.email },
        level: "critical",
      });

      return jsonResponse({ success: true });
    }

    if (action === "reset_password" && user_id) {
      const { data: targetUser } = await serviceClient.auth.admin.getUserById(user_id);
      if (targetUser?.user?.email) {
        const tempPassword = crypto.randomUUID().slice(0, 12) + "Aa1!";
        await serviceClient.auth.admin.updateUserById(user_id, { password: tempPassword });

        await logAudit(serviceClient, {
          action: "user_password_reset",
          resource: "users",
          resource_id: user_id,
          details: { email: targetUser.user.email },
          level: "warning",
        });

        return jsonResponse({ success: true, temp_password: tempPassword, email: targetUser.user.email });
      }
      return jsonResponse({ error: "User email not found" }, 400);
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("manage-users error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
