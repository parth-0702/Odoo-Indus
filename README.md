# StockSync

StockSync is a lightweight inventory & stock movement app (receipts, deliveries, transfers, adjustments) with a MongoDB Atlas–backed API and a React (Vite) frontend.

> Note: This project previously used Dexie/IndexedDB for offline storage. All client persistence has been migrated to server APIs. Legacy client DB modules remain as *retired stubs* to prevent accidental reintroduction.

## Features

- Master data: **Products**, **Warehouses**, **Categories**, **Units**
- Operations: **Receipts**, **Deliveries**, **Transfers**, **Adjustments**
- Stock: **Current balance** (bulk endpoint) and **stock ledger** (movement history)
- **Onboarding flow** for first-time users
- **Professional Excel export** (formatted workbook via ExcelJS)
- Charts powered by **real entered data** (dashboard & reports)

---

## Project structure

- `src/` – Frontend (React + Vite + TypeScript)
- `server/` – Backend (Node.js + Express + Mongoose)

The frontend calls the backend via `/api/*` endpoints.

---

## Prerequisites

- Node.js 18+ (recommended)
- A MongoDB Atlas cluster (or any MongoDB instance reachable by the server)

---

## Environment variables

### Server (`server/.env`)

Create `server/.env` (see `server/.env.example`). Typical values:

- `MONGODB_URI` – MongoDB connection string (Atlas SRV recommended)
- `JWT_SECRET` – Secret used to sign JWT tokens
- `PORT` – Server port (defaults to `5000`)
- `CORS_ORIGIN` – Frontend origin (e.g. `http://localhost:5173`) if enforced in your setup

### Frontend (`.env`)

If your frontend expects an API base URL, set:

- `VITE_API_BASE_URL` – e.g. `http://localhost:5000`

If this variable is not used in your build, the app may rely on same-host proxying.

---

## Install & run (local development)

### 1) Install dependencies

From the repo root:

- Frontend deps: `npm install`
- Server deps: `cd server && npm install`

### 2) Start the backend

From `server/`:

- Dev: `npm run dev`
- Prod-like: `npm start`

Backend will listen on `http://localhost:5000` by default.

### 3) Start the frontend

From the repo root:

- `npm run dev`

Frontend will usually start on `http://localhost:5173`.

---

## First-time user onboarding

On first launch, the UI shows an onboarding gate and routes you into the recommended setup order:

1. Create at least one **Warehouse**
2. Create **Categories** and **Units** (optional but recommended)
3. Create **Products**
4. Start logging operations (Receipts/Deliveries/Transfers/Adjustments)

Onboarding progress is stored client-side so returning users are not blocked.

---

## Excel export

Reports can be exported to a professionally formatted `.xlsx` file:

- Title + subtitle/meta
- Frozen header row, filters
- Styled header, zebra striping
- Column widths and number formats

Implementation lives in `src/lib/excelExport.ts`.

---

## API overview

Base URL: `http://localhost:5000/api`

### Auth

- `POST /auth/signup`
- `POST /auth/login`

### Master data

- `GET/POST /products`
- `GET/PUT/DELETE /products/:id`

- `GET/POST /warehouses`
- `GET/PUT/DELETE /warehouses/:id`

- `GET/POST /categories`
- `GET/PUT/DELETE /categories/:id`

- `GET/POST /units`
- `GET/PUT/DELETE /units/:id`

### Operations

- `GET /operations?type=receipt|delivery|transfer|adjustment`
- `POST /operations`
- `POST /operations/:id/post` (finalize and write to stock ledger)

### Stock

- `GET /stock/balance?warehouseId=...&productId=...`
- `GET /stock/balance/bulk?warehouseId=...&productIds=...` (recommended)
- `GET /stock/ledger` (filters supported based on server implementation)

---

## Production notes

- **Do not commit secrets**: keep `server/.env` out of version control.
- Add proper **auth middleware** on server routes before any real deployment.
- Configure CORS appropriately (least privilege).
- Consider adding server-side rate limiting, request validation, and audit logging.

---

## Legacy (Dexie/IndexedDB) modules

These files exist as *retired stubs* and will throw if imported/used:

- `src/lib/db.ts`
- `src/lib/sync.ts`
- `src/lib/stock.ts`

They are kept to:

- prevent silent runtime regressions
- preserve old import paths while migrating

If you no longer need compatibility, you can delete them and fix any lingering imports.

---

## Troubleshooting

### Frontend builds but pages show empty data

- Confirm the server is running and reachable (`http://localhost:5000/api/...`).
- Check `VITE_API_BASE_URL` (if used).
- Verify your MongoDB Atlas IP allowlist permits your server IP.

### MongoDB connection fails

- Confirm `MONGODB_URI` is correct (Atlas SRV string without typos).
- Ensure the database user has permissions.
- Check Atlas Network Access (IP allowlist).

### Stock numbers look wrong

- Ensure operations are **posted** (finalized) if your workflow requires posting.
- Check the stock ledger endpoint and operation posting route.

---

## Tech stack

Frontend:
- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Recharts

Backend:
- Node.js
- Express
- Mongoose (MongoDB Atlas)

---

## License

Add your license information here.
