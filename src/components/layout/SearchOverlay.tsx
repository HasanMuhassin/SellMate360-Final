import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProductSearch } from '@/hooks/useProductSearch';
import { cn } from '@/lib/utils';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  mobile?: boolean;
}

export default function SearchOverlay({ open, onClose, mobile }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Debounce input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Auto-focus when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [open]);

  const { data: results = [], isLoading, isFetching } = useProductSearch(debouncedQuery);

  const handleSelect = (slug: string) => {
    navigate(`/product/${slug}`);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;
  const showResults = debouncedQuery.length >= 2;
  const loading = isLoading || isFetching;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search panel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-0 left-0 right-0 z-50 bg-card shadow-lg border-b border-border"
      >
        <div className="container max-w-2xl mx-auto py-4 px-4">
          <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-10 pr-10 h-12 text-base"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </form>

          {/* Results dropdown */}
          {showResults && (
            <div className="mt-3 max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-card">
              {results.length === 0 && !loading ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p className="text-sm">No products found for "{debouncedQuery}"</p>
                </div>
              ) : (
                <ul>
                  {results.map((product) => (
                    <li key={product.id}>
                      <button
                        onClick={() => handleSelect(product.slug)}
                        className="flex items-center gap-4 w-full p-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-14 w-14 rounded-lg object-cover bg-muted flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-sm text-primary">{formatPrice(product.price)}</p>
                          {product.originalPrice && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(product.originalPrice)}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                  {results.length > 0 && (
                    <li>
                      <button
                        onClick={handleSubmit as any}
                        className="w-full p-3 text-center text-sm font-medium text-primary hover:bg-muted/50 transition-colors border-t border-border"
                      >
                        View all results for "{debouncedQuery}"
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
