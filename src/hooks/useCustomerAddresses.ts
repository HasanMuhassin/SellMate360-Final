import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  district: string;
  city: string;
  street: string;
  zip_code: string | null;
  is_default: boolean;
  created_at: string;
}

async function getCustomerId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  return customer?.id || null;
}

export function useCustomerAddresses() {
  return useQuery({
    queryKey: ['customer-addresses'],
    queryFn: async () => {
      const customerId = await getCustomerId();
      if (!customerId) return [];

      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return (data || []) as CustomerAddress[];
    },
  });
}

export function useAddAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: {
      label: string;
      district: string;
      city: string;
      street: string;
      zip_code?: string;
      is_default?: boolean;
    }) => {
      const customerId = await getCustomerId();
      if (!customerId) throw new Error('No customer record found');

      // If setting as default, unset others first
      if (address.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false } as any)
          .eq('customer_id', customerId);
      }

      const { data, error } = await supabase
        .from('customer_addresses')
        .insert({
          customer_id: customerId,
          ...address,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...address }: {
      id: string;
      label: string;
      district: string;
      city: string;
      street: string;
      zip_code?: string;
      is_default?: boolean;
    }) => {
      const customerId = await getCustomerId();
      if (!customerId) throw new Error('No customer record found');

      if (address.is_default) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false } as any)
          .eq('customer_id', customerId);
      }

      const { data, error } = await supabase
        .from('customer_addresses')
        .update(address as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const customerId = await getCustomerId();
      if (!customerId) throw new Error('No customer record found');

      // Unset all defaults
      await supabase
        .from('customer_addresses')
        .update({ is_default: false } as any)
        .eq('customer_id', customerId);

      // Set new default
      const { error } = await supabase
        .from('customer_addresses')
        .update({ is_default: true } as any)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
  });
}
