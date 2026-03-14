const Delivery = require('./delivery.model');
const Stock = require('../inventory/inventory.model');
const Movement = require('../movements/movement.model');

const getDeliveries = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const deliveries = await Delivery.find(query)
      .populate('warehouse', 'name code')
      .populate('lines.product', 'name sku uom')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: deliveries.length, deliveries });
  } catch (err) { next(err); }
};

const getDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('warehouse', 'name code')
      .populate('lines.product', 'name sku uom');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, delivery });
  } catch (err) { next(err); }
};

const createDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, delivery });
  } catch (err) { next(err); }
};

const updateDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (delivery.status === 'done') return res.status(400).json({ success: false, message: 'Cannot edit a validated delivery' });
    Object.assign(delivery, req.body);
    await delivery.save();
    res.json({ success: true, delivery });
  } catch (err) { next(err); }
};

const validateDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id).populate('lines.product');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (delivery.status === 'done') return res.status(400).json({ success: false, message: 'Delivery already validated' });
    if (delivery.status === 'cancelled') return res.status(400).json({ success: false, message: 'Delivery is cancelled' });

    // Check and reduce stock for each line
    for (const line of delivery.lines) {
      const stock = await Stock.findOne({
        product: line.product._id,
        warehouse: delivery.warehouse,
        locationId: delivery.locationId
      });
      if (!stock || stock.quantity < line.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${line.product.name}. Available: ${stock ? stock.quantity : 0}`
        });
      }
      await Stock.findOneAndUpdate(
        { product: line.product._id, warehouse: delivery.warehouse, locationId: delivery.locationId },
        { $inc: { quantity: -line.quantity } }
      );
      await Movement.create({
        type: 'delivery',
        referenceId: delivery._id,
        referenceNumber: delivery.deliveryNumber,
        product: line.product._id,
        fromWarehouse: delivery.warehouse,
        fromLocation: delivery.locationName,
        quantityChange: -line.quantity,
        note: `Delivery to ${delivery.customer}`,
        createdBy: req.user._id,
      });
    }

    delivery.status = 'done';
    delivery.validatedAt = new Date();
    await delivery.save();
    res.json({ success: true, delivery });
  } catch (err) { next(err); }
};

const cancelDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    if (delivery.status === 'done') return res.status(400).json({ success: false, message: 'Cannot cancel a validated delivery' });
    delivery.status = 'cancelled';
    await delivery.save();
    res.json({ success: true, delivery });
  } catch (err) { next(err); }
};

module.exports = { getDeliveries, getDelivery, createDelivery, updateDelivery, validateDelivery, cancelDelivery };
