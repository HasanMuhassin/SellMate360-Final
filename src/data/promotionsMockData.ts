// Promotions Module Mock Data

export interface ExtendedCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usagePerUser: number;
  usedCount: number;
  validFrom: Date;
  validTo: Date;
  applicableCategories: string[];
  applicableProducts: string[];
  excludedProducts: string[];
  firstOrderOnly: boolean;
  resellerOnly: boolean;
  status: 'active' | 'inactive' | 'expired';
  description: string;
  createdBy: string;
  createdAt: Date;
}

export interface DiscountRule {
  id: string;
  name: string;
  type: 'bulk' | 'bundle' | 'tiered' | 'bogo';
  description: string;
  conditions: {
    minQuantity?: number;
    minAmount?: number;
    productIds?: string[];
    categoryIds?: string[];
  };
  discount: {
    type: 'percentage' | 'fixed' | 'free_item';
    value: number;
    maxDiscount?: number;
  };
  stackable: boolean;
  priority: number;
  status: 'active' | 'inactive';
  validFrom: Date;
  validTo: Date;
  usageCount: number;
  createdAt: Date;
}

export interface FlashSale {
  id: string;
  name: string;
  slug: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicableCategories: string[];
  applicableProducts: string[];
  startsAt: Date;
  endsAt: Date;
  bannerImage: string | null;
  badgeText: string;
  badgeColor: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  productsSold: number;
  revenue: number;
  createdBy: string;
  createdAt: Date;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  mobileImage: string | null;
  link: string | null;
  position: number;
  placement: 'hero' | 'sidebar' | 'popup' | 'footer';
  status: 'active' | 'inactive' | 'scheduled';
  validFrom: Date | null;
  validTo: Date | null;
  clicks: number;
  impressions: number;
  createdAt: Date;
}

// Mock Coupons
export const mockExtendedCoupons: ExtendedCoupon[] = [
  {
    id: 'c1',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minOrder: 5000,
    maxDiscount: 1000,
    usageLimit: 100,
    usagePerUser: 1,
    usedCount: 45,
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-12-31'),
    applicableCategories: [],
    applicableProducts: [],
    excludedProducts: [],
    firstOrderOnly: true,
    resellerOnly: false,
    status: 'active',
    description: 'Welcome discount for new customers',
    createdBy: 'Admin',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'c2',
    code: 'FLAT500',
    type: 'fixed',
    value: 500,
    minOrder: 3000,
    maxDiscount: null,
    usageLimit: 50,
    usagePerUser: 1,
    usedCount: 50,
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-06-30'),
    applicableCategories: [],
    applicableProducts: [],
    excludedProducts: [],
    firstOrderOnly: false,
    resellerOnly: false,
    status: 'expired',
    description: 'Flat Rs. 500 off on orders above Rs. 3000',
    createdBy: 'Admin',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'c3',
    code: 'RESELLER15',
    type: 'percentage',
    value: 15,
    minOrder: 10000,
    maxDiscount: 2500,
    usageLimit: null,
    usagePerUser: 5,
    usedCount: 234,
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-12-31'),
    applicableCategories: [],
    applicableProducts: [],
    excludedProducts: [],
    firstOrderOnly: false,
    resellerOnly: true,
    status: 'active',
    description: 'Exclusive discount for resellers',
    createdBy: 'Admin',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'c4',
    code: 'ELECTRONICS20',
    type: 'percentage',
    value: 20,
    minOrder: 8000,
    maxDiscount: 3000,
    usageLimit: 200,
    usagePerUser: 2,
    usedCount: 89,
    validFrom: new Date('2024-06-01'),
    validTo: new Date('2024-08-31'),
    applicableCategories: ['Electronics'],
    applicableProducts: [],
    excludedProducts: [],
    firstOrderOnly: false,
    resellerOnly: false,
    status: 'active',
    description: '20% off on Electronics category',
    createdBy: 'Marketing',
    createdAt: new Date('2024-05-15'),
  },
  {
    id: 'c5',
    code: 'SUMMER25',
    type: 'percentage',
    value: 25,
    minOrder: 15000,
    maxDiscount: 5000,
    usageLimit: 500,
    usagePerUser: 1,
    usedCount: 312,
    validFrom: new Date('2024-06-01'),
    validTo: new Date('2024-08-31'),
    applicableCategories: [],
    applicableProducts: [],
    excludedProducts: [],
    firstOrderOnly: false,
    resellerOnly: false,
    status: 'inactive',
    description: 'Summer sale discount',
    createdBy: 'Admin',
    createdAt: new Date('2024-05-20'),
  },
];

// Mock Discount Rules
export const mockDiscountRules: DiscountRule[] = [
  {
    id: 'dr1',
    name: 'Buy 3 Get 10% Off',
    type: 'bulk',
    description: 'Get 10% discount when purchasing 3 or more items',
    conditions: {
      minQuantity: 3,
    },
    discount: {
      type: 'percentage',
      value: 10,
      maxDiscount: 2000,
    },
    stackable: false,
    priority: 1,
    status: 'active',
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-12-31'),
    usageCount: 456,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'dr2',
    name: 'Electronics Bundle Deal',
    type: 'bundle',
    description: 'Buy any phone with accessories and get 15% off on accessories',
    conditions: {
      categoryIds: ['Electronics', 'Accessories'],
      minQuantity: 2,
    },
    discount: {
      type: 'percentage',
      value: 15,
    },
    stackable: true,
    priority: 2,
    status: 'active',
    validFrom: new Date('2024-03-01'),
    validTo: new Date('2024-12-31'),
    usageCount: 123,
    createdAt: new Date('2024-03-01'),
  },
  {
    id: 'dr3',
    name: 'Tiered Discount - Spend More Save More',
    type: 'tiered',
    description: 'Rs. 500 off on Rs. 5000+, Rs. 1500 off on Rs. 15000+, Rs. 3000 off on Rs. 30000+',
    conditions: {
      minAmount: 5000,
    },
    discount: {
      type: 'fixed',
      value: 500,
    },
    stackable: false,
    priority: 3,
    status: 'active',
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2024-12-31'),
    usageCount: 789,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'dr4',
    name: 'Buy 1 Get 1 Free - Selected Items',
    type: 'bogo',
    description: 'Buy one get one free on selected kitchen items',
    conditions: {
      categoryIds: ['Kitchenware'],
      minQuantity: 2,
    },
    discount: {
      type: 'free_item',
      value: 1,
    },
    stackable: false,
    priority: 1,
    status: 'inactive',
    validFrom: new Date('2024-04-01'),
    validTo: new Date('2024-04-30'),
    usageCount: 56,
    createdAt: new Date('2024-03-25'),
  },
];

