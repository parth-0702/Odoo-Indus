const Adjustment = require('./adjustment.model');
const Stock = require('../inventory/inventory.model');
const Movement = require('../movements/movement.model');

const getAdjustments = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const adjustments = await Adjustment.find(query)
      .populate('product', 'name sku uom')
      .populate('warehouse', 'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: adjustments.length, adjustments });
  } catch (err) { next(err); }
};

const getAdjustment = async (req, res, next) => {
  try {
    const adj = await Adjustment.findById(req.params.id)
      .populate('product', 'name sku uom')
      .populate('warehouse', 'name code');
    if (!adj) return res.status(404).json({ success: false, message: 'Adjustment not found' });
    res.json({ success: true, adjustment: adj });
  } catch (err) { next(err); }
};

const createAdjustment = async (req, res, next) => {
  try {
    const { product, warehouse, locationId, locationName, countedQuantity, reason } = req.body;
    // Get current stock
    const stock = await Stock.findOne({ product, warehouse, locationId });
    const previousQuantity = stock ? stock.quantity : 0;
    const adj = await Adjustment.create({
      product, warehouse, locationId, locationName,
      previousQuantity, countedQuantity, reason,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, adjustment: adj });
  } catch (err) { next(err); }
};

const applyAdjustment = async (req, res, next) => {
  try {
    const adj = await Adjustment.findById(req.params.id).populate('product');
    if (!adj) return res.status(404).json({ success: false, message: 'Adjustment not found' });
    if (adj.status === 'done') return res.status(400).json({ success: false, message: 'Adjustment already applied' });

    const diff = adj.countedQuantity - adj.previousQuantity;
    // Update stock
    await Stock.findOneAndUpdate(
      { product: adj.product._id, warehouse: adj.warehouse, locationId: adj.locationId },
      {
        $set: { quantity: adj.countedQuantity, locationName: adj.locationName }
      },
      { upsert: true, new: true }
    );
    // Log movement
    await Movement.create({
      type: 'adjustment',
      referenceId: adj._id,
      referenceNumber: adj.adjustmentNumber,
      product: adj.product._id,
      toWarehouse: adj.warehouse,
      toLocation: adj.locationName,
      quantityChange: diff,
      note: adj.reason || 'Inventory adjustment',
      createdBy: req.user._id,
    });

    adj.status = 'done';
    adj.appliedAt = new Date();
    await adj.save();
    res.json({ success: true, adjustment: adj });
  } catch (err) { next(err); }
};

module.exports = { getAdjustments, getAdjustment, createAdjustment, applyAdjustment };
