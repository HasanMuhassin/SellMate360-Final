import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-inventory`;

async function callInventory(action: string, payload: any = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ==================== INVENTORY OVERVIEW ====================
export function useInventoryOverview() {
  return useQuery({
    queryKey: ['inventory_overview'],
    queryFn: () => callInventory('get_inventory_overview'),
  });
}

// ==================== STOCK LEDGER ====================
export function useStockLedger() {
  return useQuery({
    queryKey: ['stock_ledger'],
    queryFn: () => callInventory('get_stock_ledger'),
  });
}

// ==================== STOCK ADJUSTMENTS ====================
export function useStockAdjustments() {
  return useQuery({
    queryKey: ['stock_adjustments'],
    queryFn: () => callInventory('get_stock_adjustments'),
  });
}

export function useStockAdjustmentMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['stock_adjustments'] });
    qc.invalidateQueries({ queryKey: ['stock_ledger'] });
    qc.invalidateQueries({ queryKey: ['inventory_overview'] });
  };

  const createAdjustment = useMutation({
    mutationFn: (adjustment: any) => callInventory('create_stock_adjustment', { adjustment }),
    onSuccess: () => { invalidate(); toast.success('Adjustment created'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const approveAdjustment = useMutation({
    mutationFn: (id: string) => callInventory('approve_stock_adjustment', { id }),
    onSuccess: () => { invalidate(); toast.success('Adjustment approved & stock updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectAdjustment = useMutation({
    mutationFn: (id: string) => callInventory('reject_stock_adjustment', { id }),
    onSuccess: () => { invalidate(); toast.success('Adjustment rejected'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createAdjustment, approveAdjustment, rejectAdjustment };
}

// ==================== STOCK TRANSFERS ====================
export function useStockTransfers() {
  return useQuery({
    queryKey: ['stock_transfers'],
    queryFn: () => callInventory('get_stock_transfers'),
  });
}

export function useStockTransferMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['stock_transfers'] });
    qc.invalidateQueries({ queryKey: ['inventory_overview'] });
  };

  const createTransfer = useMutation({
    mutationFn: (transfer: any) => callInventory('create_stock_transfer', { transfer }),
    onSuccess: () => { invalidate(); toast.success('Transfer created'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTransferStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => callInventory('update_transfer_status', { id, status }),
    onSuccess: () => { invalidate(); toast.success('Transfer status updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createTransfer, updateTransferStatus };
}

// ==================== SUPPLIERS ====================
export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: () => callInventory('get_suppliers'),
  });
}

export function useSupplierMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['suppliers'] });

  const createSupplier = useMutation({
    mutationFn: (supplier: any) => callInventory('create_supplier', { supplier }),
    onSuccess: () => { invalidate(); toast.success('Supplier created'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSupplier = useMutation({
    mutationFn: (supplier: any) => callInventory('update_supplier', { supplier }),
    onSuccess: () => { invalidate(); toast.success('Supplier updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSupplier = useMutation({
    mutationFn: (id: string) => callInventory('delete_supplier', { id }),
    onSuccess: () => { invalidate(); toast.success('Supplier deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createSupplier, updateSupplier, deleteSupplier };
}

// ==================== BRANCHES ====================
export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => callInventory('get_branches'),
  });
}
