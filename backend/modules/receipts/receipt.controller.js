const Receipt = require('./receipt.model');
const Stock = require('../inventory/inventory.model');
const Movement = require('../movements/movement.model');

const getReceipts = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const receipts = await Receipt.find(query)
      .populate('warehouse', 'name code')
      .populate('lines.product', 'name sku uom')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: receipts.length, receipts });
  } catch (err) { next(err); }
};

const getReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('warehouse', 'name code')
      .populate('lines.product', 'name sku uom');
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    res.json({ success: true, receipt });
  } catch (err) { next(err); }
};

const createReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, receipt });
  } catch (err) { next(err); }
};

const updateReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    if (receipt.status === 'done') return res.status(400).json({ success: false, message: 'Cannot edit a validated receipt' });
    Object.assign(receipt, req.body);
    await receipt.save();
    res.json({ success: true, receipt });
  } catch (err) { next(err); }
};

const validateReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id).populate('lines.product');
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    if (receipt.status === 'done') return res.status(400).json({ success: false, message: 'Receipt already validated' });
    if (receipt.status === 'cancelled') return res.status(400).json({ success: false, message: 'Receipt is cancelled' });

    // Increase stock for each line
    for (const line of receipt.lines) {
      await Stock.findOneAndUpdate(
        { product: line.product._id, warehouse: receipt.warehouse, locationId: receipt.locationId },
        {
          $inc: { quantity: line.quantity },
          $set: { locationName: receipt.locationName }
        },
        { upsert: true, new: true }
      );
      // Log movement
      await Movement.create({
        type: 'receipt',
        referenceId: receipt._id,
        referenceNumber: receipt.receiptNumber,
        product: line.product._id,
        toWarehouse: receipt.warehouse,
        toLocation: receipt.locationName,
        quantityChange: line.quantity,
        note: `Receipt from ${receipt.supplier}`,
        createdBy: req.user._id,
      });
    }

    receipt.status = 'done';
    receipt.validatedAt = new Date();
    await receipt.save();
    res.json({ success: true, receipt });
  } catch (err) { next(err); }
};

const cancelReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
    if (receipt.status === 'done') return res.status(400).json({ success: false, message: 'Cannot cancel a validated receipt' });
    receipt.status = 'cancelled';
    await receipt.save();
    res.json({ success: true, receipt });
  } catch (err) { next(err); }
};

module.exports = { getReceipts, getReceipt, createReceipt, updateReceipt, validateReceipt, cancelReceipt };
