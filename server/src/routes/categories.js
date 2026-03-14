import express from 'express';
import { Category } from '../models/Category.js';

export const categoriesRouter = express.Router();

categoriesRouter.get('/', async (_req, res) => {
  const items = await Category.find().sort({ name: 1 }).lean();
  res.json({ data: items });
});

categoriesRouter.post('/', async (req, res) => {
  const created = await Category.create(req.body);
  res.status(201).json({ data: created });
});

categoriesRouter.get('/:id', async (req, res) => {
  const item = await Category.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ data: item });
});

categoriesRouter.put('/:id', async (req, res) => {
  const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ data: updated });
});

categoriesRouter.delete('/:id', async (req, res) => {
  const deleted = await Category.findByIdAndDelete(req.params.id).lean();
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ data: { ok: true } });
});
