import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ==================== INVENTORY OVERVIEW ====================
export function useInventoryOverview() {
  return useQuery({
    queryKey: ['inventory_overview'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from("products")
        .select("id, name, sku, stock, stock_status, selling_price, original_price, categories:category_id(name), brands:brand_id(name)")
        .order("name");
      if (error) throw error;

      return (products || []).map((p: any) => ({
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
        status: p.stock_status || 'in_stock',
      }));
    },
    staleTime: 30000,
  });
}

// ==================== STOCK LEDGER ====================
export function useStockLedger() {
  return useQuery({
    queryKey: ['stock_ledger'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_ledger")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    staleTime: 15000,
  });
}

// ==================== STOCK ADJUSTMENTS ====================
export function useStockAdjustments() {
  return useQuery({
    queryKey: ['stock_adjustments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_adjustments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 15000,
  });
}

export function useStockAdjustmentMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['stock_adjustments'] });
    qc.invalidateQueries({ queryKey: ['stock_ledger'] });
    qc.invalidateQueries({ queryKey: ['inventory_overview'] });
    qc.invalidateQueries({ queryKey: ['products'] });
  };

  const createAdjustment = useMutation({
    mutationFn: async (adj: any) => {
      const { count } = await supabase
        .from("stock_adjustments")
        .select("*", { count: "exact", head: true });
      const adjNum = `ADJ-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from("stock_adjustments")
        .insert({ ...adj, adjustment_number: adjNum })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Adjustment created'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveAdjustment = useMutation({
    mutationFn: async (id: string) => {
      // 1. Fetch adjustment
      const { data: adj, error: fetchErr } = await supabase
        .from("stock_adjustments")
        .select("*")
        .eq("id", id)
        .single();
      if (fetchErr) throw fetchErr;

      // 2. Update status
      const { data, error } = await supabase
        .from("stock_adjustments")
        .update({ status: "approved", approved_by: "Admin", approved_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      // 3. Add to ledger (trigger will handle product stock update)
      const { error: ledgerErr } = await supabase.from("stock_ledger").insert({
        product_id: adj.product_id,
        product_name: adj.product_name,
        type: "adjustment",
        quantity: adj.quantity_change,
        reason: adj.reason,
        reference: adj.adjustment_number,
        created_by: "Admin",
      });
      if (ledgerErr) throw ledgerErr;

      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Adjustment approved & stock updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectAdjustment = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("stock_adjustments")
        .update({ status: "rejected" })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Adjustment rejected'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createAdjustment, approveAdjustment, rejectAdjustment };
}

// ==================== STOCK TRANSFERS ====================
export function useStockTransfers() {
  return useQuery({
    queryKey: ['stock_transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_transfers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 15000,
  });
}

export function useStockTransferMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['stock_transfers'] });
    qc.invalidateQueries({ queryKey: ['inventory_overview'] });
  };

  const createTransfer = useMutation({
    mutationFn: async (transfer: any) => {
      const { count } = await supabase
        .from("stock_transfers")
        .select("*", { count: "exact", head: true });
      const trfNum = `TRF-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(3, '0')}`;

      const totalItems = (transfer.items || []).reduce((sum: number, i: any) => sum + i.quantity, 0);

      const { data, error } = await supabase
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
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Transfer created'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTransferStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "in_transit") updates.shipped_at = new Date().toISOString();
      if (status === "received") {
        updates.received_at = new Date().toISOString();
        updates.received_by = "Admin";
      }

      const { data, error } = await supabase
        .from("stock_transfers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Transfer status updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createTransfer, updateTransferStatus };
}

// ==================== SUPPLIERS ====================
export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}

export function useSupplierMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['suppliers'] });

  const createSupplier = useMutation({
    mutationFn: async (supplier: any) => {
      const { count } = await supabase
        .from("suppliers")
        .select("*", { count: "exact", head: true });
      const code = supplier.code || `SUP-${String((count || 0) + 1).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from("suppliers")
        .insert({ ...supplier, code })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Supplier created'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSupplier = useMutation({
    mutationFn: async (supplier: any) => {
      const { id, ...updates } = supplier;
      const { data, error } = await supabase
        .from("suppliers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { invalidate(); toast.success('Supplier updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Supplier deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createSupplier, updateSupplier, deleteSupplier };
}

// ==================== BRANCHES ====================
export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}
