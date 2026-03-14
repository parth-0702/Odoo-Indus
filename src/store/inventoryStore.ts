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

    for (const p of products) {
      const pid = String(p._id);
      map[pid] = map[pid] || {};
      for (const w of warehouses) {
        const wid = String(w._id);
        const bal = await api.stock.balance(pid, wid);
        map[pid][wid] = Number(bal.quantity || 0);
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
