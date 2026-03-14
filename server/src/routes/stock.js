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
