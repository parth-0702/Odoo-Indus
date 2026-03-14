const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/product.routes');
const warehouseRoutes = require('./modules/warehouse/warehouse.routes');
const receiptRoutes = require('./modules/receipts/receipt.routes');
const deliveryRoutes = require('./modules/deliveries/delivery.routes');
const transferRoutes = require('./modules/transfers/transfer.routes');
const adjustmentRoutes = require('./modules/adjustments/adjustment.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const movementRoutes = require('./modules/movements/movement.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'CoreInventory API is running' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/adjustments', adjustmentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
