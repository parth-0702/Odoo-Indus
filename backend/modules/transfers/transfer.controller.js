const Transfer = require('./transfer.model');
const Stock = require('../inventory/inventory.model');
const Movement = require('../movements/movement.model');

const getTransfers = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const transfers = await Transfer.find(query)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('lines.product', 'name sku uom')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: transfers.length, transfers });
  } catch (err) { next(err); }
};

const getTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id)
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('lines.product', 'name sku uom');
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    res.json({ success: true, transfer });
  } catch (err) { next(err); }
};

const createTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, transfer });
  } catch (err) { next(err); }
};

const confirmTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id).populate('lines.product');
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    if (transfer.status === 'done') return res.status(400).json({ success: false, message: 'Transfer already confirmed' });
    if (transfer.status === 'cancelled') return res.status(400).json({ success: false, message: 'Transfer is cancelled' });

    for (const line of transfer.lines) {
      // Check stock at source
      const sourceStock = await Stock.findOne({
        product: line.product._id,
        warehouse: transfer.fromWarehouse,
        locationId: transfer.fromLocationId
      });
      if (!sourceStock || sourceStock.quantity < line.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${line.product.name} at source location. Available: ${sourceStock ? sourceStock.quantity : 0}`
        });
      }
      // Decrease from source
      await Stock.findOneAndUpdate(
        { product: line.product._id, warehouse: transfer.fromWarehouse, locationId: transfer.fromLocationId },
        { $inc: { quantity: -line.quantity } }
      );
      // Increase at destination
      await Stock.findOneAndUpdate(
        { product: line.product._id, warehouse: transfer.toWarehouse, locationId: transfer.toLocationId },
        {
          $inc: { quantity: line.quantity },
          $set: { locationName: transfer.toLocationName }
        },
        { upsert: true, new: true }
      );
      // Log movement
      await Movement.create({
        type: 'transfer',
        referenceId: transfer._id,
        referenceNumber: transfer.transferNumber,
        product: line.product._id,
        fromWarehouse: transfer.fromWarehouse,
        fromLocation: transfer.fromLocationName,
        toWarehouse: transfer.toWarehouse,
        toLocation: transfer.toLocationName,
        quantityChange: line.quantity,
        note: `Internal transfer`,
        createdBy: req.user._id,
      });
    }

    transfer.status = 'done';
    transfer.confirmedAt = new Date();
    await transfer.save();
    res.json({ success: true, transfer });
  } catch (err) { next(err); }
};

const cancelTransfer = async (req, res, next) => {
  try {
    const transfer = await Transfer.findById(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Transfer not found' });
    if (transfer.status === 'done') return res.status(400).json({ success: false, message: 'Cannot cancel a confirmed transfer' });
    transfer.status = 'cancelled';
    await transfer.save();
    res.json({ success: true, transfer });
  } catch (err) { next(err); }
};

module.exports = { getTransfers, getTransfer, createTransfer, confirmTransfer, cancelTransfer };
