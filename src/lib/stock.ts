import { api } from '@/lib/api';

/**
 * Canonical stock calculation: sum(quantityChange) for a product in a warehouse.
 * API-only (MongoDB-backed).
 */
async function getStockForWarehouse(productId: number, warehouseId: number): Promise<number> {
  const res = await api.stock.balance(String(productId), String(warehouseId));
  return Number(res.quantity || 0);
}

async function assertSufficientStock(opts: {
  warehouseId: number;
  items: Array<{ productId: number; quantity: number; productName?: string }>;
}) {
  const { warehouseId, items } = opts;
  for (const it of items.filter(i => i.productId > 0 && i.quantity > 0)) {
    const available = await getStockForWarehouse(it.productId, warehouseId);
    if (it.quantity > available) {
      const name = it.productName ?? `Product #${it.productId}`;
      throw new Error(`Insufficient stock for "${name}": ${available} available, ${it.quantity} requested.`);
    }
  }
}

/**
 * Dexie-only helper removed; always return false.
 * (Posting operations should be idempotent server-side.)
 */
async function hasLedgerEntries(_opts: { referenceId: number; operationType: string }) {
  return false;
}

export { getStockForWarehouse, assertSufficientStock, hasLedgerEntries };
