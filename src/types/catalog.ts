// Catalog Module Types

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  productCount: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface ProductAttribute {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'color';
  options?: string[];
  required: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  costPrice: number;
  sellingPrice: number;
  resellerPrice: number;
  compareAtPrice?: number;
  stock: number;
  lowStockThreshold: number;
  status: 'active' | 'inactive' | 'draft';
  images: string[];
  thumbnail: string;
  description: string;
  shortDescription: string;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  variants?: ProductVariant[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithHierarchy {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
  parentName?: string;
  image?: string;
  description?: string;
  productCount: number;
  status: 'active' | 'inactive';
  position: number;
  createdAt: Date;
}
