import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { SessionProvider } from "@/context/SessionContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import CategoriesPage from "./pages/Categories";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import TrackOrder from "./pages/TrackOrder";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Account from "./pages/Account";
import ResellerPortal from "./pages/ResellerPortal";
import ResellerLogin from "./pages/reseller/ResellerLogin";
import ResellerApply from "./pages/reseller/ResellerApply";
import AboutUs from "./pages/AboutUs";
import ContactUs from "./pages/ContactUs";
import DeliveryInfo from "./pages/DeliveryInfo";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import POSOrders from "./pages/admin/pos/POSOrders";
import CashierShifts from "./pages/admin/pos/CashierShifts";
import POSReturns from "./pages/admin/pos/POSReturns";
import NewSale from "./pages/admin/pos/NewSale";
import Transactions from "./pages/admin/payments/Transactions";
import CODCollections from "./pages/admin/payments/CODCollections";
import BankDeposits from "./pages/admin/payments/BankDeposits";
import Refunds from "./pages/admin/payments/Refunds";
import Products from "./pages/admin/catalog/Products";
import ProductForm from "./pages/admin/catalog/ProductForm";
import Categories from "./pages/admin/catalog/Categories";
import Brands from "./pages/admin/catalog/Brands";
import MediaLibrary from "./pages/admin/catalog/MediaLibrary";
import Attributes from "./pages/admin/catalog/Attributes";
import InventoryOverview from "./pages/admin/inventory/InventoryOverview";
import StockLedger from "./pages/admin/inventory/StockLedger";
import StockAdjustments from "./pages/admin/inventory/StockAdjustments";
import StockTransfers from "./pages/admin/inventory/StockTransfers";
import Suppliers from "./pages/admin/inventory/Suppliers";
import OrderList from "./pages/admin/orders/OrderList";
import OrderDetails from "./pages/admin/orders/OrderDetails";
import ShipmentList from "./pages/admin/shipping/ShipmentList";
import ShipmentDetails from "./pages/admin/shipping/ShipmentDetails";
import CreateShipment from "./pages/admin/shipping/CreateShipment";
import CourierPartners from "./pages/admin/shipping/CourierPartners";
import DeliveryZones from "./pages/admin/shipping/DeliveryZones";
import ResellerList from "./pages/admin/resellers/ResellerList";
import ResellerDetails from "./pages/admin/resellers/ResellerDetails";
import ResellerApplications from "./pages/admin/resellers/ResellerApplications";
import TierManagement from "./pages/admin/resellers/TierManagement";
import ResellerOrders from "./pages/admin/resellers/ResellerOrders";
import PayoutRequests from "./pages/admin/resellers/PayoutRequests";
import CustomerList from "./pages/admin/customers/CustomerList";
import CustomerDetails from "./pages/admin/customers/CustomerDetails";
import SupportTickets from "./pages/admin/customers/SupportTickets";
import Coupons from "./pages/admin/promotions/Coupons";
import Discounts from "./pages/admin/promotions/Discounts";
import Banners from "./pages/admin/promotions/Banners";
import FlashSales from "./pages/admin/promotions/FlashSales";
import CMSPages from "./pages/admin/content/CMSPages";
import SEOSettings from "./pages/admin/content/SEOSettings";
import Announcements from "./pages/admin/content/Announcements";
import SalesReport from "./pages/admin/reports/SalesReport";
import ProductsReport from "./pages/admin/reports/ProductsReport";
import InventoryReport from "./pages/admin/reports/InventoryReport";
import ResellersReport from "./pages/admin/reports/ResellersReport";
import PaymentsReport from "./pages/admin/reports/PaymentsReport";
import CompanySettings from "./pages/admin/settings/CompanySettings";
import UsersRoles from "./pages/admin/settings/UsersRoles";
import BranchesSettings from "./pages/admin/settings/BranchesSettings";
import NotificationSettings from "./pages/admin/settings/NotificationSettings";
import PaymentSettings from "./pages/admin/settings/PaymentSettings";
import TaxSettings from "./pages/admin/settings/TaxSettings";
import IntegrationSettings from "./pages/admin/settings/IntegrationSettings";
import ProfilePage from "./pages/admin/settings/ProfilePage";
import AuditLogs from "./pages/admin/security/AuditLogs";
import LoginHistory from "./pages/admin/security/LoginHistory";
import RoleChanges from "./pages/admin/security/RoleChanges";
import DatabaseTest from "./pages/DatabaseTest";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname.startsWith('/reseller') || location.pathname.startsWith('/admin');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SessionProvider>
      <TooltipProvider>
        <CartProvider>
          <AdminAuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/product/:slug" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/reseller" element={<ResellerPortal />} />
                  <Route path="/reseller/login" element={<ResellerLogin />} />
                  <Route path="/reseller/apply" element={<ResellerApply />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/contact" element={<ContactUs />} />
                  <Route path="/delivery" element={<DeliveryInfo />} />
                  <Route path="/returns" element={<ReturnsPolicy />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsConditions />} />
                  <Route path="/db-test" element={<DatabaseTest />} />
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    {/* Catalog Module */}
                    <Route path="catalog/products" element={<Products />} />
                    <Route path="catalog/products/new" element={<ProductForm />} />
                    <Route path="catalog/products/:id/edit" element={<ProductForm />} />
                    <Route path="catalog/categories" element={<Categories />} />
                    <Route path="catalog/brands" element={<Brands />} />
                    <Route path="catalog/media" element={<MediaLibrary />} />
                    <Route path="catalog/attributes" element={<Attributes />} />
                    {/* Inventory Module */}
                    <Route path="inventory" element={<InventoryOverview />} />
                    <Route path="inventory/ledger" element={<StockLedger />} />
                    <Route path="inventory/adjustments" element={<StockAdjustments />} />
                    <Route path="inventory/transfers" element={<StockTransfers />} />
                    <Route path="inventory/suppliers" element={<Suppliers />} />
                    {/* Orders Module */}
                    <Route path="orders" element={<OrderList />} />
                    <Route path="orders/pending" element={<OrderList />} />
                    <Route path="orders/processing" element={<OrderList />} />
                    <Route path="orders/completed" element={<OrderList />} />
                    <Route path="orders/:id" element={<OrderDetails />} />
                    {/* POS Module */}
                    <Route path="pos" element={<POSOrders />} />
                    <Route path="pos/new" element={<NewSale />} />
                    <Route path="pos/shifts" element={<CashierShifts />} />
                    <Route path="pos/returns" element={<POSReturns />} />
                    {/* Shipping Module */}
                    <Route path="shipping" element={<ShipmentList />} />
                    <Route path="shipping/create" element={<CreateShipment />} />
                    <Route path="shipping/couriers" element={<CourierPartners />} />
                    <Route path="shipping/zones" element={<DeliveryZones />} />
                    <Route path="shipping/:id" element={<ShipmentDetails />} />
                    {/* Payments Module */}
                    <Route path="payments" element={<Transactions />} />
                    <Route path="payments/cod" element={<CODCollections />} />
                    <Route path="payments/bank" element={<BankDeposits />} />
                    <Route path="payments/refunds" element={<Refunds />} />
                    {/* Resellers Module */}
                    <Route path="resellers" element={<ResellerList />} />
                    <Route path="resellers/applications" element={<ResellerApplications />} />
                    <Route path="resellers/tiers" element={<TierManagement />} />
                    <Route path="resellers/orders" element={<ResellerOrders />} />
                    <Route path="resellers/payouts" element={<PayoutRequests />} />
                    <Route path="resellers/:id" element={<ResellerDetails />} />
                    {/* Customers Module */}
                    <Route path="customers" element={<CustomerList />} />
                    <Route path="customers/:id" element={<CustomerDetails />} />
                    <Route path="customers/tickets" element={<SupportTickets />} />
                    {/* Promotions Module */}
                    <Route path="promotions/coupons" element={<Coupons />} />
                    <Route path="promotions/discounts" element={<Discounts />} />
                    <Route path="promotions/banners" element={<Banners />} />
                    <Route path="promotions/flash-sales" element={<FlashSales />} />
                    {/* Content Module */}
                    <Route path="content/pages" element={<CMSPages />} />
                    <Route path="content/seo" element={<SEOSettings />} />
                    <Route path="content/announcements" element={<Announcements />} />
                    {/* Reports Module */}
                    <Route path="reports/sales" element={<SalesReport />} />
                    <Route path="reports/products" element={<ProductsReport />} />
                    <Route path="reports/inventory" element={<InventoryReport />} />
                    <Route path="reports/resellers" element={<ResellersReport />} />
                    <Route path="reports/payments" element={<PaymentsReport />} />
                    {/* Settings Module */}
                    <Route path="settings/company" element={<CompanySettings />} />
                    <Route path="settings/users" element={<UsersRoles />} />
                    <Route path="settings/branches" element={<BranchesSettings />} />
                    <Route path="settings/notifications" element={<NotificationSettings />} />
                    <Route path="settings/payments" element={<PaymentSettings />} />
                    <Route path="settings/tax" element={<TaxSettings />} />
                    <Route path="settings/integrations" element={<IntegrationSettings />} />
                    <Route path="settings/profile" element={<ProfilePage />} />
                    {/* Security Module */}
                    <Route path="security/audit" element={<AuditLogs />} />
                    <Route path="security/logins" element={<LoginHistory />} />
                    <Route path="security/roles" element={<RoleChanges />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </AdminAuthProvider>
        </CartProvider>
      </TooltipProvider>
    </SessionProvider>
  </QueryClientProvider>
);

export default App;
