const Stock = require('./inventory.model');

const getStock = async (req, res, next) => {
  try {
    const { product, warehouse, location } = req.query;
    let query = {};
    if (product) query.product = product;
    if (warehouse) query.warehouse = warehouse;
    if (location) query.locationId = location;
    const stocks = await Stock.find(query)
      .populate('product', 'name sku uom category minStockLevel')
      .populate('warehouse', 'name code')
      .sort({ 'product.name': 1 });
    res.json({ success: true, count: stocks.length, stocks });
  } catch (err) { next(err); }
};

const getStockSummary = async (req, res, next) => {
  try {
    const stockData = await Stock.aggregate([
      {
        $group: {
          _id: '$product',
          totalQuantity: { $sum: '$quantity' },
          locations: { $push: { locationId: '$locationId', locationName: '$locationName', warehouse: '$warehouse', quantity: '$quantity' } }
        }
      }
    ]);
    res.json({ success: true, count: stockData.length, summary: stockData });
  } catch (err) { next(err); }
};

module.exports = { getStock, getStockSummary };
