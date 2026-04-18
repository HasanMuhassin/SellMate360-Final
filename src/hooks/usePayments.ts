import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCreateAuditLog } from "./useSecurity";

export interface PaymentRow {
  id: string;
  order_id: string;
  amount: number;
  method: 'cod' | 'bank' | 'card' | 'online';
  status: 'pending' | 'verified' | 'collected' | 'remitted' | 'rejected' | 'refunded';
  reference?: string;
  evidence_url?: string;
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  // Join-metadata
  order_number?: string;
  customer_name?: string;
}

// ==================== HOOKS ====================

export function usePayments(options?: { status?: string; method?: string; orderNumber?: string }) {
  return useQuery<PaymentRow[]>({
    queryKey: ["payments", options],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select(`
          *,
          order:orders(order_number, shipping_name)
        `)
        .order("created_at", { ascending: false });

      if (options?.status && options.status !== "all") {
        query = query.eq("status", options.status);
      }
      if (options?.method && options.method !== "all") {
        query = query.eq("method", options.method);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((p: any) => ({
        ...p,
        // Standard snake_case fields (from p)
        // Joined fields
        order_number: p.order?.order_number,
        customer_name: p.order?.shipping_name,
        
        // UI Compatibility Aliases (camelCase and legacy names)
        orderNumber: p.order?.order_number,
        customerName: p.order?.shipping_name,
        createdAt: p.created_at,
        verifiedAt: p.verified_at,
        verifiedBy: p.verified_by, // This will be the UUID, UI might need name lookup later
        paymentStatus: p.status,
        paymentMethod: p.method,
        refundAmount: p.amount,
        evidenceUrl: p.evidence_url,
        slipImage: p.evidence_url,
        rejectionReason: p.notes, // Mapping notes to rejectionReason for fallback
        bankName: p.notes?.includes(':') ? p.notes.split(':')[0] : 'Bank', // Simple heuristic
        accountNumber: '****',
        reference: p.reference || '-',
      })) as (PaymentRow & any)[];
    },
  });
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient();
  const createAuditLog = useCreateAuditLog();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes,
      orderNumber 
    }: { 
      id: string; 
      status: PaymentRow['status']; 
      notes?: string;
      orderNumber: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("payments")
        .update({ 
          status, 
          notes,
          verified_by: user?.id,
          verified_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Record Audit Log
      createAuditLog.mutate({
        action: `payment_${status}`,
        resource: 'payments',
        resource_id: id,
        details: { 
          order_number: orderNumber,
          new_status: status,
          admin_notes: notes 
        },
        level: status === 'rejected' ? 'warning' : 'info'
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment status updated successfully");
    },
    onError: (err: any) => {
      toast.error("Failed to update payment: " + err.message);
    }
  });
}

export function useRefundPayment() {
  const qc = useQueryClient();
  const createAuditLog = useCreateAuditLog();

  return useMutation({
    mutationFn: async ({ 
      id, 
      amount,
      reason,
      orderNumber 
    }: { 
      id: string; 
      amount: number;
      reason: string;
      orderNumber: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("payments")
        .update({ 
          status: 'refunded',
          notes: `Refunded: ${reason}`,
          verified_by: user?.id,
          verified_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Record Audit Log
      createAuditLog.mutate({
        action: 'refund_processed',
        resource: 'payments',
        resource_id: id,
        details: { 
          order_number: orderNumber,
          amount,
          reason 
        },
        level: 'critical' // Financial outflow is critical
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Refund processed successfully");
    },
    onError: (err: any) => {
      toast.error("Refund failed: " + err.message);
    }
  });
}
