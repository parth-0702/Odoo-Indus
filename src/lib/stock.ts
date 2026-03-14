import { api } from '@/lib/api';

/**
 * Legacy stock helpers (Dexie-era numeric IDs) are retired.
 * Use `useInventoryStore().getStock(productId: string, warehouseId?: string)` for UI,
 * or `api.stock.balance(productId: string, warehouseId: string)` / bulk endpoints.
 */

async function getStockForWarehouse(_productId: number, _warehouseId: number): Promise<number> {
  throw new Error('getStockForWarehouse(productId:number, warehouseId:number) is retired. Use api.stock.balance(productId:string, warehouseId:string) instead.');
}

async function assertSufficientStock(_opts: {
  warehouseId: number;
  items: Array<{ productId: number; quantity: number; productName?: string }>;
}) {
  throw new Error('assertSufficientStock with numeric IDs is retired. Validate stock on the server (posting operations already enforces this).');
}

async function hasLedgerEntries(_opts: { referenceId: number; operationType: string }) {
  return false;
}

export { getStockForWarehouse, assertSufficientStock, hasLedgerEntries };
