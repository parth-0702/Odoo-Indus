import { create } from 'zustand';
import { api } from '@/lib/api';
import { listProducts, listWarehouses } from '@/lib/repo';

interface StockMap {
  [productId: string]: { [warehouseId: string]: number };
}

interface InventoryState {
  stockMap: StockMap;
  loading: boolean;
  refreshStock: () => Promise<void>;
  getStock: (productId: string, warehouseId?: string) => number;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  stockMap: {},
  loading: false,

  refreshStock: async () => {
    set({ loading: true });

    const [products, warehouses] = await Promise.all([listProducts(), listWarehouses()]);
    const map: StockMap = {};

    // init map so missing rows default to 0
    for (const p of products) {
      map[String(p._id)] = {};
    }

    // Fetch balances in bulk per warehouse to avoid N+1 HTTP calls
    const productIds = products.map(p => String(p._id));
    for (const w of warehouses) {
      const wid = String(w._id);
      const balances = await api.stock.balanceBulk(wid, productIds);

      // default to 0
      for (const pid of productIds) {
        map[pid][wid] = 0;
      }

      for (const b of balances) {
        const pid = String(b.productId);
        if (!map[pid]) map[pid] = {};
        map[pid][wid] = Number(b.quantity || 0);
      }
    }

    set({ stockMap: map, loading: false });
  },

  getStock: (productId, warehouseId) => {
    const { stockMap } = get();
    const byProduct = stockMap[String(productId)];
    if (!byProduct) return 0;
    if (warehouseId !== undefined) return byProduct[String(warehouseId)] ?? 0;
    return Object.values(byProduct).reduce((sum, v) => sum + v, 0);
  },
}));
