import express from 'express';
import mongoose from 'mongoose';
import { Operation } from '../models/Operation.js';
import { StockLedger } from '../models/StockLedger.js';
import { assertSufficientStock } from '../services/stockService.js';

export const operationsRouter = express.Router();

function normalizeItems(items) {
  const map = new Map();
  for (const it of Array.isArray(items) ? items : []) {
    const productId = it?.productId;
    const qty = Number(it?.quantity);
    if (!productId) continue;
    if (!Number.isFinite(qty) || qty <= 0) continue;
    map.set(String(productId), (map.get(String(productId)) ?? 0) + qty);
  }
  return [...map.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

operationsRouter.get('/', async (req, res) => {
  const type = req.query.type ? String(req.query.type) : undefined;
  const q = type ? { type } : {};
  const ops = await Operation.find(q).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ data: ops });
});

operationsRouter.post('/', async (req, res) => {
  const body = req.body ?? {};
  const created = await Operation.create({ ...body, items: normalizeItems(body.items) });
  res.status(201).json({ data: created });
});

operationsRouter.post('/:id/post', async (req, res) => {
  const opId = req.params.id;
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const op = await Operation.findById(opId).session(session);
      if (!op) throw new Error('Operation not found');
      if (op.status === 'cancelled') throw new Error('Operation is cancelled');
      if (op.status === 'done') throw new Error('Operation already posted');

      op.items = normalizeItems(op.items);

      // Validate per type
      if (op.type === 'transfer') {
        if (!op.sourceWarehouseId || !op.destinationWarehouseId) throw new Error('Transfer warehouses required');
        if (String(op.sourceWarehouseId) === String(op.destinationWarehouseId)) {
          throw new Error('Cannot transfer to same warehouse');
        }
        await assertSufficientStock({ warehouseId: op.sourceWarehouseId, items: op.items, session });
      } else {
        if (!op.warehouseId) throw new Error('Warehouse required');
        if (op.type === 'delivery') {
          await assertSufficientStock({ warehouseId: op.warehouseId, items: op.items, session });
        }
      }

      // Idempotency: any ledger for reference? (unique index also protects)
      const anyLedger = await StockLedger.findOne({ referenceType: op.type, referenceId: op._id }).session(session);
      if (anyLedger) throw new Error('Operation already has ledger entries');

      const ledgerDocs = [];
      const createdAt = new Date();

      if (op.type === 'receipt') {
        for (const it of op.items) {
          ledgerDocs.push({
            productId: it.productId,
            warehouseId: op.warehouseId,
            operationType: 'receipt',
            quantityChange: +it.quantity,
            referenceType: 'receipt',
            referenceId: op._id,
            referenceNumber: op.referenceNumber,
            userId: op.createdBy,
            notes: op.notes,
            createdAt,
          });
        }
      }

      if (op.type === 'delivery') {
        for (const it of op.items) {
          ledgerDocs.push({
            productId: it.productId,
            warehouseId: op.warehouseId,
            operationType: 'delivery',
            quantityChange: -Math.abs(it.quantity),
            referenceType: 'delivery',
            referenceId: op._id,
            referenceNumber: op.referenceNumber,
            userId: op.createdBy,
            notes: op.notes,
            createdAt,
          });
        }
      }

      if (op.type === 'transfer') {
        for (const it of op.items) {
          ledgerDocs.push(
            {
              productId: it.productId,
              warehouseId: op.sourceWarehouseId,
              operationType: 'transfer_out',
              quantityChange: -Math.abs(it.quantity),
              referenceType: 'transfer',
              referenceId: op._id,
              referenceNumber: op.referenceNumber,
              userId: op.createdBy,
              notes: op.notes,
              createdAt,
            },
            {
              productId: it.productId,
              warehouseId: op.destinationWarehouseId,
              operationType: 'transfer_in',
              quantityChange: +Math.abs(it.quantity),
              referenceType: 'transfer',
              referenceId: op._id,
              referenceNumber: op.referenceNumber,
              userId: op.createdBy,
              notes: op.notes,
              createdAt,
            }
          );
        }
      }

      if (op.type === 'adjustment') {
        // adjustment expects signed quantities (positive adds stock, negative removes stock)
        for (const it of op.items) {
          ledgerDocs.push({
            productId: it.productId,
            warehouseId: op.warehouseId,
            operationType: 'adjustment',
            quantityChange: Number(it.quantity),
            referenceType: 'adjustment',
            referenceId: op._id,
            referenceNumber: op.referenceNumber,
            userId: op.createdBy,
            notes: op.notes,
            createdAt,
          });
        }
      }

      await StockLedger.insertMany(ledgerDocs, { session });
      op.status = 'done';
      await op.save({ session });

      result = { op: op.toObject(), ledgerCount: ledgerDocs.length };
    });

    res.json({ data: result });
  } catch (e) {
    res.status(400).json({ error: e?.message ?? 'Failed to post operation' });
  } finally {
    session.endSession();
  }
});

// Cancel (allowed only before posting; does not touch ledger)
operationsRouter.post('/:id/cancel', async (req, res) => {
  try {
    const op = await Operation.findById(req.params.id);
    if (!op) return res.status(404).json({ error: 'Operation not found' });
    if (op.status === 'done') return res.status(400).json({ error: 'Cannot cancel a posted operation' });
    if (op.status === 'cancelled') return res.json({ data: op });

    op.status = 'cancelled';
    await op.save();
    res.json({ data: op });
  } catch (e) {
    res.status(400).json({ error: e?.message ?? 'Failed to cancel operation' });
  }
});
