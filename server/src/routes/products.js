import express from 'express';
import { Product } from '../models/Product.js';

export const productsRouter = express.Router();

productsRouter.get('/', async (_req, res) => {
  const products = await Product.find().sort({ name: 1 }).lean();
  res.json({ data: products });
});

productsRouter.post('/', async (req, res) => {
  const created = await Product.create(req.body);
  res.status(201).json({ data: created });
});

productsRouter.get('/:id', async (req, res) => {
  const item = await Product.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ data: item });
});

productsRouter.put('/:id', async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ data: updated });
});

productsRouter.delete('/:id', async (req, res) => {
  const deleted = await Product.findByIdAndDelete(req.params.id).lean();
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});
