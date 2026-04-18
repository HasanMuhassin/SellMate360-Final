import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CompanySettings {
  id: string;
  name: string;
  legalName: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  taxId: string;
  vatNumber: string;
  logo: string;
  favicon: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  orderPrefix: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
  };
}

const defaultSettings: CompanySettings = {
  id: '',
  name: '',
  legalName: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  city: '',
  country: 'Sri Lanka',
  postalCode: '',
  taxId: '',
  vatNumber: '',
  logo: '',
  favicon: '',
  currency: 'LKR',
  timezone: 'Asia/Colombo',
  dateFormat: 'DD/MM/YYYY',
  orderPrefix: 'ORD',
  socialLinks: {},
};

function mapDbToSettings(row: any): CompanySettings {
  return {
    id: row.id,
    name: row.name || '',
    legalName: row.legal_name || '',
    email: row.email || '',
    phone: row.phone || '',
    whatsapp: row.whatsapp || '',
    address: row.address || '',
    city: row.city || '',
    country: row.country || '',
    postalCode: row.postal_code || '',
    taxId: row.tax_id || '',
    vatNumber: row.vat_number || '',
    logo: row.logo || '',
    favicon: row.favicon || '',
    currency: row.currency || 'LKR',
    timezone: row.timezone || 'Asia/Colombo',
    dateFormat: row.date_format || 'DD/MM/YYYY',
    orderPrefix: row.order_prefix || 'ORD',
    socialLinks: {
      facebook: row.social_facebook || '',
      instagram: row.social_instagram || '',
      twitter: row.social_twitter || '',
      youtube: row.social_youtube || '',
      tiktok: row.social_tiktok || '',
    },
  };
}

const CLOUD_FUNCTIONS_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

async function callEdgeFunction(action: string, session: any, settings?: CompanySettings) {
  const body: any = { action };
  if (settings) body.settings = settings;

  const response = await fetch(`${CLOUD_FUNCTIONS_URL}/manage-company-settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Request failed');
  }
  return response.json();
}

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const result = await callEdgeFunction('get', session);
      if (result?.data) {
        setSettings(mapDbToSettings(result.data));
      }
    } catch (err: any) {
      console.error('Failed to load company settings:', err);
      toast.error('Failed to load company settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const result = await callEdgeFunction('update', session, settings);
      if (result?.data) {
        setSettings(mapDbToSettings(result.data));
      }
      toast.success('Company settings saved successfully');
    } catch (err: any) {
      console.error('Failed to save company settings:', err);
      toast.error('Failed to save company settings');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    setSettings,
    isLoading,
    isSaving,
    saveSettings,
    updateSettings: (updates: Partial<CompanySettings>) => {
      setSettings(prev => ({ ...prev, ...updates }));
    },
    updateSocialLinks: (platform: string, url: string) => {
      setSettings(prev => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [platform]: url },
      }));
    },
  };
}
