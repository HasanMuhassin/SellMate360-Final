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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use external Supabase credentials
    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
    const externalAnonKey = Deno.env.get("EXTERNAL_SUPABASE_ANON_KEY")!;
    const externalServiceKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user with anon client using their token
    const anonClient = createClient(externalUrl, externalAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, phone, email } = await req.json();

    // Use service role to bypass RLS on external DB
    const adminClient = createClient(externalUrl, externalServiceKey);

    // Check if customer already exists for this user
    const { data: existing } = await adminClient
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ customer_id: existing.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check by phone for guest-to-user linking
    if (phone) {
      const { data: byPhone } = await adminClient
        .from("customers")
        .select("id")
        .eq("phone", phone)
        .is("user_id", null)
        .maybeSingle();

      if (byPhone) {
        await adminClient
          .from("customers")
          .update({ user_id: user.id })
          .eq("id", byPhone.id);

        return new Response(JSON.stringify({ customer_id: byPhone.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create new customer
    const { data: newCustomer, error: insertError } = await adminClient
      .from("customers")
      .insert({
        user_id: user.id,
        name: name || user.user_metadata?.name || "Customer",
        phone: phone || "",
        email: email || user.email || null,
      })
      .select("id")
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ customer_id: newCustomer.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
