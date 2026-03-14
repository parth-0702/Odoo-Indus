import express from 'express';
import { Warehouse } from '../models/Warehouse.js';

export const warehousesRouter = express.Router();

warehousesRouter.get('/', async (_req, res) => {
  const warehouses = await Warehouse.find().sort({ name: 1 }).lean();
  res.json({ data: warehouses });
});

warehousesRouter.post('/', async (req, res) => {
  const created = await Warehouse.create(req.body);
  res.status(201).json({ data: created });
});

warehousesRouter.get('/:id', async (req, res) => {
  const item = await Warehouse.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ data: item });
});

warehousesRouter.put('/:id', async (req, res) => {
  const updated = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ data: updated });
});

warehousesRouter.delete('/:id', async (req, res) => {
  const deleted = await Warehouse.findByIdAndDelete(req.params.id).lean();
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});
