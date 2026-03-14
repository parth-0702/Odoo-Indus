const mongoose = require('mongoose');

const adjustmentSchema = new mongoose.Schema({
  adjustmentNumber: { type: String, unique: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  locationName: { type: String, required: true },
  previousQuantity: { type: Number, required: true },
  countedQuantity: { type: Number, required: true },
  difference: { type: Number },
  reason: { type: String, trim: true },
  status: { type: String, enum: ['draft', 'done'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  appliedAt: { type: Date },
}, { timestamps: true });

adjustmentSchema.pre('save', async function (next) {
  if (!this.adjustmentNumber) {
    const count = await this.constructor.countDocuments();
    this.adjustmentNumber = `ADJ-${String(count + 1).padStart(5, '0')}`;
  }
  this.difference = this.countedQuantity - this.previousQuantity;
  next();
});

module.exports = mongoose.model('Adjustment', adjustmentSchema);
