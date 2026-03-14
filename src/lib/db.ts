// NOTE: Dexie has been removed. This file is kept only as a legacy compatibility stub.
// Any remaining imports of `@/lib/db` must be migrated to `@/lib/repo` (server API / MongoDB Atlas).

// Legacy types (kept so TypeScript can compile while we finish migrating pages)
export interface User {
  id?: number;
  loginId: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: 'admin' | 'manager' | 'staff';
  createdAt: Date;
  avatar?: string;
}

export interface Category {
  id?: number;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface UnitOfMeasure {
  id?: number;
  name: string;
  symbol: string;
  createdAt: Date;
}

export interface Warehouse {
  id?: number;
  name: string;
  location: string;
  manager: string;
  capacity: number;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Product {
  id?: number;
  name: string;
  sku: string;
  categoryId: number;
  unitId: number;
  warehouseId: number;
  reorderLevel: number;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Receipt {
  id?: number;
  referenceNumber: string;
  supplier: string;
  warehouseId: number;
  receiptDate: Date;
  status: 'draft' | 'ready' | 'done' | 'cancelled';
  notes?: string;
  createdBy: number;
  createdAt: Date;
}

export interface ReceiptItem {
  id?: number;
  receiptId: number;
  productId: number;
  quantity: number;
  unitId: number;
}

export interface Delivery {
  id?: number;
  referenceNumber: string;
  customer: string;
  warehouseId: number;
  deliveryDate: Date;
  status: 'draft' | 'pick' | 'pack' | 'done' | 'cancelled';
  notes?: string;
  createdBy: number;
  createdAt: Date;
}

export interface DeliveryItem {
  id?: number;
  deliveryId: number;
  productId: number;
  quantity: number;
  unitId: number;
}

export interface Transfer {
  id?: number;
  referenceNumber: string;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  transferDate: Date;
  status: 'draft' | 'ready' | 'done' | 'cancelled';
  notes?: string;
  createdBy: number;
  createdAt: Date;
}

export interface TransferItem {
  id?: number;
  transferId: number;
  productId: number;
  quantity: number;
  unitId: number;
}

export interface Adjustment {
  id?: number;
  referenceNumber: string;
  productId: number;
  warehouseId: number;
  systemQty: number;
  countedQty: number;
  difference: number;
  reason: string;
  status: 'draft' | 'done';
  createdBy: number;
  createdAt: Date;
}

export interface StockLedger {
  id?: number;
  productId: number;
  warehouseId: number;
  operationType: 'initial' | 'receipt' | 'delivery' | 'transfer_in' | 'transfer_out' | 'adjustment';
  quantityChange: number;
  referenceId?: number;
  referenceNumber?: string;
  userId: number;
  notes?: string;
  createdAt: Date;
}

export type StockLedgerEntry = StockLedger;

export interface Notification {
  id?: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
}

export interface OutboxItem {
  id?: number;
  kind: 'op.post';
  payload: unknown;
  status: 'pending' | 'sent' | 'error';
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

function retired(): never {
  throw new Error('Local Dexie database has been removed. Use MongoDB Atlas via server API (repo.ts).');
}

// Runtime stub: any access will throw, preventing silent local use.
export const db = new Proxy(
  {},
  {
    get() {
      retired();
    },
  }
) as unknown;

// No-op placeholders: callers must be migrated.
export async function seedDatabase(): Promise<void> {
  // Intentionally left blank.
  return;
}

export const hashPassword = (_p: string) => {
  retired();
};
