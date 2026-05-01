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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const externalUrl = Deno.env.get("SUPABASE_URL")!;
    const externalServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(externalUrl, externalServiceKey);

    // Fetch all public settings in parallel
    const [companyRes, paymentRes, taxRes, branchRes] = await Promise.all([
      serviceClient
        .from("company_settings")
        .select("*")
        .limit(1)
        .maybeSingle(),
      serviceClient
        .from("payment_methods")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: true }),
      serviceClient
        .from("tax_configs")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: true }),
      serviceClient
        .from("branches")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: true }),
    ]);

    return jsonResponse({
      company: companyRes.data || null,
      payment_methods: paymentRes.data || [],
      tax_configs: taxRes.data || [],
      branches: branchRes.data || [],
    });
  } catch (err) {
    console.error("get-store-settings error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
