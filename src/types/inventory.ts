// Inventory Module Types

export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  categoryName: string;
  branchId: string;
  branchName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  reorderPoint: number;
  costPrice: number;
  totalValue: number;
  lastRestocked: Date;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  productId: string;
  productName: string;
  sku: string;
  branchId: string;
  branchName: string;
  type: 'add' | 'remove' | 'damage' | 'expired' | 'correction';
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reason: string;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  approvedAt?: Date;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
  }[];
  totalItems: number;
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  requestedBy: string;
  approvedBy?: string;
  receivedBy?: string;
  notes?: string;
  createdAt: Date;
  shippedAt?: Date;
  receivedAt?: Date;
}

export interface SupplierWithDetails {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  paymentTerms: string;
  status: 'active' | 'inactive';
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  createdAt: Date;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitCost: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  expectedDelivery?: Date;
  receivedAt?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}
