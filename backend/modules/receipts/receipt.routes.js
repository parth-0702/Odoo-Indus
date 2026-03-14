const express = require('express');
const router = express.Router();
const { getReceipts, getReceipt, createReceipt, updateReceipt, validateReceipt, cancelReceipt } = require('./receipt.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);
router.route('/').get(getReceipts).post(createReceipt);
router.route('/:id').get(getReceipt).put(updateReceipt);
router.patch('/:id/validate', validateReceipt);
router.patch('/:id/cancel', cancelReceipt);

module.exports = router;
