// Content Management Mock Data

export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  showInFooter: boolean;
  showInMenu: boolean;
  menuPosition: number;
  status: 'published' | 'draft';
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SEOSettings {
  id: string;
  pageType: 'home' | 'shop' | 'product' | 'category' | 'checkout' | 'custom';
  pageName: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
  robotsDirective: 'index,follow' | 'noindex,follow' | 'index,nofollow' | 'noindex,nofollow';
  structuredData: string;
  updatedAt: Date;
}

export interface Announcement {
  id: string;
  message: string;
  link: string | null;
  linkText: string | null;
  backgroundColor: string;
  textColor: string;
  position: 'top' | 'bottom';
  showCloseButton: boolean;
  startsAt: Date;
  endsAt: Date | null;
  isActive: boolean;
  priority: number;
  targetPages: string[];
  createdAt: Date;
}

export const mockCMSPages: CMSPage[] = [
  {
    id: 'page-1',
    title: 'About Us',
    slug: 'about',
    content: '<h1>About SellMate360</h1><p>We are a leading e-commerce platform...</p>',
    metaTitle: 'About Us - SellMate360',
    metaDescription: 'Learn about SellMate360, your trusted online shopping destination in Sri Lanka.',
    metaKeywords: 'about us, sellmate360, online shopping, sri lanka',
    showInFooter: true,
    showInMenu: true,
    menuPosition: 1,
    status: 'published',
    publishedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'page-2',
    title: 'Contact Us',
    slug: 'contact',
    content: '<h1>Contact Us</h1><p>Get in touch with our team...</p>',
    metaTitle: 'Contact Us - SellMate360',
    metaDescription: 'Contact SellMate360 customer support. We are here to help!',
    metaKeywords: 'contact, support, customer service, sellmate360',
    showInFooter: true,
    showInMenu: true,
    menuPosition: 2,
    status: 'published',
    publishedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'page-3',
    title: 'Delivery Information',
    slug: 'delivery',
    content: '<h1>Delivery Information</h1><p>We deliver island-wide...</p>',
    metaTitle: 'Delivery Information - SellMate360',
    metaDescription: 'Learn about our delivery options, zones, and timeframes.',
    metaKeywords: 'delivery, shipping, delivery zones, sri lanka delivery',
    showInFooter: true,
    showInMenu: false,
    menuPosition: 0,
    status: 'published',
    publishedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: 'page-4',
    title: 'Returns & Refunds',
    slug: 'returns',
    content: '<h1>Returns & Refunds Policy</h1><p>We want you to be satisfied...</p>',
    metaTitle: 'Returns & Refunds - SellMate360',
    metaDescription: 'Our returns and refunds policy. Easy returns within 7 days.',
    metaKeywords: 'returns, refunds, return policy, exchange',
    showInFooter: true,
    showInMenu: false,
    menuPosition: 0,
    status: 'published',
    publishedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: 'page-5',
    title: 'Privacy Policy',
    slug: 'privacy',
    content: '<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>',
    metaTitle: 'Privacy Policy - SellMate360',
    metaDescription: 'Read our privacy policy to understand how we protect your data.',
    metaKeywords: 'privacy, data protection, privacy policy',
    showInFooter: true,
    showInMenu: false,
    menuPosition: 0,
    status: 'published',
    publishedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: 'page-6',
    title: 'Terms & Conditions',
    slug: 'terms',
    content: '<h1>Terms & Conditions</h1><p>By using our website...</p>',
    metaTitle: 'Terms & Conditions - SellMate360',
    metaDescription: 'Read our terms and conditions for using SellMate360.',
    metaKeywords: 'terms, conditions, legal, terms of service',
    showInFooter: true,
    showInMenu: false,
    menuPosition: 0,
    status: 'published',
    publishedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: 'page-7',
    title: 'Become a Reseller',
    slug: 'reseller-program',
    content: '<h1>Join Our Reseller Program</h1><p>Start your business with us...</p>',
    metaTitle: 'Become a Reseller - SellMate360',
    metaDescription: 'Join our reseller program and start earning. Low investment, high returns.',
    metaKeywords: 'reseller, business opportunity, dropshipping, wholesale',
    showInFooter: false,
    showInMenu: true,
    menuPosition: 3,
    status: 'draft',
    publishedAt: null,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05'),
  },
];

