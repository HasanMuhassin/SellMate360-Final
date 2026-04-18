import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-promotions`;

async function callPromotions(action: string, payload: any = {}) {
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

// ==================== COUPONS ====================
export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: () => callPromotions('get_coupons'),
  });
}

export function useCouponMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['coupons'] });

  const createCoupon = useMutation({
    mutationFn: (coupon: any) => callPromotions('create_coupon', { coupon }),
    onSuccess: () => { invalidate(); toast.success('Coupon created'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCoupon = useMutation({
    mutationFn: (coupon: any) => callPromotions('update_coupon', { coupon }),
    onSuccess: () => { invalidate(); toast.success('Coupon updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCoupon = useMutation({
    mutationFn: (id: string) => callPromotions('delete_coupon', { id }),
    onSuccess: () => { invalidate(); toast.success('Coupon deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleCouponStatus = useMutation({
    mutationFn: (id: string) => callPromotions('toggle_coupon_status', { id }),
    onSuccess: () => { invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createCoupon, updateCoupon, deleteCoupon, toggleCouponStatus };
}

// ==================== DISCOUNT RULES ====================
export function useDiscountRules() {
  return useQuery({
    queryKey: ['discount_rules'],
    queryFn: () => callPromotions('get_discount_rules'),
  });
}

export function useDiscountRuleMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['discount_rules'] });

  const createRule = useMutation({
    mutationFn: (rule: any) => callPromotions('create_discount_rule', { rule }),
    onSuccess: () => { invalidate(); toast.success('Discount rule created'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRule = useMutation({
    mutationFn: (rule: any) => callPromotions('update_discount_rule', { rule }),
    onSuccess: () => { invalidate(); toast.success('Discount rule updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => callPromotions('delete_discount_rule', { id }),
    onSuccess: () => { invalidate(); toast.success('Discount rule deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleRuleStatus = useMutation({
    mutationFn: (id: string) => callPromotions('toggle_discount_rule_status', { id }),
    onSuccess: () => { invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createRule, updateRule, deleteRule, toggleRuleStatus };
}

// ==================== FLASH SALES ====================
export function useFlashSales() {
  return useQuery({
    queryKey: ['flash_sales'],
    queryFn: () => callPromotions('get_flash_sales'),
  });
}

export function useFlashSaleMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['flash_sales'] });

  const createSale = useMutation({
    mutationFn: (sale: any) => callPromotions('create_flash_sale', { sale }),
    onSuccess: () => { invalidate(); toast.success('Flash sale created'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSale = useMutation({
    mutationFn: (sale: any) => callPromotions('update_flash_sale', { sale }),
    onSuccess: () => { invalidate(); toast.success('Flash sale updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSale = useMutation({
    mutationFn: (id: string) => callPromotions('delete_flash_sale', { id }),
    onSuccess: () => { invalidate(); toast.success('Flash sale deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelSale = useMutation({
    mutationFn: (id: string) => callPromotions('cancel_flash_sale', { id }),
    onSuccess: () => { invalidate(); toast.success('Flash sale cancelled'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createSale, updateSale, deleteSale, cancelSale };
}

// ==================== BANNERS (Admin) ====================
export function useAdminBanners() {
  return useQuery({
    queryKey: ['admin_banners'],
    queryFn: () => callPromotions('get_banners'),
  });
}

export function useAdminBannerMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin_banners'] });

  const createBanner = useMutation({
    mutationFn: (banner: any) => callPromotions('create_banner', { banner }),
    onSuccess: () => { invalidate(); toast.success('Banner created'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateBanner = useMutation({
    mutationFn: (banner: any) => callPromotions('update_banner', { banner }),
    onSuccess: () => { invalidate(); toast.success('Banner updated'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBanner = useMutation({
    mutationFn: (id: string) => callPromotions('delete_banner', { id }),
    onSuccess: () => { invalidate(); toast.success('Banner deleted'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleBannerStatus = useMutation({
    mutationFn: (id: string) => callPromotions('toggle_banner_status', { id }),
    onSuccess: () => { invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createBanner, updateBanner, deleteBanner, toggleBannerStatus };
}

// ==================== CUSTOMER-SIDE ====================
export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ code, order_total }: { code: string; order_total: number }) =>
      callPromotions('validate_coupon', { code, order_total }),
  });
}

export function useActivePromotions() {
  return useQuery({
    queryKey: ['active_promotions'],
    queryFn: () => callPromotions('get_active_promotions'),
    staleTime: 60000,
  });
}

export function useFlashSaleProducts(saleId: string | null) {
  return useQuery({
    queryKey: ['flash_sale_products', saleId],
    queryFn: () => callPromotions('get_flash_sale_products', { sale_id: saleId }),
    enabled: !!saleId,
  });
}
