import { useQuery } from '@tanstack/react-query';

const CLOUD_FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

export interface PublicCompanySettings {
  name: string;
  legal_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  logo: string;
  favicon: string;
  currency: string;
  timezone: string;
  date_format: string;
  order_prefix: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_youtube: string;
  social_tiktok: string;
}

export interface PublicPaymentMethod {
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
}

export interface PublicTaxConfig {
  id: string;
  name: string;
  rate: number;
  type: 'inclusive' | 'exclusive';
  apply_to: 'all' | 'specific';
  categories: string[] | null;
}

export interface PublicBranch {
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
}

export interface PublicStoreSettings {
  company: PublicCompanySettings | null;
  payment_methods: PublicPaymentMethod[];
  tax_configs: PublicTaxConfig[];
  branches: PublicBranch[];
}

async function fetchPublicSettings(): Promise<PublicStoreSettings> {
  const response = await fetch(`${CLOUD_FUNCTIONS_URL}/get-store-settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch store settings');
  }
  return response.json();
}

export function usePublicStoreSettings() {
  return useQuery({
    queryKey: ['public-store-settings'],
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

// Convenience hooks
export function usePublicCompany() {
  const { data, ...rest } = usePublicStoreSettings();
  return { company: data?.company ?? null, ...rest };
}

export function usePublicPaymentMethods() {
  const { data, ...rest } = usePublicStoreSettings();
  return { methods: data?.payment_methods ?? [], ...rest };
}

export function usePublicTaxConfigs() {
  const { data, ...rest } = usePublicStoreSettings();
  return { taxes: data?.tax_configs ?? [], ...rest };
}

export function usePublicBranches() {
  const { data, ...rest } = usePublicStoreSettings();
  return { branches: data?.branches ?? [], ...rest };
}
