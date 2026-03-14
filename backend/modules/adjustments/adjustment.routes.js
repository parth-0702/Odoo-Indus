const express = require('express');
const router = express.Router();
const { getAdjustments, getAdjustment, createAdjustment, applyAdjustment } = require('./adjustment.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);
router.route('/').get(getAdjustments).post(createAdjustment);
router.get('/:id', getAdjustment);
router.patch('/:id/apply', applyAdjustment);

module.exports = router;
