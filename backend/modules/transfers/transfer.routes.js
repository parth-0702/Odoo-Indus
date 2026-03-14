const express = require('express');
const router = express.Router();
const { getTransfers, getTransfer, createTransfer, confirmTransfer, cancelTransfer } = require('./transfer.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);
router.route('/').get(getTransfers).post(createTransfer);
router.get('/:id', getTransfer);
router.patch('/:id/confirm', confirmTransfer);
router.patch('/:id/cancel', cancelTransfer);

module.exports = router;
