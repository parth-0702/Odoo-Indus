const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Product name is required'], trim: true },
  sku: { type: String, required: [true, 'SKU is required'], unique: true, uppercase: true, trim: true },
  category: { type: String, required: [true, 'Category is required'], trim: true },
  uom: { type: String, required: true, default: 'Units' },
  description: { type: String, trim: true },
  minStockLevel: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