// Mock Flash Sales
export const mockFlashSales: FlashSale[] = [
  {
    id: 'fs1',
    name: 'Midnight Madness',
    slug: 'midnight-madness',
    description: 'Exclusive discounts from midnight to 6 AM',
    discountType: 'percentage',
    discountValue: 30,
    applicableCategories: ['Electronics'],
    applicableProducts: [],
    startsAt: new Date('2024-07-15T00:00:00'),
    endsAt: new Date('2024-07-15T06:00:00'),
    bannerImage: '/placeholder.svg',
    badgeText: '30% OFF',
    badgeColor: 'red',
    status: 'ended',
    productsSold: 234,
    revenue: 456000,
    createdBy: 'Marketing',
    createdAt: new Date('2024-07-10'),
  },
  {
    id: 'fs2',
    name: 'Weekend Special',
    slug: 'weekend-special',
    description: 'Special weekend discounts on home appliances',
    discountType: 'percentage',
    discountValue: 25,
    applicableCategories: ['Home Appliances'],
    applicableProducts: [],
    startsAt: new Date('2024-07-20T00:00:00'),
    endsAt: new Date('2024-07-21T23:59:59'),
    bannerImage: '/placeholder.svg',
    badgeText: 'WEEKEND DEAL',
    badgeColor: 'blue',
    status: 'scheduled',
    productsSold: 0,
    revenue: 0,
    createdBy: 'Admin',
    createdAt: new Date('2024-07-15'),
  },
  {
    id: 'fs3',
    name: 'Flash Friday',
    slug: 'flash-friday',
    description: 'Every Friday flash deals',
    discountType: 'fixed',
    discountValue: 1000,
    applicableCategories: [],
    applicableProducts: [],
    startsAt: new Date('2024-07-19T09:00:00'),
    endsAt: new Date('2024-07-19T21:00:00'),
    bannerImage: '/placeholder.svg',
    badgeText: 'Rs. 1000 OFF',
    badgeColor: 'green',
    status: 'active',
    productsSold: 89,
    revenue: 178000,
    createdBy: 'Marketing',
    createdAt: new Date('2024-07-01'),
  },
  {
    id: 'fs4',
    name: 'Independence Day Sale',
    slug: 'independence-day-sale',
    description: 'Celebrate with massive discounts',
    discountType: 'percentage',
    discountValue: 40,
    applicableCategories: [],
    applicableProducts: [],
    startsAt: new Date('2024-08-01T00:00:00'),
    endsAt: new Date('2024-08-04T23:59:59'),
    bannerImage: '/placeholder.svg',
    badgeText: '40% OFF',
    badgeColor: 'orange',
    status: 'scheduled',
    productsSold: 0,
    revenue: 0,
    createdBy: 'Admin',
    createdAt: new Date('2024-07-20'),
  },
];

// Mock Banners
export const mockPromoBanners: PromoBanner[] = [
  {
    id: 'b1',
    title: 'New Arrivals',
    subtitle: 'Check out our latest products',
    image: '/placeholder.svg',
    mobileImage: null,
    link: '/shop?filter=new',
    position: 1,
    placement: 'hero',
    status: 'active',
    validFrom: null,
    validTo: null,
    clicks: 1234,
    impressions: 45678,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'b2',
    title: 'Summer Sale',
    subtitle: 'Up to 50% off on selected items',
    image: '/placeholder.svg',
    mobileImage: '/placeholder.svg',
    link: '/shop?filter=sale',
    position: 2,
    placement: 'hero',
    status: 'active',
    validFrom: new Date('2024-06-01'),
    validTo: new Date('2024-08-31'),
    clicks: 2345,
    impressions: 56789,
    createdAt: new Date('2024-05-15'),
  },
  {
    id: 'b3',
    title: 'Free Shipping',
    subtitle: 'On orders above Rs. 10,000',
    image: '/placeholder.svg',
    mobileImage: null,
    link: '/delivery-info',
    position: 1,
    placement: 'sidebar',
    status: 'active',
    validFrom: null,
    validTo: null,
    clicks: 567,
    impressions: 12345,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'b4',
    title: 'Newsletter Signup',
    subtitle: 'Get 10% off your first order',
    image: '/placeholder.svg',
    mobileImage: null,
    link: null,
    position: 1,
    placement: 'popup',
    status: 'inactive',
    validFrom: null,
    validTo: null,
    clicks: 890,
    impressions: 23456,
    createdAt: new Date('2024-01-15'),
  },
];

// Helper function to get coupon status color
export const getCouponStatusColor = (status: ExtendedCoupon['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'inactive':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'expired':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Helper function to get flash sale status color
export const getFlashSaleStatusColor = (status: FlashSale['status']) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'ended':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
