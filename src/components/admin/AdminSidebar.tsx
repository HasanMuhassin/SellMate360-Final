import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Monitor,
  Truck,
  CreditCard,
  Users,
  UserCircle,
  Megaphone,
  FileText,
  BarChart3,
  Settings,
  Shield,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface NavItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { title: string; href: string }[];
}

const navigation: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  {
    title: 'Catalog',
    icon: Package,
    children: [
      { title: 'Products', href: '/admin/catalog/products' },
      { title: 'Categories', href: '/admin/catalog/categories' },
      { title: 'Brands', href: '/admin/catalog/brands' },
      { title: 'Attributes', href: '/admin/catalog/attributes' },
      { title: 'Media Library', href: '/admin/catalog/media' },
    ],
  },
  {
    title: 'Inventory',
    icon: Warehouse,
    children: [
      { title: 'Overview', href: '/admin/inventory' },
      { title: 'Stock Ledger', href: '/admin/inventory/ledger' },
      { title: 'Adjustments', href: '/admin/inventory/adjustments' },
      { title: 'Transfers', href: '/admin/inventory/transfers' },
      { title: 'Suppliers', href: '/admin/inventory/suppliers' },
    ],
  },
  {
    title: 'Orders',
    icon: ShoppingCart,
    children: [
      { title: 'All Orders', href: '/admin/orders' },
      { title: 'Pending', href: '/admin/orders/pending' },
      { title: 'Processing', href: '/admin/orders/processing' },
      { title: 'Completed', href: '/admin/orders/completed' },
    ],
  },
  {
    title: 'POS',
    icon: Monitor,
    children: [
      { title: 'New Sale', href: '/admin/pos/new' },
      { title: 'POS Orders', href: '/admin/pos' },
      { title: 'Cashier Shifts', href: '/admin/pos/shifts' },
      { title: 'Returns', href: '/admin/pos/returns' },
    ],
  },
  {
    title: 'Shipping',
    icon: Truck,
    children: [
      { title: 'Shipments', href: '/admin/shipping' },
      { title: 'Create Shipment', href: '/admin/shipping/create' },
      { title: 'Courier Partners', href: '/admin/shipping/couriers' },
      { title: 'Delivery Zones', href: '/admin/shipping/zones' },
    ],
  },
  {
    title: 'Payments',
    icon: CreditCard,
    children: [
      { title: 'Transactions', href: '/admin/payments' },
      { title: 'COD Collections', href: '/admin/payments/cod' },
      { title: 'Bank Deposits', href: '/admin/payments/bank' },
      { title: 'Refunds', href: '/admin/payments/refunds' },
    ],
  },
  {
    title: 'Resellers',
    icon: Users,
    children: [
      { title: 'Reseller List', href: '/admin/resellers' },
      { title: 'Tiers & Pricing', href: '/admin/resellers/tiers' },
      { title: 'Orders', href: '/admin/resellers/orders' },
      { title: 'Payouts', href: '/admin/resellers/payouts' },
    ],
  },
  {
    title: 'Customers',
    icon: UserCircle,
    children: [
      { title: 'Customer List', href: '/admin/customers' },
      { title: 'Support Tickets', href: '/admin/customers/tickets' },
    ],
  },
  {
    title: 'Promotions',
    icon: Megaphone,
    children: [
      { title: 'Coupons', href: '/admin/promotions/coupons' },
      { title: 'Discounts', href: '/admin/promotions/discounts' },
      { title: 'Banners', href: '/admin/promotions/banners' },
      { title: 'Flash Sales', href: '/admin/promotions/flash-sales' },
    ],
  },
  {
    title: 'Content',
    icon: FileText,
    children: [
      { title: 'Pages', href: '/admin/content/pages' },
      { title: 'SEO', href: '/admin/content/seo' },
      { title: 'Announcements', href: '/admin/content/announcements' },
      { title: 'FAQ Management', href: '/admin/content/faqs' },
    ],
  },
  {
    title: 'Reports',
    icon: BarChart3,
    children: [
      { title: 'Sales Report', href: '/admin/reports/sales' },
      { title: 'Products', href: '/admin/reports/products' },
      { title: 'Inventory', href: '/admin/reports/inventory' },
      { title: 'Resellers', href: '/admin/reports/resellers' },
      { title: 'Payments', href: '/admin/reports/payments' },
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    children: [
      { title: 'Company', href: '/admin/settings/company' },
      { title: 'Users & Roles', href: '/admin/settings/users' },
      { title: 'Branches', href: '/admin/settings/branches' },
      { title: 'Notifications', href: '/admin/settings/notifications' },
      { title: 'Payments', href: '/admin/settings/payments' },
      { title: 'Tax & VAT', href: '/admin/settings/tax' },
      { title: 'Integrations', href: '/admin/settings/integrations' },
    ],
  },
  {
    title: 'Security',
    icon: Shield,
    children: [
      { title: 'Audit Logs', href: '/admin/security/audit' },
      { title: 'Login History', href: '/admin/security/logins' },
      { title: 'Role Changes', href: '/admin/security/roles' },
    ],
  },
];

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['Catalog']);
  const location = useLocation();

  const toggleGroup = (title: string) => {
    setOpenGroups(prev =>
      prev.includes(title)
        ? prev.filter(g => g !== title)
        : [...prev, title]
    );
  };

  const isActiveGroup = (item: NavItem) => {
    if (item.children) {
      return item.children.some(child => location.pathname.startsWith(child.href));
    }
    return location.pathname === item.href;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              S
            </div>
            <span className="font-semibold text-foreground">SellMate360</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="h-[calc(100vh-4rem)] py-4">
        <nav className="space-y-1 px-2">
          {navigation.map(item => {
            const Icon = item.icon;
            const isActive = isActiveGroup(item);
            const isOpen = openGroups.includes(item.title);

            if (item.children) {
              return (
                <Collapsible
                  key={item.title}
                  open={!collapsed && isOpen}
                  onOpenChange={() => toggleGroup(item.title)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.title}</span>
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </>
                      )}
                    </button>
                  </CollapsibleTrigger>
                  {!collapsed && (
                    <CollapsibleContent className="space-y-1 pl-8 pt-1">
                      {item.children.map(child => (
                        <NavLink
                          key={child.href}
                          to={child.href}
                          className={({ isActive }) =>
                            cn(
                              'block rounded-lg px-3 py-2 text-sm transition-colors',
                              isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )
                          }
                        >
                          {child.title}
                        </NavLink>
                      ))}
                    </CollapsibleContent>
                  )}
                </Collapsible>
              );
            }

            return (
              <NavLink
                key={item.title}
                to={item.href!}
                end
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
