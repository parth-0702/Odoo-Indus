const Movement = require('./movement.model');

const getMovements = async (req, res, next) => {
  try {
    const { type, product, warehouse, startDate, endDate, limit = 50, page = 1 } = req.query;
    let query = {};
    if (type) query.type = type;
    if (product) query.product = product;
    if (warehouse) query.$or = [{ fromWarehouse: warehouse }, { toWarehouse: warehouse }];
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const skip = (page - 1) * limit;
    const total = await Movement.countDocuments(query);
    const movements = await Movement.find(query)
      .populate('product', 'name sku uom')
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    res.json({ success: true, count: movements.length, total, page: Number(page), movements });
  } catch (err) { next(err); }
};

module.exports = { getMovements };
