// =====================================================
// SELLMATE360 DATABASE TYPES
// Auto-generated from database schema
// =====================================================

// =====================================================
// ENUMS
// =====================================================

export type AppRole = 'admin' | 'manager' | 'staff' | 'cashier';
export type EntityStatus = 'active' | 'inactive';
export type ApprovalStatus = 'pending' | 'approved' | 'blocked' | 'rejected';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'transfer';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
export type PaymentMethod = 'cod' | 'bank' | 'card' | 'online';
export type PaymentStatus = 'pending' | 'paid' | 'verified' | 'failed' | 'refunded';
export type OrderChannel = 'online' | 'pos';
export type RiskScore = 'low' | 'medium' | 'high';
export type ShipmentStatus = 'pending' | 'picked' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'returned' | 'failed';
export type ShiftStatus = 'open' | 'closed';
export type POSTransactionStatus = 'completed' | 'refunded' | 'partial_refund' | 'voided';
export type ReturnStatus = 'pending' | 'completed' | 'rejected';
export type RefundMethod = 'cash' | 'card' | 'store_credit' | 'original_method';
export type ResellerTier = 'silver' | 'gold' | 'platinum';
export type PayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected';
export type CODStatus = 'pending' | 'collected' | 'remitted' | 'rejected';
export type CouponType = 'percentage' | 'fixed';
export type CouponStatus = 'active' | 'inactive' | 'expired';
export type PageStatus = 'published' | 'draft';
export type BranchType = 'store' | 'warehouse';
export type NotificationType = 'whatsapp' | 'sms' | 'email';
export type AuditLevel = 'info' | 'warning' | 'critical';

// =====================================================
// AUTH & USERS
// =====================================================

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  is_reseller: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  district: string;
  city: string;
  street: string;
  zip_code: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  resource: string;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  level: AuditLevel;
  created_at: string;
}

export interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  failure_reason: string | null;
  created_at: string;
}

// =====================================================
// CATALOG
// =====================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  position: number;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;
  cost_price: number;
  selling_price: number;
  original_price: number | null;
  reseller_price: number | null;
  stock: number;
  low_stock_threshold: number;
  stock_status: StockStatus;
  rating: number;
  review_count: number;
  features: string[];
  is_bestseller: boolean;
  is_new: boolean;
  is_featured: boolean;
  status: EntityStatus;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category | null;
  brand?: Brand | null;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  position: number;
  is_primary: boolean;
  created_at: string;
}

// =====================================================
// INVENTORY
// =====================================================

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  contact_person: string | null;
  notes: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  reference: string | null;
  supplier_id: string | null;
  branch_id: string | null;
  created_by: string | null;
  created_at: string;
  // Relations
  product?: Product;
  supplier?: Supplier | null;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  expected_delivery: string | null;
  received_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total: number;
  received_quantity: number;
  created_at: string;
  // Relations
  product?: Product;
}

// =====================================================
// CUSTOMERS & ORDERS
// =====================================================

