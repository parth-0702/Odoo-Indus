const express = require('express');
const router = express.Router();
const { getStock, getStockSummary } = require('./inventory.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);
router.get('/', getStock);
router.get('/summary', getStockSummary);

module.exports = router;
