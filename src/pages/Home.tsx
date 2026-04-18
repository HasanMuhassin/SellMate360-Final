import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Truck, Shield, RefreshCw, Headphones } from 'lucide-react';
import { useStorefrontProducts, useStorefrontCategories, useStorefrontBanners, Banner } from '@/hooks/useStorefront';
import { useActiveDiscounts } from '@/hooks/useActiveDiscounts';
import FlashSaleBanner from '@/components/promotions/FlashSaleBanner';
import ProductCard from '@/components/products/ProductCard';
import CategoryCard from '@/components/products/CategoryCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const trustBadges = [
  { icon: Truck, title: 'Fast Delivery', description: '1-3 Days Island-wide' },
  { icon: Shield, title: 'Secure Payment', description: '100% Protected' },
  { icon: RefreshCw, title: 'Easy Returns', description: '7-Day Return Policy' },
  { icon: Headphones, title: '24/7 Support', description: 'We\'re here to help' },
];

function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-border bg-card">
          <Skeleton className="aspect-square w-full" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

const fallbackBanners: Banner[] = [
  { id: '1', title: 'Flash Sale Weekend', subtitle: 'Up to 50% OFF on Electronics', cta: 'Shop Now', link: '/shop?category=electronics', image_url: null },
  { id: '2', title: 'New Kitchen Collection', subtitle: 'Transform your cooking experience', cta: 'Explore', link: '/shop?category=kitchenware', image_url: null },
  { id: '3', title: 'Island-wide COD', subtitle: 'Cash on Delivery available everywhere', cta: 'Learn More', link: '/delivery-info', image_url: null },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { applyDiscounts } = useActiveDiscounts();

  const { data: allProducts = [], isLoading: loadingProducts } = useStorefrontProducts({ limit: 8 });
  const { data: bestSellers = [], isLoading: loadingBest } = useStorefrontProducts({ bestseller: true });
  const { data: newArrivals = [], isLoading: loadingNew } = useStorefrontProducts({ isNew: true });
  const { data: categories = [], isLoading: loadingCategories } = useStorefrontCategories();
  const { data: dbBanners = [], isLoading: loadingBanners } = useStorefrontBanners();

  // Apply active discounts to all product lists
  const discountedAll = allProducts.map(applyDiscounts);
  const discountedBest = bestSellers.map(applyDiscounts);
  const discountedNew = newArrivals.map(applyDiscounts);

  const banners = dbBanners.length > 0 ? dbBanners : fallbackBanners;

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const nextSlide = () => banners.length > 0 && setCurrentSlide((prev) => (prev + 1) % banners.length);
  const prevSlide = () => banners.length > 0 && setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative overflow-hidden">
        <div className="relative h-[400px] sm:h-[500px] lg:h-[600px]">
          {loadingBanners ? (
            <Skeleton className="absolute inset-0" />
          ) : banners.length > 0 ? (
            <>
              {banners.map((banner, index) => (
                <motion.div
                  key={banner.id}
                  initial={false}
                  animate={{
                    opacity: index === currentSlide ? 1 : 0,
                    scale: index === currentSlide ? 1 : 1.05,
                  }}
                  transition={{ duration: 0.7 }}
                  className="absolute inset-0"
                >
                  {/* Banner Image or Fallback Gradient */}
                  {banner.image_url ? (
                    <>
                      <img 
                        src={banner.image_url} 
                        alt={banner.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                    </>
                  ) : (
                    <div className="absolute inset-0 gradient-hero" />
                  )}

                  <div className="container h-full flex items-center">
                    <div className="max-w-xl text-primary-foreground relative z-10">
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: index === currentSlide ? 1 : 0, y: index === currentSlide ? 0 : 20 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm sm:text-base font-medium mb-2 opacity-90"
                      >
                        Limited Time Offer
                      </motion.p>
                      <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: index === currentSlide ? 1 : 0, y: index === currentSlide ? 0 : 20 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight shadow-sm"
                      >
                        {banner.title}
                      </motion.h1>
                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: index === currentSlide ? 1 : 0, y: index === currentSlide ? 0 : 20 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg sm:text-xl opacity-90 mb-6"
                      >
                        {banner.subtitle}
                      </motion.p>
                      {banner.cta && banner.link && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: index === currentSlide ? 1 : 0, y: index === currentSlide ? 0 : 20 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Button
                            asChild
                            size="lg"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-button"
                          >
                            <Link to={banner.link}>{banner.cta}</Link>
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/20 text-primary-foreground hover:bg-card/40 transition-colors backdrop-blur-sm"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/20 text-primary-foreground hover:bg-card/40 transition-colors backdrop-blur-sm"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      index === currentSlide ? 'bg-card w-8' : 'bg-card/50 hover:bg-card/70'
                    }`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold">Shop by Category</h2>
              <p className="text-muted-foreground mt-1">Find what you're looking for</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/categories">View All</Link>
            </Button>
          </div>
          {loadingCategories ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category, index) => (
                <CategoryCard key={category.id} category={category} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Flash Sales */}
      <FlashSaleBanner />

      {/* COD Banner */}
      <section className="py-8 bg-warning/10">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-warning/20">
              <Truck className="h-7 w-7 text-warning" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-warning">
                Cash on Delivery Available Island-wide
              </h3>
              <p className="text-muted-foreground">
                Pay when you receive your order. No advance payment required!
              </p>
            </div>
            <Button className="bg-warning hover:bg-warning/90 text-warning-foreground" asChild>
              <Link to="/delivery-info">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold">Best Sellers</h2>
              <p className="text-muted-foreground mt-1">Our most popular products</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/shop?filter=best-sellers">View All</Link>
            </Button>
          </div>
          {loadingBest ? <ProductGridSkeleton /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {discountedBest.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 lg:py-16 bg-muted/50">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold">New Arrivals</h2>
              <p className="text-muted-foreground mt-1">Check out the latest additions</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/shop?filter=new">View All</Link>
            </Button>
          </div>
          {loadingNew ? <ProductGridSkeleton count={3} /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {discountedNew.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => (
              <motion.div
                key={badge.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border shadow-card"
              >
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center mb-4">
                  <badge.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold mb-1">{badge.title}</h3>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Products */}
      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold">All Products</h2>
              <p className="text-muted-foreground mt-1">Browse our complete collection</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/shop">View All</Link>
            </Button>
          </div>
          {loadingProducts ? <ProductGridSkeleton count={8} /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {discountedAll.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