export const mockSEOSettings: SEOSettings[] = [
  {
    id: 'seo-1',
    pageType: 'home',
    pageName: 'Homepage',
    metaTitle: 'SellMate360 - Your Trusted Online Shopping Destination',
    metaDescription: 'Shop electronics, fashion, home appliances and more at SellMate360. COD available island-wide. Fast delivery across Sri Lanka.',
    metaKeywords: 'online shopping, sri lanka, electronics, fashion, home appliances, cod',
    ogTitle: 'SellMate360 - Shop Smart, Live Better',
    ogDescription: 'Discover amazing deals on electronics, fashion, and home essentials. Free delivery on orders above Rs.5,000!',
    ogImage: '/og-image-home.jpg',
    canonicalUrl: 'https://sellmate360.lk',
    robotsDirective: 'index,follow',
    structuredData: '{"@context":"https://schema.org","@type":"WebSite","name":"SellMate360"}',
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'seo-2',
    pageType: 'shop',
    pageName: 'Shop / Products',
    metaTitle: 'Shop All Products - SellMate360',
    metaDescription: 'Browse our wide selection of products. Electronics, fashion, home appliances and more at competitive prices.',
    metaKeywords: 'products, shop, buy online, electronics, fashion',
    ogTitle: 'Shop All Products - SellMate360',
    ogDescription: 'Find everything you need at SellMate360. Quality products, great prices.',
    ogImage: '/og-image-shop.jpg',
    canonicalUrl: 'https://sellmate360.lk/shop',
    robotsDirective: 'index,follow',
    structuredData: '{"@context":"https://schema.org","@type":"CollectionPage"}',
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'seo-3',
    pageType: 'product',
    pageName: 'Product Detail (Template)',
    metaTitle: '{product_name} - Buy Online at SellMate360',
    metaDescription: '{product_name} available at best price. {short_description}. COD available.',
    metaKeywords: '{product_name}, buy {product_name}, {category}',
    ogTitle: '{product_name} - SellMate360',
    ogDescription: 'Buy {product_name} online. {short_description}',
    ogImage: '{product_image}',
    canonicalUrl: 'https://sellmate360.lk/product/{slug}',
    robotsDirective: 'index,follow',
    structuredData: '{"@context":"https://schema.org","@type":"Product"}',
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'seo-4',
    pageType: 'category',
    pageName: 'Category Page (Template)',
    metaTitle: '{category_name} - Shop Online at SellMate360',
    metaDescription: 'Browse {category_name} at SellMate360. Wide selection, competitive prices, COD available.',
    metaKeywords: '{category_name}, buy {category_name}, {category_name} online',
    ogTitle: '{category_name} - SellMate360',
    ogDescription: 'Shop {category_name} online at SellMate360',
    ogImage: '{category_image}',
    canonicalUrl: 'https://sellmate360.lk/category/{slug}',
    robotsDirective: 'index,follow',
    structuredData: '{"@context":"https://schema.org","@type":"CollectionPage"}',
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'seo-5',
    pageType: 'checkout',
    pageName: 'Checkout',
    metaTitle: 'Checkout - SellMate360',
    metaDescription: 'Complete your purchase securely at SellMate360.',
    metaKeywords: 'checkout, payment, secure checkout',
    ogTitle: 'Checkout - SellMate360',
    ogDescription: 'Secure checkout at SellMate360',
    ogImage: '/og-image-checkout.jpg',
    canonicalUrl: 'https://sellmate360.lk/checkout',
    robotsDirective: 'noindex,nofollow',
    structuredData: '',
    updatedAt: new Date('2024-01-20'),
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    message: '🎉 Free delivery on all orders above Rs.5,000! Limited time offer.',
    link: '/shop',
    linkText: 'Shop Now',
    backgroundColor: 'hsl(var(--primary))',
    textColor: 'hsl(var(--primary-foreground))',
    position: 'top',
    showCloseButton: true,
    startsAt: new Date('2024-01-01'),
    endsAt: new Date('2024-12-31'),
    isActive: true,
    priority: 1,
    targetPages: ['all'],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'ann-2',
    message: '⚡ Flash Sale: Up to 50% off on Electronics! Ends in 24 hours.',
    link: '/shop?category=electronics',
    linkText: 'View Deals',
    backgroundColor: 'hsl(25 95% 53%)',
    textColor: 'hsl(0 0% 100%)',
    position: 'top',
    showCloseButton: true,
    startsAt: new Date('2024-02-01'),
    endsAt: new Date('2024-02-02'),
    isActive: false,
    priority: 2,
    targetPages: ['home', 'shop'],
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'ann-3',
    message: '🛒 New Year Sale is LIVE! Don\'t miss amazing discounts.',
    link: '/promotions/new-year',
    linkText: 'Explore',
    backgroundColor: 'hsl(142 76% 36%)',
    textColor: 'hsl(0 0% 100%)',
    position: 'top',
    showCloseButton: false,
    startsAt: new Date('2024-01-01'),
    endsAt: new Date('2024-01-15'),
    isActive: false,
    priority: 3,
    targetPages: ['all'],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'ann-4',
    message: '📦 COD available island-wide! Order now, pay on delivery.',
    link: '/delivery',
    linkText: 'Learn More',
    backgroundColor: 'hsl(221 83% 53%)',
    textColor: 'hsl(0 0% 100%)',
    position: 'bottom',
    showCloseButton: true,
    startsAt: new Date('2024-01-01'),
    endsAt: null,
    isActive: true,
    priority: 5,
    targetPages: ['checkout', 'cart'],
    createdAt: new Date('2024-01-01'),
  },
];
