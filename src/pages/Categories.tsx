import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useStorefrontCategories } from '@/hooks/useStorefront';
import { Skeleton } from '@/components/ui/skeleton';
import CategoryCard from '@/components/products/CategoryCard';

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useStorefrontCategories();

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-muted/50 py-4 shadow-sm border-b">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Categories</span>
          </nav>
        </div>
      </div>

      <div className="container py-12">
        <div className="max-w-2xl mb-12">
          <h1 className="text-4xl font-bold mb-4">Shop by Category</h1>
          <p className="text-muted-foreground text-lg">
            Explore our wide range of products organized by category to find exactly what you need.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {categories.map((category, index) => (
              <CategoryCard 
                key={category.id} 
                category={category} 
                index={index} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
