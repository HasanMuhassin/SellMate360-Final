import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(url, key);

    // Extract requester identity from token
    const authHeader = req.headers.get('Authorization');
    let requesterId: string | null = null;
    let requesterName: string | null = "System";
    let requesterRole: string | null = "service";

    if (authHeader) {
      const { data: { user }, error: userError } = await client.auth.getUser(authHeader.replace('Bearer ', ''));
      if (user) {
        requesterId = user.id;
        requesterName = user.user_metadata?.full_name || user.email;
        
        // Fetch role from user_roles table
        const { data: roleData } = await client
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        if (roleData) requesterRole = roleData.role;
      }
    }

    // Extract IP and UA from headers
    const ipAddress = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || null;
    const userAgent = req.headers.get("user-agent") || null;

    const { action, ...payload } = await req.json();

    switch (action) {
      // ==================== AUDIT LOGS ====================
      case "list_audit_logs": {
        const { data, error } = await client
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        return json(data);
      }

      case "create_audit_log": {
        const { 
          user_id, user_name, user_role, 
          action: logAction, 
          resource, module,
          resource_id, details, 
          ip_address, user_agent, level 
        } = payload;

        const insertData = {
          user_id: user_id || requesterId,
          user_name: user_name || requesterName,
          user_role: user_role || requesterRole,
          action: logAction,
          resource: resource || module || "unknown", // Map module to resource
          resource_id: resource_id || null,
          details: typeof details === 'object' ? details : { note: details || "" },
          ip_address: ip_address || ipAddress,
          user_agent: user_agent || userAgent,
          level: level || 'info'
        };

        const { data, error } = await client
          .from("audit_logs")
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }

      // ==================== LOGIN HISTORY ====================
      case "list_login_history": {
        const { data, error } = await client
          .from("login_attempts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        return json(data);
      }

      case "create_login_entry": {
        const { email, user_name, success, ip_address, user_agent, location, failure_reason } = payload;
        const { data, error } = await client
          .from("login_attempts")
          .insert({ 
            email, 
            user_name, 
            success, 
            ip_address: ip_address || ipAddress, 
            user_agent: user_agent || userAgent, 
            location, 
            failure_reason 
          })
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }

      // ==================== ROLE CHANGES ====================
      case "list_role_changes": {
        const { data, error } = await client
          .from("role_changes")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error && error.code === "PGRST205") return json([]);
        if (error) throw error;
        return json(data);
      }

      case "create_role_change": {
        const { 
          target_user_id, target_user_name, target_user_email, 
          previous_role, new_role, 
          changed_by_user_id, changed_by_user_name, 
          reason 
        } = payload;

        const { data, error } = await client
          .from("role_changes")
          .insert({ 
            target_user_id, 
            target_user_name, 
            target_user_email, 
            previous_role, 
            new_role, 
            changed_by_user_id: changed_by_user_id || requesterId, 
            changed_by_user_name: changed_by_user_name || requesterName,
            reason 
          })
          .select()
          .single();
        if (error && error.code === "PGRST205") return json({ error: "role_changes table not created yet" }, 400);
        if (error) throw error;
        return json(data);
      }

      // ==================== STATS ====================
      case "security_stats": {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // Login stats (24h)
        const { data: logins24h } = await client
          .from("login_attempts")
          .select("id, success, ip_address")
          .gte("created_at", twentyFourHoursAgo);

        const totalLogins24h = logins24h?.length || 0;
        const failedLogins24h = logins24h?.filter(l => !l.success).length || 0;

        // Suspicious IPs (3+ failures from same IP in 24h)
        const failedByIP: Record<string, number> = {};
        logins24h?.filter(l => !l.success).forEach(l => {
          failedByIP[l.ip_address] = (failedByIP[l.ip_address] || 0) + 1;
        });
        const suspiciousAttempts = Object.values(failedByIP).filter(c => c >= 3).length;

        // Active users (distinct successful logins in 24h)
        const activeUsers = new Set(logins24h?.filter(l => l.success).map(l => l.ip_address)).size;

        // Critical actions (7d)
        const { count: criticalActions7d } = await client
          .from("audit_logs")
          .select("id", { count: "exact", head: true })
          .eq("level", "critical")
          .gte("created_at", sevenDaysAgo);

        // Role changes (30d) - count from user_roles table
        const { count: roleChanges30d } = await client
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo);

        return json({
          totalLogins24h,
          failedLogins24h,
          suspiciousAttempts,
          activeUsers,
          criticalActions7d: criticalActions7d || 0,
          roleChanges30d: roleChanges30d || 0,
        });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err) ? (err as any).message : JSON.stringify(err);
    console.error("manage-security error:", err);
    return json({ error: message }, 500);
  }
});
