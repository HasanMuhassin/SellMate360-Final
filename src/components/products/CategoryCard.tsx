import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Category } from '@/types/store';

interface CategoryCardProps {
  category: Category;
  index?: number;
}

export default function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/shop?category=${category.slug}`}>
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border hover:border-primary/30 transition-all duration-300 aspect-[4/3] shadow-sm hover:shadow-md">
          {/* Category Image */}
          {category.image ? (
            <img 
              src={category.image} 
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
             <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <span className="text-2xl font-bold text-primary-foreground">
                    {category.name[0]}
                  </span>
                </div>
             </div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 transition-opacity duration-300" />
          
          <div className="absolute inset-0 flex items-end p-5">
            <div className="transform transition-transform duration-300">
              <h3 className="font-bold text-lg text-white group-hover:text-primary-foreground transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-white/80">
                {category.productCount} Products
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
