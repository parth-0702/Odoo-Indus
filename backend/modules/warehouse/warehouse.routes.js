const express = require('express');
const router = express.Router();
const { getWarehouses, getWarehouse, createWarehouse, updateWarehouse, addLocation, deleteLocation } = require('./warehouse.controller');
const { protect } = require('../../middleware/auth');

router.use(protect);
router.route('/').get(getWarehouses).post(createWarehouse);
router.route('/:id').get(getWarehouse).put(updateWarehouse);
router.post('/:id/locations', addLocation);
router.delete('/:id/locations/:locationId', deleteLocation);

module.exports = router;
