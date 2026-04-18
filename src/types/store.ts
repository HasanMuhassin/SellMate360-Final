export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  brand: string;
  stock: number;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  rating: number;
  reviewCount: number;
  features: string[];
  isBestSeller: boolean;
  isNew: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  status: 'confirmed' | 'packed' | 'shipped' | 'out-for-delivery' | 'delivered';
  customerInfo: {
    name: string;
    phone: string;
    email: string;
    address: {
      district: string;
      city: string;
      street: string;
      zipCode: string;
    };
  };
  paymentMethod: 'cod' | 'bank-deposit' | 'online';
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: Date;
  estimatedDelivery: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isReseller: boolean;
  addresses: Address[];
}

export interface Address {
  id: string;
  label: string;
  district: string;
  city: string;
  street: string;
  zipCode: string;
  isDefault: boolean;
}
