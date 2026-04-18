import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';
import { useActivePromotions, useFlashSaleProducts } from '@/hooks/usePromotions';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Product } from '@/types/store';

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      };
    };
    setTimeLeft(calculate());
    const timer = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4" />
      <div className="flex gap-1 text-sm font-mono">
        {timeLeft.days > 0 && <span className="bg-card/20 px-2 py-1 rounded">{timeLeft.days}d</span>}
        <span className="bg-card/20 px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span className="bg-card/20 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span className="bg-card/20 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
    </div>
  );
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    price: Number(row.selling_price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    images: row.image_url ? [row.image_url] : ['/placeholder.svg'],
    category: row.categories?.slug || '',
    brand: row.brands?.name || '',
    stock: row.stock,
    stockStatus: (row.stock_status || 'in-stock').replace(/_/g, '-') as Product['stockStatus'],
    rating: Number(row.rating),
    reviewCount: row.review_count,
    features: row.features || [],
    isBestSeller: row.is_bestseller,
    isNew: row.is_new,
  };
}

function FlashSaleSection({ sale }: { sale: any }) {
  const { data, isLoading } = useFlashSaleProducts(sale.id);
  const products = (data?.products || []).map(mapProduct);

  // Apply flash sale discount to products
  const discountedProducts = products.map((p: Product) => {
    const originalPrice = p.originalPrice || p.price;
    let newPrice = p.price;
    if (sale.discount_type === 'percentage') {
      newPrice = p.price * (1 - sale.discount_value / 100);
    } else {
      newPrice = Math.max(0, p.price - sale.discount_value);
    }
    return { ...p, price: Math.round(newPrice), originalPrice };
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  if (discountedProducts.length === 0) return null;

  return (
    <section className="py-12 lg:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-destructive/10 via-destructive/5 to-warning/10 rounded-2xl p-6 lg:p-8 border border-destructive/20"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive rounded-lg">
                <Zap className="h-6 w-6 text-destructive-foreground" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold">{sale.name}</h2>
                {sale.description && (
                  <p className="text-muted-foreground text-sm mt-1">{sale.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-destructive">Ends in:</span>
              <CountdownTimer endsAt={sale.ends_at} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {discountedProducts.slice(0, 8).map((product: Product, index: number) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function FlashSaleBanner() {
  const { data, isLoading } = useActivePromotions();
  const flashSales = data?.flash_sales || [];

  if (isLoading || flashSales.length === 0) return null;

  return (
    <>
      {flashSales.map((sale: any) => (
        <FlashSaleSection key={sale.id} sale={sale} />
      ))}
    </>
  );
}
