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
    const url = Deno.env.get("EXTERNAL_SUPABASE_URL")!;
    const serviceKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(url, serviceKey);

    const { action, ...payload } = await req.json();

    switch (action) {
      // ==================== INVENTORY OVERVIEW ====================
      case "get_inventory_overview": {
        const { data: products, error } = await client
          .from("products")
          .select("id, name, sku, stock, stock_status, selling_price, original_price, categories:category_id(name), brands:brand_id(name)")
          .order("name");
        if (error) throw error;

        const items = (products || []).map((p: any) => ({
          id: p.id,
          product_id: p.id,
          sku: p.sku || '',
          product_name: p.name,
          category_name: p.categories?.name || 'Uncategorized',
          quantity: p.stock || 0,
          reserved_quantity: 0,
          available_quantity: p.stock || 0,
          low_stock_threshold: 10,
          reorder_point: 20,
          cost_price: p.original_price || p.selling_price || 0,
          total_value: (p.original_price || p.selling_price || 0) * (p.stock || 0),
          last_restocked: null,
          status: p.stock_status === 'out-of-stock' ? 'out_of_stock' : p.stock_status === 'low-stock' ? 'low_stock' : 'in_stock',
        }));

        return jsonResponse(items);
      }

      // ==================== STOCK LEDGER ====================
      case "get_stock_ledger": {
        const { data, error } = await client
          .from("stock_ledger")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        return jsonResponse(data || []);
      }

      // ==================== STOCK ADJUSTMENTS ====================
      case "get_stock_adjustments": {
        const { data, error } = await client
          .from("stock_adjustments")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return jsonResponse(data || []);
      }

      case "create_stock_adjustment": {
        const adj = payload.adjustment;
        const { count } = await client
          .from("stock_adjustments")
          .select("*", { count: "exact", head: true });
        const adjNum = `ADJ-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

        const { data, error } = await client
          .from("stock_adjustments")
          .insert({ ...adj, adjustment_number: adjNum })
          .select()
          .single();
        if (error) throw error;

        await logAudit(client, {
          action: "stock_adjustment_created",
          resource: "stock_adjustments",
          resource_id: data.id,
          details: { adjustment_number: adjNum, product: adj.product_name, quantity_change: adj.quantity_change, reason: adj.reason },
        });

        return jsonResponse(data);
      }

      case "approve_stock_adjustment": {
        const { id } = payload;
        const { data: adj, error: fetchErr } = await client
          .from("stock_adjustments")
          .select("*")
          .eq("id", id)
          .single();
        if (fetchErr) throw fetchErr;

        const { data, error } = await client
          .from("stock_adjustments")
          .update({ status: "approved", approved_by: "Admin", approved_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;

        // NOTE: Product stock is now automatically updated via the 
        // trigger_update_product_stock PostgreSQL trigger in the database.
        // We no longer manually update products.stock here to avoid double-counting.

        await client.from("stock_ledger").insert({
          product_id: adj.product_id,
          product_name: adj.product_name,
          type: "adjustment",
          quantity: adj.quantity_change,
          reason: adj.reason,
          reference: adj.adjustment_number,
          created_by: "Admin",
        });

        await logAudit(client, {
          action: "stock_adjustment_approved",
          resource: "stock_adjustments",
          resource_id: id,
          details: { adjustment_number: adj.adjustment_number, product: adj.product_name, new_stock: newStock },
          level: "warning",
        });

        return jsonResponse(data);
      }

      case "reject_stock_adjustment": {
        const { data, error } = await client
          .from("stock_adjustments")
          .update({ status: "rejected" })
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;

        await logAudit(client, {
          action: "stock_adjustment_rejected",
          resource: "stock_adjustments",
          resource_id: payload.id,
        });

        return jsonResponse(data);
      }

      // ==================== STOCK TRANSFERS ====================
      case "get_stock_transfers": {
        const { data, error } = await client
          .from("stock_transfers")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return jsonResponse(data || []);
      }

      case "create_stock_transfer": {
        const transfer = payload.transfer;
        const { count } = await client
          .from("stock_transfers")
          .select("*", { count: "exact", head: true });
        const trfNum = `TRF-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

        const totalItems = (transfer.items || []).reduce((sum: number, i: any) => sum + i.quantity, 0);

        const { data, error } = await client
          .from("stock_transfers")
          .insert({
            transfer_number: trfNum,
            from_branch_name: transfer.from_branch_name,
            to_branch_name: transfer.to_branch_name,
            items: transfer.items,
            total_items: totalItems,
            status: "pending",
            requested_by: transfer.requested_by || "Admin",
            notes: transfer.notes || null,
          })
          .select()
          .single();
        if (error) throw error;

        await logAudit(client, {
          action: "stock_transfer_created",
          resource: "stock_transfers",
          resource_id: data.id,
          details: { transfer_number: trfNum, from: transfer.from_branch_name, to: transfer.to_branch_name, total_items: totalItems },
        });

        return jsonResponse(data);
      }

      case "update_transfer_status": {
        const { id, status } = payload;
        const updates: any = { status };
        if (status === "in_transit") updates.shipped_at = new Date().toISOString();
        if (status === "received") {
          updates.received_at = new Date().toISOString();
          updates.received_by = "Admin";
        }

        const { data, error } = await client
          .from("stock_transfers")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;

        await logAudit(client, {
          action: "stock_transfer_status_changed",
          resource: "stock_transfers",
          resource_id: id,
          details: { new_status: status },
        });

        return jsonResponse(data);
      }

      // ==================== SUPPLIERS ====================
      case "get_suppliers": {
        const { data, error } = await client
          .from("suppliers")
          .select("*")
          .order("name");
        if (error) throw error;
        return jsonResponse(data || []);
      }

      case "create_supplier": {
        const sup = payload.supplier;
        const { count } = await client
          .from("suppliers")
          .select("*", { count: "exact", head: true });
        const code = sup.code || `SUP-${String((count || 0) + 1).padStart(3, '0')}`;

        const { data, error } = await client
          .from("suppliers")
          .insert({ ...sup, code })
          .select()
          .single();
        if (error) throw error;

        await logAudit(client, {
          action: "supplier_created",
          resource: "suppliers",
          resource_id: data.id,
          details: { name: sup.name, code },
        });

        return jsonResponse(data);
      }

      case "update_supplier": {
        const { id, ...updates } = payload.supplier;
        const { data, error } = await client
          .from("suppliers")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;

        await logAudit(client, {
          action: "supplier_updated",
          resource: "suppliers",
          resource_id: id,
          details: { updated_fields: Object.keys(updates) },
        });

        return jsonResponse(data);
      }

      case "delete_supplier": {
        const { error } = await client
          .from("suppliers")
          .delete()
          .eq("id", payload.id);
        if (error) throw error;

        await logAudit(client, {
          action: "supplier_deleted",
          resource: "suppliers",
          resource_id: payload.id,
          level: "warning",
        });

        return jsonResponse({ success: true });
      }

      // ==================== BRANCHES (for dropdowns) ====================
      case "get_branches": {
        const { data, error } = await client
          .from("branches")
          .select("*")
          .order("name");
        if (error) throw error;
        return jsonResponse(data || []);
      }

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error("manage-inventory error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
