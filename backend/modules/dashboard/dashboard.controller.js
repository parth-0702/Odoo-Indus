const Product = require('../products/product.model');
const Stock = require('../inventory/inventory.model');
const Receipt = require('../receipts/receipt.model');
const Delivery = require('../deliveries/delivery.model');
const Transfer = require('../transfers/transfer.model');
const Adjustment = require('../adjustments/adjustment.model');
const Movement = require('../movements/movement.model');

const getDashboardStats = async (req, res, next) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });

    // Aggregate total stock per product
    const stockPerProduct = await Stock.aggregate([
      { $group: { _id: '$product', totalQty: { $sum: '$quantity' } } }
    ]);

    const productsWithNoStock = await Product.find({ isActive: true }).select('_id');
    const productIdsWithStock = stockPerProduct.filter(s => s.totalQty > 0).map(s => s._id.toString());
    const outOfStock = productsWithNoStock.filter(p => !productIdsWithStock.includes(p._id.toString())).length;

    // Get min stock levels
    const allProducts = await Product.find({ isActive: true }).select('_id minStockLevel');
    const lowStock = stockPerProduct.filter(s => {
      const prod = allProducts.find(p => p._id.toString() === s._id.toString());
      return prod && s.totalQty > 0 && s.totalQty <= prod.minStockLevel;
    }).length;

    const pendingReceipts = await Receipt.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } });
    const pendingDeliveries = await Delivery.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } });
    const pendingTransfers = await Transfer.countDocuments({ status: { $in: ['draft', 'waiting', 'ready'] } });

    // Recent movements (last 10)
    const recentMovements = await Movement.find()
      .populate('product', 'name sku')
      .populate('fromWarehouse', 'name')
      .populate('toWarehouse', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Monthly movement counts for chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const movementsByMonth = await Movement.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalProducts,
        outOfStock,
        lowStock,
        pendingReceipts,
        pendingDeliveries,
        pendingTransfers,
      },
      recentMovements,
      movementsByMonth,
    });
  } catch (err) { next(err); }
};

module.exports = { getDashboardStats };
