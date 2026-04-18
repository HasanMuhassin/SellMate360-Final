import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CLOUD_FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

async function callEdgeFunction(module: string, action: string, session: any, extra?: Record<string, any>) {
  const response = await fetch(`${CLOUD_FUNCTIONS_URL}/manage-store-settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ module, action, ...extra }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Request failed');
  }
  return response.json();
}

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ===== NOTIFICATION TEMPLATES =====
export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'sms';
  trigger_event: string;
  subject: string | null;
  content: string;
  variables: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export function useNotificationTemplates() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = await getSession();
      if (!session) return;
      const result = await callEdgeFunction('notifications', 'list', session);
      setTemplates(result.data || []);
    } catch (err: any) {
      console.error('Failed to load notification templates:', err);
      toast.error('Failed to load notification templates');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upsertTemplate = async (template: Partial<NotificationTemplate>) => {
    try {
      const session = await getSession();
      if (!session) return;
      await callEdgeFunction('notifications', 'upsert', session, { template });
      toast.success(template.id ? 'Template updated' : 'Template created');
      await fetchTemplates();
      return true;
    } catch (err: any) {
      toast.error('Failed to save template');
      return false;
    }
  };

  const toggleStatus = async (id: string, status: string) => {
    try {
      const session = await getSession();
      if (!session) return;
      await callEdgeFunction('notifications', 'toggle_status', session, { id, status });
      await fetchTemplates();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const session = await getSession();
      if (!session) return;
      await callEdgeFunction('notifications', 'delete', session, { id });
      toast.success('Template deleted');
      await fetchTemplates();
    } catch (err: any) {
      toast.error('Failed to delete template');
    }
  };

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  return { templates, isLoading, fetchTemplates, upsertTemplate, toggleStatus, deleteTemplate };
}

// ===== BRANCHES =====
export interface Branch {
  id: string;
  name: string;
  code: string;
  type: 'store' | 'warehouse';
  address: string;
  city: string;
  district: string;
  phone: string;
  email: string;
  manager: string;
  opening_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  is_pickup_location: boolean;
  accepts_returns: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBranches = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = await getSession();
      if (!session) return;
      const result = await callEdgeFunction('branches', 'list', session);
      setBranches(result.data || []);
    } catch (err: any) {
      console.error('Failed to load branches:', err);
      toast.error('Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upsertBranch = async (branch: Partial<Branch>) => {
    try {
      const session = await getSession();
      if (!session) return;
      await callEdgeFunction('branches', 'upsert', session, { branch });
      toast.success(branch.id ? 'Branch updated' : 'Branch created');
      await fetchBranches();
      return true;
    } catch (err: any) {
      toast.error('Failed to save branch');
      return false;
    }
  };

  const toggleStatus = async (id: string, status: string) => {
    try {
      const session = await getSession();
      if (!session) return;
      await callEdgeFunction('branches', 'toggle_status', session, { id, status });
      await fetchBranches();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      const session = await getSession();
      if (!session) return;
      await callEdgeFunction('branches', 'delete', session, { id });
      toast.success('Branch deleted');
      await fetchBranches();
    } catch (err: any) {
      toast.error('Failed to delete branch');
    }
  };

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  return { branches, isLoading, fetchBranches, upsertBranch, toggleStatus, deleteBranch };
}

// ===== TAX CONFIGS =====
export interface TaxConfig {
  id: string;
  name: string;
  rate: number;
  type: 'inclusive' | 'exclusive';
  apply_to: 'all' | 'specific';
  categories: string[] | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export function useTaxConfigs() {
  const [taxes, setTaxes] = useState<TaxConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTaxes = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = await getSession();
      if (!session) return;
      const result = await callEdgeFunction('taxes', 'list', session);
      setTaxes(result.data || []);
    } catch (err: any) {
      console.error('Failed to load tax configs:', err);
      toast.error('Failed to load tax configurations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upsertTax = async (tax: Partial<TaxConfig>) => {
    try {
      const session = await getSession();
      if (!session) return;
      await callEdgeFunction('taxes', 'upsert', session, { tax });
      toast.success(tax.id ? 'Tax updated' : 'Tax created');
      await fetchTaxes();
      return true;
    } catch (err: any) {
      toast.error('Failed to save tax config');
      return false;
    }
  };

  const toggleStatus = async (id: string, status: string) => {
    try {
      const session = await getSession();
      if (!session) return;
      await callEdgeFunction('taxes', 'toggle_status', session, { id, status });
      await fetchTaxes();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const deleteTax = async (id: string) => {
    try {
      const session = await getSession();
      if (!session) return;
      await callEdgeFunction('taxes', 'delete', session, { id });
      toast.success('Tax config deleted');
      await fetchTaxes();
    } catch (err: any) {
      toast.error('Failed to delete tax config');
    }
  };

  useEffect(() => { fetchTaxes(); }, [fetchTaxes]);

  return { taxes, isLoading, fetchTaxes, upsertTax, toggleStatus, deleteTax };
}

// ===== PAYMENT METHODS =====
export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  type: 'cod' | 'bank' | 'card' | 'wallet';
  instructions: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  bank_branch: string | null;
  processing_fee: number;
  fee_type: 'fixed' | 'percentage';
  min_order: number | null;
  max_order: number | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      const session = await getSession();
      if (!session) return;
      const result = await callEdgeFunction('payment_methods', 'list', session);
      setMethods(result.data || []);
    } catch (err: any) {
      console.error('Failed to load payment methods:', err);
      toast.error('Failed to load payment methods');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upsertMethod = async (method: Partial<PaymentMethod>) => {
    try {
      const session = await getSession();
      if (!session) return;
      await callEdgeFunction('payment_methods', 'upsert', session, { method });
      toast.success(method.id ? 'Payment method updated' : 'Payment method created');
      await fetchMethods();
      return true;
    } catch (err: any) {
      toast.error('Failed to save payment method');
      return false;
    }
  };

  const toggleStatus = async (id: string, status: string) => {
    try {
      const session = await getSession();
      if (!session) return;
      await callEdgeFunction('payment_methods', 'toggle_status', session, { id, status });
      await fetchMethods();
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const deleteMethod = async (id: string) => {
    try {
      const session = await getSession();
      if (!session) return;
      await callEdgeFunction('payment_methods', 'delete', session, { id });
      toast.success('Payment method deleted');
      await fetchMethods();
    } catch (err: any) {
      toast.error('Failed to delete payment method');
    }
  };

  useEffect(() => { fetchMethods(); }, [fetchMethods]);

  return { methods, isLoading, fetchMethods, upsertMethod, toggleStatus, deleteMethod };
}
