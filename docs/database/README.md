# SellMate360 Database Schema

This directory contains the complete database schema for the SellMate360 e-commerce platform.

## Migration Files

Execute these files **in order** when setting up the database:

| File | Description |
|------|-------------|
| `001_enums_and_types.sql` | All custom PostgreSQL enums and types |
| `002_auth_users.sql` | User roles, profiles, addresses, audit logs |
| `003_catalog.sql` | Categories, brands, products, product images |
| `004_inventory.sql` | Suppliers, stock movements, purchase orders |
| `005_customers_orders.sql` | Customers, orders, order items, timeline |
| `006_pos.sql` | Cashier shifts, POS transactions, returns |
| `007_shipping.sql` | Courier partners, shipments, tracking, zones |
| `008_payments.sql` | Payment transactions, COD, refunds, settlements |
| `009_resellers.sql` | Resellers, reseller orders, payouts, ledger |
| `010_promotions.sql` | Coupons, coupon usage, promotions/flash sales |
| `011_content.sql` | Banners, CMS pages, FAQs, notifications, branches |
| `012_security_rls.sql` | Security functions and RLS policies |

## Table Summary

### Core (8 tables)
- `user_roles` - Role-based access control
- `profiles` - User profile information
- `addresses` - User delivery addresses
- `audit_logs` - System audit trail
- `login_attempts` - Security tracking

### Catalog (4 tables)
- `categories` - Product categories (hierarchical)
- `brands` - Product brands
- `products` - Main product catalog
- `product_images` - Product image gallery

### Inventory (4 tables)
- `suppliers` - Supplier management
- `stock_movements` - Stock in/out/adjustments
- `purchase_orders` - Supplier orders
- `purchase_order_items` - PO line items

### Orders (5 tables)
- `customers` - Customer records
- `customer_addresses` - Customer addresses
- `orders` - Order headers
- `order_items` - Order line items
- `order_timeline` - Order status history

### POS (5 tables)
- `cashier_shifts` - Shift management
- `pos_transactions` - POS sales
- `pos_transaction_items` - POS line items
- `pos_returns` - Return requests
- `pos_return_items` - Return line items

### Shipping (4 tables)
- `courier_partners` - Courier integrations
- `shipments` - Shipment tracking
- `shipment_tracking` - Tracking history
- `delivery_zones` - Delivery rate zones

### Payments (4 tables)
- `payment_transactions` - Payment records
- `cod_collections` - COD tracking
- `refund_requests` - Refund management
- `daily_settlements` - Daily reconciliation

### Resellers (5 tables)
- `resellers` - Reseller accounts
- `reseller_orders` - Reseller order tracking
- `payout_requests` - Withdrawal requests
- `reseller_ledger` - Profit/payout ledger
- `reseller_tier_benefits` - Tier configuration

### Promotions (3 tables)
- `coupons` - Discount coupons
- `coupon_usage` - Coupon redemption tracking
- `promotions` - Flash sales/promotions

### Content (7 tables)
- `banners` - Homepage/promotional banners
- `cms_pages` - Static content pages
- `faq_categories` - FAQ organization
- `faqs` - FAQ items
- `notification_templates` - Message templates
- `branches` - Store/warehouse locations
- `media` - Media library

## Security

All tables have Row Level Security (RLS) enabled with appropriate policies:

- **Public data**: Categories, brands, products (active only)
- **User data**: Profiles, addresses (own only)
- **Staff data**: Orders, inventory, POS (role-based)
- **Admin data**: User roles, audit logs, settings

## Key Features

### Auto-generated Fields
- Order numbers: `ORD-000001` or `POS-000001`
- Receipt numbers: `RCP-20240121-0001`
- Return numbers: `RET-000001`
- Purchase order numbers: `PO-000001`

### Automatic Triggers
- Profile creation on signup
- Stock status updates
- Order status timeline
- Customer statistics
- Shift sales totals
- Reseller balance updates

### Helper Functions
- `has_role(user_id, role)` - Check user role
- `is_admin_or_manager(user_id)` - Admin check
- `is_staff(user_id)` - Any staff role
- `is_reseller(user_id)` - Approved reseller
- `validate_coupon(code, user_id, total)` - Coupon validation

## Notes

1. All monetary values use `DECIMAL(12, 2)` for precision
2. All dates use `TIMESTAMPTZ` for timezone awareness
3. JSONB used for flexible data (features, dimensions, hours)
4. Arrays used for tags, zones, and notes
5. Soft deletes not implemented - use status fields instead
