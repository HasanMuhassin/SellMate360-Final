import { useMemo } from 'react';
import { useActivePromotions } from '@/hooks/usePromotions';
import { Product } from '@/types/store';

export function useActiveDiscounts() {
  const { data } = useActivePromotions();
  const discountRules = data?.discount_rules || [];
  const flashSales = data?.flash_sales || [];

  const applyDiscounts = useMemo(() => {
    return (product: Product): Product => {
      let bestDiscount = 0;
      let badgeText: string | undefined;

      // Check flash sales first
      for (const sale of flashSales) {
        const matchesProduct = sale.product_ids?.includes(product.id);
        const matchesCategory = sale.category_ids?.some((cid: string) => cid === product.category);
        const hasNoTargets = (!sale.product_ids || sale.product_ids.length === 0) && (!sale.category_ids || sale.category_ids.length === 0);

        if (matchesProduct || matchesCategory || hasNoTargets) {
          let discount = 0;
          if (sale.discount_type === 'percentage') {
            discount = product.price * (sale.discount_value / 100);
          } else {
            discount = sale.discount_value;
          }
          if (discount > bestDiscount) {
            bestDiscount = discount;
            badgeText = sale.badge_text || `${sale.discount_value}${sale.discount_type === 'percentage' ? '%' : ''} OFF`;
          }
        }
      }

      // Check discount rules
      for (const rule of discountRules) {
        const conditions = rule.conditions || {};
        // Simple rule matching: check min_quantity (for cart-level), category, product
        const matchesProduct = conditions.product_ids?.includes(product.id);
        const matchesCategory = conditions.category_ids?.includes(product.category);
        const isGlobal = !conditions.product_ids?.length && !conditions.category_ids?.length;

        if (matchesProduct || matchesCategory || isGlobal) {
          let discount = 0;
          if (rule.discount_type === 'percentage') {
            discount = product.price * (rule.discount_value / 100);
          } else {
            discount = rule.discount_value;
          }
          if (discount > bestDiscount) {
            bestDiscount = discount;
            badgeText = rule.name;
          }
        }
      }

      if (bestDiscount > 0) {
        return {
          ...product,
          originalPrice: product.originalPrice || product.price,
          price: Math.round(product.price - bestDiscount),
          _promoBadge: badgeText,
        } as Product & { _promoBadge?: string };
      }

      return product;
    };
  }, [discountRules, flashSales]);

  return { applyDiscounts, hasActivePromotions: flashSales.length > 0 || discountRules.length > 0 };
}
