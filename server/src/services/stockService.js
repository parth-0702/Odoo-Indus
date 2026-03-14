import mongoose from 'mongoose';
import { StockLedger } from '../models/StockLedger.js';

export async function getAvailableStock({ productId, warehouseId, session }) {
  const [res] = await StockLedger.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), warehouseId: new mongoose.Types.ObjectId(warehouseId) } },
    { $group: { _id: null, qty: { $sum: '$quantityChange' } } },
  ]).session(session);

  return res?.qty ?? 0;
}

export async function assertSufficientStock({ warehouseId, items, session }) {
  for (const it of items) {
    if (!it?.productId) continue;
    const qty = Number(it.quantity);
    if (!Number.isFinite(qty) || qty <= 0) continue;

    const available = await getAvailableStock({ productId: it.productId, warehouseId, session });
    if (qty > available) {
      throw new Error(`Insufficient stock: ${available} available, ${qty} requested (product ${it.productId}).`);
    }
  }
}
