import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RefreshCw,
  MessageCircle,
  Star,
  Minus,
  Plus,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useStorefrontProductBySlug, useStorefrontRelatedProducts } from '@/hooks/useStorefront';
import { useActiveDiscounts } from '@/hooks/useActiveDiscounts';
import ProductCard from '@/components/products/ProductCard';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import SEOMeta from '@/components/SEOMeta';

const districts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Mullaitivu', 'Vavuniya', 'Trincomalee', 'Batticaloa', 'Ampara',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle',
];

export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: rawProduct, isLoading } = useStorefrontProductBySlug(slug || '');
  const { applyDiscounts } = useActiveDiscounts();
  const product = rawProduct ? applyDiscounts(rawProduct) : null;
  const { data: rawRelated = [] } = useStorefrontRelatedProducts(
    product?.category || '',
    product?.id || ''
  );
  const relatedProducts = rawRelated.map(applyDiscounts);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button asChild>
            <Link to="/shop">Back to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const deliveryFee = selectedDistrict
    ? selectedDistrict === 'Colombo' || selectedDistrict === 'Gampaha'
      ? 350
      : 500
    : null;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in: ${product.name} (${formatPrice(product.price)})`
  );
  const whatsappUrl = `https://wa.me/+94754864688?text=${whatsappMessage}`;

  const stock = product.stock || 0;
  const isOutOfStock = stock <= 0;

  let stockLabel = '';
  let stockClass = '';

  if (isOutOfStock) {
    stockLabel = 'Out of Stock';
    stockClass = 'badge-out-of-stock';
  } else if (stock <= 5) {
    stockLabel = `Only ${stock} left`;
    stockClass = 'badge-low-stock';
  } else {
    stockLabel = `In Stock (${stock} items)`;
    stockClass = 'badge-in-stock';
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOMeta
        pageType="product"
        titleOverride={`${product.name} | SellMate360`}
        descriptionOverride={product.description?.substring(0, 160)}
        imageOverride={product.images?.[0]}
      />
      {/* Breadcrumb */}
      <div className="bg-muted/50 py-4">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square bg-muted rounded-2xl overflow-hidden"
            >
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount > 0 && (
                <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-sm px-3 py-1">
                  -{discount}% OFF
                </Badge>
              )}
            </motion.div>
            {product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      'w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors',
                      selectedImage === index
                        ? 'border-primary'
                        : 'border-transparent hover:border-primary/50'
                    )}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-primary font-medium mb-2">{product.brand}</p>
              <h1 className="text-2xl lg:text-3xl font-bold mb-3">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={cn('h-4 w-4', i < Math.floor(product.rating) ? 'fill-warning text-warning' : 'fill-muted text-muted')} />
                  ))}
                </div>
                <span className="text-sm font-medium">{product.rating}</span>
                <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
              </div>
              <Badge variant="outline" className={cn('text-sm', stockClass)}>
                {stockLabel}
              </Badge>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
              {product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
              )}
            </div>

            <p className="text-muted-foreground">{product.description}</p>

            <div>
              <label className="text-sm font-medium block mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-lg">
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isOutOfStock}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.min(stock, quantity + 1))} disabled={isOutOfStock || quantity >= stock}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {stock > 0 && stock <= 5 && (
                  <span className="text-sm text-warning">Only {stock} left in stock</span>
                )}
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-xl space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" />
                Delivery Fee Calculator
              </h4>
              <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your district" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {deliveryFee !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee:</span>
                  <span className="font-medium">{formatPrice(deliveryFee)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={isOutOfStock}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button size="lg" variant="outline" className="flex-1" disabled={isOutOfStock} asChild>
                <Link to="/checkout">Buy Now</Link>
              </Button>
            </div>

            <Button asChild variant="outline" size="lg" className="w-full border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5 mr-2" />
                Ask About This Product
              </a>
            </Button>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Heart className="h-4 w-4" />
                Add to Wishlist
              </button>
              <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <Truck className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">1-3 Day Delivery</p>
              </div>
              <div className="text-center">
                <Shield className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Secure Payment</p>
              </div>
              <div className="text-center">
                <RefreshCw className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Easy Returns</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="features" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
              <TabsTrigger value="features" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Features</TabsTrigger>
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Description</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Reviews ({product.reviewCount})</TabsTrigger>
            </TabsList>
            <TabsContent value="features" className="pt-6">
              <ul className="grid sm:grid-cols-2 gap-3">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="description" className="pt-6">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </TabsContent>
            <TabsContent value="reviews" className="pt-6">
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-warning mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Customer Reviews Coming Soon</h3>
                <p className="text-muted-foreground">Be the first to review this product!</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
