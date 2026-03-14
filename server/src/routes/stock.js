import express from 'express';
import mongoose from 'mongoose';
import { StockLedger } from '../models/StockLedger.js';

export const stockRouter = express.Router();

stockRouter.get('/balance', async (req, res) => {
  const { productId, warehouseId } = req.query;
  if (!productId || !warehouseId) return res.status(400).json({ error: 'productId and warehouseId are required' });

  const [row] = await StockLedger.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(String(productId)),
        warehouseId: new mongoose.Types.ObjectId(String(warehouseId)),
      },
    },
    { $group: { _id: null, qty: { $sum: '$quantityChange' } } },
  ]);

  res.json({ data: { productId, warehouseId, quantity: row?.qty ?? 0 } });
});

// Bulk balance for one warehouse (avoids N+1 /balance calls)
// GET /api/stock/balance/bulk?warehouseId=<id>&productIds=a,b,c (productIds optional)
stockRouter.get('/balance/bulk', async (req, res) => {
  const { warehouseId, productIds } = req.query;
  if (!warehouseId) return res.status(400).json({ error: 'warehouseId is required' });

  const match = {
    warehouseId: new mongoose.Types.ObjectId(String(warehouseId)),
  };

  const ids = String(productIds || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (ids.length) {
    match.productId = { $in: ids.map(id => new mongoose.Types.ObjectId(String(id))) };
  }

  const rows = await StockLedger.aggregate([
    { $match: match },
    { $group: { _id: '$productId', qty: { $sum: '$quantityChange' } } },
  ]);

  const balances = rows.map(r => ({ productId: String(r._id), warehouseId: String(warehouseId), quantity: r.qty ?? 0 }));
  res.json({ data: balances });
});

// Stock ledger listing with basic filtering
// GET /api/stock/ledger?productId=&warehouseId=&type=&limit=
stockRouter.get('/ledger', async (req, res) => {
  const { productId, warehouseId, type, limit } = req.query;

  const q = {};
  if (productId) q.productId = new mongoose.Types.ObjectId(String(productId));
  if (warehouseId) q.warehouseId = new mongoose.Types.ObjectId(String(warehouseId));
  if (type) q.operationType = String(type);

  const lim = Math.min(Math.max(Number(limit || 200), 1), 2000);
  const rows = await StockLedger.find(q).sort({ createdAt: -1 }).limit(lim).lean();
  res.json({ data: rows });
});
