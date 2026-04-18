import { Product, Category, CartItem } from '@/types/store';

// Product images
import earbudsImg from '@/assets/products/earbuds.jpg';
import airfryerImg from '@/assets/products/airfryer.jpg';
import powerbankImg from '@/assets/products/powerbank.jpg';
import cookwareImg from '@/assets/products/cookware.jpg';
import robotvacuumImg from '@/assets/products/robotvacuum.jpg';
import smartwatchImg from '@/assets/products/smartwatch.jpg';
import standmixerImg from '@/assets/products/standmixer.jpg';
import airconditionerImg from '@/assets/products/airconditioner.jpg';

// Category images
import electronicsImg from '@/assets/categories/electronics.jpg';
import kitchenwareImg from '@/assets/categories/kitchenware.jpg';
import homeAppliancesImg from '@/assets/categories/home-appliances.jpg';
import fashionImg from '@/assets/categories/fashion.jpg';
import beautyHealthImg from '@/assets/categories/beauty-health.jpg';
import sportsOutdoorsImg from '@/assets/categories/sports-outdoors.jpg';

export const categories: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', image: electronicsImg, productCount: 45 },
  { id: '2', name: 'Kitchenware', slug: 'kitchenware', image: kitchenwareImg, productCount: 32 },
  { id: '3', name: 'Home Appliances', slug: 'home-appliances', image: homeAppliancesImg, productCount: 28 },
  { id: '4', name: 'Fashion', slug: 'fashion', image: fashionImg, productCount: 56 },
  { id: '5', name: 'Beauty & Health', slug: 'beauty-health', image: beautyHealthImg, productCount: 41 },
  { id: '6', name: 'Sports & Outdoors', slug: 'sports-outdoors', image: sportsOutdoorsImg, productCount: 23 },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Earbuds Pro',
    slug: 'wireless-bluetooth-earbuds-pro',
    description: 'Premium wireless earbuds with active noise cancellation, 30-hour battery life, and crystal-clear sound quality.',
    price: 4999,
    originalPrice: 7999,
    images: [earbudsImg],
    category: 'electronics',
    brand: 'TechSound',
    stock: 45,
    stockStatus: 'in-stock',
    rating: 4.8,
    reviewCount: 234,
    features: ['Active Noise Cancellation', '30-hour Battery', 'IPX5 Water Resistant', 'Touch Controls'],
    isBestSeller: true,
    isNew: false,
  },
  {
    id: '2',
    name: 'Smart Air Fryer 5.5L Digital',
    slug: 'smart-air-fryer-digital',
    description: 'Large capacity digital air fryer with 8 preset cooking programs and easy-clean basket.',
    price: 12999,
    originalPrice: 16999,
    images: [airfryerImg],
    category: 'kitchenware',
    brand: 'CookMaster',
    stock: 12,
    stockStatus: 'in-stock',
    rating: 4.6,
    reviewCount: 156,
    features: ['5.5L Capacity', '8 Preset Programs', 'Digital Display', 'Easy Clean Basket'],
    isBestSeller: true,
    isNew: false,
  },
  {
    id: '3',
    name: 'Portable Power Bank 20000mAh',
    slug: 'portable-power-bank-20000mah',
    description: 'High-capacity power bank with fast charging support for all your devices.',
    price: 2499,
    originalPrice: 3499,
    images: [powerbankImg],
    category: 'electronics',
    brand: 'PowerMax',
    stock: 78,
    stockStatus: 'in-stock',
    rating: 4.5,
    reviewCount: 312,
    features: ['20000mAh Capacity', 'Fast Charging', 'Dual USB Ports', 'LED Indicator'],
    isBestSeller: false,
    isNew: true,
  },
  {
    id: '4',
    name: 'Premium Stainless Steel Cookware Set',
    slug: 'premium-stainless-steel-cookware',
    description: 'Complete 10-piece cookware set with triple-layer stainless steel construction.',
    price: 18999,
    originalPrice: 24999,
    images: [cookwareImg],
    category: 'kitchenware',
    brand: 'ChefPro',
    stock: 5,
    stockStatus: 'low-stock',
    rating: 4.9,
    reviewCount: 89,
    features: ['10-Piece Set', 'Triple-Layer Steel', 'Induction Compatible', 'Dishwasher Safe'],
    isBestSeller: false,
    isNew: true,
  },
  {
    id: '5',
    name: 'Smart Robot Vacuum Cleaner',
    slug: 'smart-robot-vacuum-cleaner',
    description: 'AI-powered robot vacuum with mapping technology and app control.',
    price: 29999,
    originalPrice: 39999,
    images: [robotvacuumImg],
    category: 'home-appliances',
    brand: 'CleanBot',
    stock: 8,
    stockStatus: 'in-stock',
    rating: 4.7,
    reviewCount: 178,
    features: ['AI Navigation', 'App Control', 'Auto Charging', '2-hour Runtime'],
    isBestSeller: true,
    isNew: false,
  },
  {
    id: '6',
    name: 'Fitness Smartwatch Pro',
    slug: 'fitness-smartwatch-pro',
    description: 'Advanced fitness tracking with heart rate monitor, GPS, and 7-day battery life.',
    price: 8999,
    originalPrice: 12999,
    images: [smartwatchImg],
    category: 'electronics',
    brand: 'FitTech',
    stock: 0,
    stockStatus: 'out-of-stock',
    rating: 4.4,
    reviewCount: 267,
    features: ['Heart Rate Monitor', 'Built-in GPS', '7-Day Battery', 'Water Resistant 50m'],
    isBestSeller: false,
    isNew: false,
  },
  {
    id: '7',
    name: 'Electric Stand Mixer 1000W',
    slug: 'electric-stand-mixer-1000w',
    description: 'Professional-grade stand mixer with 6-speed settings and 5L stainless steel bowl.',
    price: 15999,
    originalPrice: 19999,
    images: [standmixerImg],
    category: 'kitchenware',
    brand: 'BakePro',
    stock: 15,
    stockStatus: 'in-stock',
    rating: 4.8,
    reviewCount: 134,
    features: ['1000W Motor', '6 Speed Settings', '5L Bowl', 'Multiple Attachments'],
    isBestSeller: false,
    isNew: true,
  },
  {
    id: '8',
    name: 'Inverter Split AC 1.5 Ton',
    slug: 'inverter-split-ac-1-5-ton',
    description: 'Energy-efficient inverter air conditioner with fast cooling and low noise operation.',
    price: 54999,
    originalPrice: 64999,
    images: [airconditionerImg],
    category: 'home-appliances',
    brand: 'CoolAir',
    stock: 6,
    stockStatus: 'low-stock',
    rating: 4.6,
    reviewCount: 98,
    features: ['Inverter Technology', 'Fast Cooling', 'Low Noise', '5-Star Rating'],
    isBestSeller: true,
    isNew: false,
  },
];

export const banners = [
  {
    id: '1',
    title: 'Flash Sale Weekend',
    subtitle: 'Up to 50% OFF on Electronics',
    cta: 'Shop Now',
    link: '/shop?category=electronics',
  },
  {
    id: '2',
    title: 'New Kitchen Collection',
    subtitle: 'Transform your cooking experience',
    cta: 'Explore',
    link: '/shop?category=kitchenware',
  },
  {
    id: '3',
    title: 'Island-wide COD',
    subtitle: 'Cash on Delivery available everywhere',
    cta: 'Learn More',
    link: '/delivery-info',
  },
];
