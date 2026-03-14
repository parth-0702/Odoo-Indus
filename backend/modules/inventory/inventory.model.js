const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  locationName: { type: String, required: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
}, { timestamps: true });

stockSchema.index({ product: 1, warehouse: 1, locationId: 1 }, { unique: true });

module.exports = mongoose.model('Stock', stockSchema);
