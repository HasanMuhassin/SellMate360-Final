import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, User, Menu, X, LogOut, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CartDrawer from './CartDrawer';
import SearchOverlay from './SearchOverlay';
import { useSession, useSignOut } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { usePublicCompany } from '@/hooks/usePublicStoreSettings';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Shop', href: '/shop' },
  { name: 'Categories', href: '/categories' },
  { name: 'Best Sellers', href: '/shop?filter=best-sellers' },
  { name: 'New Arrivals', href: '/shop?filter=new' },
];

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { itemCount, toggleCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company } = usePublicCompany();
  
  const { session, user, loading: sessionLoading } = useSession();
  const signOut = useSignOut();

  const companyName = company?.name || 'SellMate360';
  const logoUrl = company?.logo;

  const handleSignOut = async () => {
    try {
      await signOut.mutateAsync();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* Top bar */}
      <div className="hidden md:block bg-primary text-primary-foreground">
        <div className="container flex h-8 items-center justify-between text-xs">
          <p>🚚 Island-wide Cash on Delivery Available</p>
          <div className="flex items-center gap-4">
            <Link to="/track-order" className="hover:underline">Track Order</Link>
            <Link to="/contact" className="hover:underline">Support</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile menu button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[350px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-lg font-medium transition-colors hover:text-primary ${
                      location.pathname === link.href ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="border-t pt-4 mt-4">
                  {session ? (
                    <div className="space-y-2">
                      <Link
                        to="/account"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 text-lg font-medium"
                      >
                        <User className="h-5 w-5" />
                        My Account
                      </Link>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleSignOut();
                        }}
                        className="flex items-center gap-2 text-lg font-medium text-destructive"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-lg font-medium"
                    >
                      <User className="h-5 w-5" />
                      Login / Register
                    </Link>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-9 w-9 rounded-lg object-contain" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                <span className="text-lg font-bold text-primary-foreground">
                  {companyName.charAt(0)}
                </span>
              </div>
            )}
            <span className="hidden sm:inline-block text-xl font-bold text-foreground">
              {companyName.includes('SellMate') ? (
                <>SellMate<span className="text-primary">360</span></>
              ) : (
                companyName
              )}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Search, Cart, User */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" onClick={toggleCart} className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                  {itemCount}
                </Badge>
              )}
            </Button>

            {sessionLoading ? (
              <Button variant="ghost" size="icon" className="hidden sm:flex" disabled>
                <Loader2 className="h-5 w-5 animate-spin" />
              </Button>
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hidden sm:flex">
                    <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-foreground">{userInitial}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    disabled={signOut.isPending}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    {signOut.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <CartDrawer />
      <AnimatePresence>
        {isSearchOpen && (
          <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        )}
      </AnimatePresence>
    </header>
  );
}