export interface Customer {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string;
  order_count: number;
  total_spent: number;
  cod_rejection_count: number;
  risk_score: RiskScore;
  notes: string[] | null;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  district: string;
  city: string;
  street: string;
  zip_code: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  reseller_id: string | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_email: string | null;
  shipping_district: string;
  shipping_city: string;
  shipping_street: string;
  shipping_zip_code: string | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  channel: OrderChannel;
  cod_risk: RiskScore;
  coupon_id: string | null;
  coupon_code: string | null;
  coupon_discount: number;
  notes: string[] | null;
  internal_notes: string[] | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  items?: OrderItem[];
  timeline?: OrderTimeline[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  created_at: string;
}

export interface OrderTimeline {
  id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

// =====================================================
// POS
// =====================================================

export interface CashierShift {
  id: string;
  cashier_id: string;
  branch_id: string | null;
  opening_balance: number;
  closing_balance: number | null;
  expected_balance: number | null;
  variance: number | null;
  cash_sales: number;
  card_sales: number;
  total_sales: number;
  transaction_count: number;
  refunds: number;
  status: ShiftStatus;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
}

export interface POSTransaction {
  id: string;
  receipt_number: string;
  shift_id: string;
  cashier_id: string;
  customer_id: string | null;
  order_id: string | null;
  subtotal: number;
  discount: number;
  discount_type: string | null;
  discount_value: number | null;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  cash_received: number | null;
  change_given: number | null;
  card_last_four: string | null;
  is_split_payment: boolean;
  cash_amount: number | null;
  card_amount: number | null;
  status: POSTransactionStatus;
  voided_reason: string | null;
  voided_at: string | null;
  voided_by: string | null;
  created_at: string;
  // Relations
  items?: POSTransactionItem[];
}

export interface POSTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_sku: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  created_at: string;
}

export interface POSReturn {
  id: string;
  return_number: string;
  original_transaction_id: string;
  original_receipt: string;
  shift_id: string;
  refund_amount: number;
  reason: string;
  refund_method: RefundMethod;
  is_exchange: boolean;
  exchange_transaction_id: string | null;
  status: ReturnStatus;
  rejection_reason: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  // Relations
  items?: POSReturnItem[];
}

export interface POSReturnItem {
  id: string;
  return_id: string;
  product_id: string;
  product_name: string;
  original_quantity: number;
  return_quantity: number;
  unit_price: number;
  refund_amount: number;
  created_at: string;
}

// =====================================================
// SHIPPING
// =====================================================

export interface CourierPartner {
  id: string;
  name: string;
  code: string;
  logo_url: string | null;
  api_endpoint: string | null;
  api_key: string | null;
  webhook_url: string | null;
  delivery_zones: string[] | null;
  base_rate: number;
  per_kg_rate: number;
  cod_fee: number;
  cod_percentage: number;
  estimated_days: number;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  courier_id: string;
  tracking_number: string | null;
  waybill_number: string | null;
  weight: number | null;
  dimensions: { length?: number; width?: number; height?: number } | null;
  package_count: number;
  shipping_cost: number;
  cod_amount: number;
  status: ShipmentStatus;
  current_location: string | null;
  last_status_update: string | null;
  estimated_delivery: string | null;
  picked_at: string | null;
  in_transit_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  returned_at: string | null;
  received_by: string | null;
  delivery_signature: string | null;
  delivery_photo: string | null;
  delivery_notes: string | null;
  return_reason: string | null;
  return_status: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  courier?: CourierPartner;
  tracking?: ShipmentTracking[];
}

export interface ShipmentTracking {
  id: string;
  shipment_id: string;
  status: ShipmentStatus;
  location: string | null;
  description: string | null;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  districts: string[];
  base_rate: number;
  per_kg_rate: number;
  free_shipping_threshold: number | null;
  estimated_days: number;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

// =====================================================
// PAYMENTS
// =====================================================

export interface PaymentTransaction {
  id: string;
  order_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  bank_name: string | null;
  account_number: string | null;
  reference_number: string | null;
  slip_image_url: string | null;
  gateway: string | null;
  gateway_transaction_id: string | null;
  gateway_response: Record<string, unknown> | null;
  card_last_four: string | null;
  card_brand: string | null;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  refunded_amount: number;
  refunded_at: string | null;
  refund_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CODCollection {
  id: string;
  order_id: string;
  shipment_id: string | null;
  amount: number;
  courier_id: string | null;
  tracking_number: string | null;
  status: CODStatus;
  collected_at: string | null;
  collected_by: string | null;
  remitted_at: string | null;
  remittance_reference: string | null;
  remittance_amount: number | null;
  courier_fee: number | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefundRequest {
  id: string;
  order_id: string;
  payment_transaction_id: string | null;
  amount: number;
  reason: string;
  original_payment_method: PaymentMethod;
  refund_method: PaymentMethod;
  bank_name: string | null;
  account_number: string | null;
  account_holder: string | null;
  status: PayoutStatus;
  approved_by: string | null;
  approved_at: string | null;
  processed_by: string | null;
  processed_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailySettlement {
  id: string;
  settlement_date: string;
  total_online_sales: number;
  total_pos_sales: number;
  total_sales: number;
  cash_collected: number;
  card_collected: number;
  bank_transfers: number;
  online_payments: number;
  cod_pending: number;
  refunds: number;
  courier_fees: number;
  gateway_fees: number;
  net_revenue: number;
  is_reconciled: boolean;
  reconciled_by: string | null;
  reconciled_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// RESELLERS
// =====================================================

export interface Reseller {
  id: string;
  user_id: string;
  business_name: string;
  business_registration: string | null;
  tax_id: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tier: ResellerTier;
  status: ApprovalStatus;
  total_orders: number;
  total_revenue: number;
  total_profit: number;
  cod_rejection_count: number;
  cod_rejection_rate: number;
  commission_rate: number;
  available_balance: number;
  pending_balance: number;
  total_withdrawn: number;
  approved_by: string | null;
  approved_at: string | null;
  blocked_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResellerOrder {
  id: string;
  reseller_id: string;
  order_id: string;
  reseller_price: number;
  selling_price: number;
  profit: number;
  commission_amount: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  reseller_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  branch: string | null;
  status: PayoutStatus;
  approved_by: string | null;
  approved_at: string | null;
  processed_by: string | null;
  processed_at: string | null;
  payment_reference: string | null;
  payment_proof_url: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResellerLedger {
  id: string;
  reseller_id: string;
  type: string;
  reference_id: string | null;
  reference_number: string | null;
  credit: number;
  debit: number;
  balance: number;
  description: string | null;
  created_at: string;
}

export interface ResellerTierBenefit {
  id: string;
  tier: ResellerTier;
  discount_percentage: number;
  min_order_value: number;
  max_cod_percentage: number;
  priority_support: boolean;
  free_shipping_threshold: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// PROMOTIONS
// =====================================================

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order_value: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  usage_per_user: number;
  used_count: number;
  valid_from: string;
  valid_to: string;
  applicable_categories: string[] | null;
  applicable_products: string[] | null;
  excluded_products: string[] | null;
  first_order_only: boolean;
  reseller_only: boolean;
  status: CouponStatus;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  order_id: string;
  user_id: string | null;
  customer_id: string | null;
  discount_amount: number;
  created_at: string;
}

export interface Promotion {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  discount_type: CouponType;
  discount_value: number;
  applicable_categories: string[] | null;
  applicable_products: string[] | null;
  starts_at: string;
  ends_at: string;
  banner_image: string | null;
  badge_text: string | null;
  badge_color: string | null;
  status: EntityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// CONTENT / CMS
// =====================================================

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link: string | null;
  position: number;
  display_location: string;
  starts_at: string | null;
  ends_at: string | null;
  status: EntityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  show_in_footer: boolean;
  show_in_menu: boolean;
  menu_position: number;
  status: PageStatus;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  slug: string;
  position: number;
  status: EntityStatus;
  created_at: string;
}

export interface FAQ {
  id: string;
  category_id: string | null;
  question: string;
  answer: string;
  position: number;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  trigger_event: string;
  subject: string | null;
  content: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string | null;
  type: BranchType;
  address: string;
  city: string | null;
  district: string | null;
  phone: string | null;
  email: string | null;
  manager_name: string | null;
  opening_hours: Record<string, { open: string; close: string }> | null;
  is_pickup_location: boolean;
  accepts_returns: boolean;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  size: number;
  url: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  folder: string;
  tags: string[] | null;
  uploaded_by: string | null;
  created_at: string;
}
