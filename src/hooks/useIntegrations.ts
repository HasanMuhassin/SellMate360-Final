import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const functionsBaseUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

export interface Integration {
  id: string;
  name: string;
  category: 'payment' | 'shipping' | 'marketing' | 'analytics' | 'communication';
  description: string | null;
  icon: string | null;
  status: 'connected' | 'disconnected' | 'pending';
  configured_at: string | null;
  credentials: Record<string, string>;
  created_at: string;
  updated_at: string;
}

async function callStoreSettings(body: Record<string, unknown>) {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(`${functionsBaseUrl}/manage-store-settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || 'Request failed');
  return data;
}

export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const result = await callStoreSettings({ module: 'integrations', action: 'list' });
      return (result.data || []) as Integration[];
    },
  });
}

export function useConnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; credentials?: Record<string, string> }) =>
      callStoreSettings({ module: 'integrations', action: 'connect', id: params.id, credentials: params.credentials }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  });
}

export function useDisconnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      callStoreSettings({ module: 'integrations', action: 'disconnect', id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  });
}

export function useUpsertIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (integration: Partial<Integration>) =>
      callStoreSettings({ module: 'integrations', action: 'upsert', integration }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  });
}

export function useDeleteIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      callStoreSettings({ module: 'integrations', action: 'delete', id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  });
}
