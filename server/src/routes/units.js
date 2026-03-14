import express from 'express';
import { Unit } from '../models/Unit.js';

export const unitsRouter = express.Router();

unitsRouter.get('/', async (_req, res) => {
  const items = await Unit.find().sort({ name: 1 }).lean();
  res.json({ data: items });
});

unitsRouter.post('/', async (req, res) => {
  const created = await Unit.create(req.body);
  res.status(201).json({ data: created });
});

unitsRouter.get('/:id', async (req, res) => {
  const item = await Unit.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ data: item });
});

unitsRouter.put('/:id', async (req, res) => {
  const updated = await Unit.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ data: updated });
});

unitsRouter.delete('/:id', async (req, res) => {
  const deleted = await Unit.findByIdAndDelete(req.params.id).lean();
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ data: { ok: true } });
});
