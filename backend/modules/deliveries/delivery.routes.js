const express = require('express');
const router = express.Router();
const { getDeliveries, getDelivery, createDelivery, updateDelivery, validateDelivery, cancelDelivery } = require('./delivery.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);
router.route('/').get(getDeliveries).post(createDelivery);
router.route('/:id').get(getDelivery).put(updateDelivery);
router.patch('/:id/validate', validateDelivery);
router.patch('/:id/cancel', cancelDelivery);

module.exports = router;
