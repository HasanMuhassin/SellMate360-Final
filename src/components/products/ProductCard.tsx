import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { Product } from '@/types/store';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem } = useCart();

  const formatPrice = (price: number) => {
    return `Rs. ${price.toLocaleString()}`;
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const stockBadgeMap: Record<string, { label: string; className: string }> = {
    'in-stock': { label: 'In Stock', className: 'badge-in-stock' },
    'low-stock': { label: 'Low Stock', className: 'badge-low-stock' },
    'out-of-stock': { label: 'Out of Stock', className: 'badge-out-of-stock' },
  };

  const stockBadge = stockBadgeMap[product.stockStatus] || stockBadgeMap['in-stock'];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockStatus !== 'out-of-stock') {
      addItem(product);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group"
    >
      <Link to={`/product/${product.slug}`}>
        <div className="product-card bg-card rounded-xl overflow-hidden border border-border">
          {/* Image Container */}
          <div className="relative aspect-square bg-muted overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {discount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground">
                  -{discount}%
                </Badge>
              )}
              {(product as any)._promoBadge && (
                <Badge className="bg-warning text-warning-foreground text-xs">
                  {(product as any)._promoBadge}
                </Badge>
              )}
              {product.isNew && (
                <Badge className="bg-primary text-primary-foreground">New</Badge>
              )}
              {product.isBestSeller && (
                <Badge className="bg-warning text-warning-foreground">Best Seller</Badge>
              )}
            </div>

            {/* Wishlist Button */}
            <button className="absolute top-3 right-3 p-2 bg-card/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card">
              <Heart className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
            </button>

            {/* Quick Add to Cart */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-foreground/60 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <Button
                onClick={handleAddToCart}
                disabled={product.stockStatus === 'out-of-stock'}
                className="w-full"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Category & Stock */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {product.brand}
              </span>
              <Badge
                variant="outline"
                className={cn('text-xs', stockBadge.className)}
              >
                {stockBadge.label}
              </Badge>
            </div>

            {/* Product Name */}
            <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3 w-3',
                      i < Math.floor(product.rating)
                        ? 'fill-warning text-warning'
                        : 'fill-muted text-muted'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
