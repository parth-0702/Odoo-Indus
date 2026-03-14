import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server/.env even when executed from the repo root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { connectMongo } from './mongo.js';
import { errorHandler } from './middleware/errorHandler.js';
import { warehousesRouter } from './routes/warehouses.js';
import { productsRouter } from './routes/products.js';
import { operationsRouter } from './routes/operations.js';
import { stockRouter } from './routes/stock.js';
import { authRouter } from './routes/auth.js';
import { categoriesRouter } from './routes/categories.js';
import { unitsRouter } from './routes/units.js';

const app = express();
app.use(cors());
app.use(express.json());

// lightweight request log
app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`[server] ${req.method} ${req.url}`);
  next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'stocksync-server' });
});

app.use('/api/auth', authRouter);
app.use('/api/warehouses', warehousesRouter);
app.use('/api/products', productsRouter);
app.use('/api/operations', operationsRouter);
app.use('/api/stock', stockRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/units', unitsRouter);

await connectMongo();

app.use(errorHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 5000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${port}`);
});
