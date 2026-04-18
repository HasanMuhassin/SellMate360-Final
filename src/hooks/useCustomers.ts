import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// =====================================================
// TYPES
// =====================================================

export interface CustomerRecord {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string;
  alternate_phone: string | null;
  order_count: number;
  total_spent: number;
  average_order_value: number;
  cod_rejection_count: number;
  cod_rejection_rate: number;
  risk_score: string;
  preferred_payment: string | null;
  is_blocked: boolean;
  blocked_reason: string | null;
  tags: string[];
  last_order_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddressRecord {
  id: string;
  customer_id: string;
  label: string;
  recipient_name: string | null;
  phone: string | null;
  district: string;
  city: string;
  street: string;
  postal_code: string | null;
  is_default: boolean;
  delivery_instructions: string | null;
  created_at: string;
}

export interface CustomerNoteRecord {
  id: string;
  customer_id: string;
  content: string;
  type: string;
  created_by: string;
  created_at: string;
}

// =====================================================
// QUERIES
// =====================================================

export function useCustomers(options?: {
  search?: string;
  riskScore?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['customers', options],
    queryFn: async () => {
      let query = supabase
        .from('customers' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.riskScore && options.riskScore !== 'all') {
        query = query.eq('risk_score', options.riskScore);
      }
      if (options?.status === 'active') {
        query = query.eq('is_blocked', false);
      } else if (options?.status === 'blocked') {
        query = query.eq('is_blocked', true);
      }
      if (options?.search) {
        query = query.or(`name.ilike.%${options.search}%,phone.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CustomerRecord[];
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as CustomerRecord | null;
    },
    enabled: !!id,
  });
}

export function useCustomerAddressesByCustomer(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId, 'addresses'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return (data || []) as CustomerAddressRecord[];
    },
    enabled: !!customerId,
  });
}

export function useCustomerNotes(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId, 'notes'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CustomerNoteRecord[];
    },
    enabled: !!customerId,
  });
}

export function useCustomerOrderHistory(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId, 'orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!customerId,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

export function useBlockCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_blocked, blocked_reason }: { id: string; is_blocked: boolean; blocked_reason?: string }) => {
      const updateData: any = {
        is_blocked,
        blocked_reason: is_blocked ? (blocked_reason || null) : null,
      };

      const { data, error } = await (supabase as any)
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', data.id] });
      toast.success(data.is_blocked ? 'Customer blocked' : 'Customer unblocked');
    },
    onError: (error: Error) => {
      toast.error('Failed to update customer: ' + error.message);
    },
  });
}

export function useAddCustomerNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customer_id, content, type, created_by }: {
      customer_id: string;
      content: string;
      type: string;
      created_by: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from('customer_notes')
        .insert({ customer_id, content, type, created_by })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.customer_id, 'notes'] });
      toast.success('Note added successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to add note: ' + error.message);
    },
  });
}
