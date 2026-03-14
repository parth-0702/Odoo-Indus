const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['rack', 'area', 'zone', 'other'], default: 'rack' },
}, { _id: true });

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Warehouse name is required'], trim: true, unique: true },
  code: { type: String, required: [true, 'Warehouse code is required'], uppercase: true, trim: true },
  address: { type: String, trim: true },
  locations: [locationSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);
