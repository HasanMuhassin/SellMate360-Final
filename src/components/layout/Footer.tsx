import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Youtube } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePublicCompany } from '@/hooks/usePublicStoreSettings';
import { usePublicCMSPages } from '@/hooks/usePublicCMS';

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/shop' },
    { name: 'Best Sellers', href: '/shop?filter=best-sellers' },
    { name: 'New Arrivals', href: '/shop?filter=new' },
    { name: 'Categories', href: '/categories' },
  ],
  support: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'Track Order', href: '/track-order' },
    { name: 'Returns & Refunds', href: '/returns' },
    { name: 'FAQ', href: '/faq' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Delivery Info', href: '/delivery-info' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms & Conditions', href: '/terms' },
  ],
};

export default function Footer() {
  const { company } = usePublicCompany();
  const { data: cmsPages = [] } = usePublicCMSPages();

  const companyName = company?.name || 'SellMate360';
  const companyEmail = company?.email || 'support@sellmate360.lk';
  const companyPhone = company?.phone || '+94 11 234 5678';
  const companyCity = company?.city || 'Colombo';
  const companyCountry = company?.country || 'Sri Lanka';
  const logoUrl = company?.logo;

  const socialLinks = [
    { url: company?.social_facebook, icon: Facebook },
    { url: company?.social_instagram, icon: Instagram },
    { url: company?.social_twitter, icon: Twitter },
    { url: company?.social_youtube, icon: Youtube },
  ].filter(s => s.url);

  return (
    <footer className="bg-foreground text-background">
      {/* Newsletter Section */}
      <div className="border-b border-background/10">
        <div className="container py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-1">Subscribe to our Newsletter</h3>
              <p className="text-background/70 text-sm">
                Get updates on new products, exclusive deals, and more!
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-background/10 border-background/20 text-background placeholder:text-background/50 min-w-[250px]"
              />
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={companyName} className="h-10 w-10 rounded-lg object-contain" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <span className="text-xl font-bold text-primary-foreground">{companyName.charAt(0)}</span>
                </div>
              )}
              <span className="text-2xl font-bold text-background">
                {companyName.includes('SellMate') ? (
                  <>SellMate<span className="text-primary">360</span></>
                ) : (
                  companyName
                )}
              </span>
            </Link>
            <p className="text-background/70 text-sm mb-6 max-w-sm">
              Your trusted e-commerce partner for quality products with island-wide 
              delivery. Shop with confidence!
            </p>
            <div className="flex items-center gap-4">
              {socialLinks.length > 0 ? (
                socialLinks.map((social, i) => (
                  <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="text-background/70 hover:text-primary transition-colors">
                    <social.icon className="h-5 w-5" />
                  </a>
                ))
              ) : (
                <>
                  <a href="#" className="text-background/70 hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
                  <a href="#" className="text-background/70 hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
                  <a href="#" className="text-background/70 hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
                </>
              )}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-background/70 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-background/70 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-background/70 hover:text-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
              {/* Dynamic CMS pages marked show_in_footer */}
              {cmsPages
                .filter((p) => p.show_in_footer)
                .map((p) => (
                  <li key={p.id}>
                    <Link to={`/pages/${p.slug}`} className="text-sm text-background/70 hover:text-primary transition-colors">
                      {p.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-10 pt-8 border-t border-background/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-background/70">
              <a href={`tel:${companyPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Phone className="h-4 w-4" />
                {companyPhone}
              </a>
              <a href={`mailto:${companyEmail}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                <Mail className="h-4 w-4" />
                {companyEmail}
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {companyCity}, {companyCountry}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container py-4">
          <p className="text-center text-xs text-background/50">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
