const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  receivedQuantity: { type: Number, default: 0 },
});

const receiptSchema = new mongoose.Schema({
  receiptNumber: { type: String, unique: true },
  supplier: { type: String, required: true, trim: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  locationName: { type: String, required: true },
  lines: [lineItemSchema],
  status: { type: String, enum: ['draft', 'waiting', 'ready', 'done', 'cancelled'], default: 'draft' },
  note: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: { type: Date },
}, { timestamps: true });

receiptSchema.pre('save', async function (next) {
  if (!this.receiptNumber) {
    const count = await this.constructor.countDocuments();
    this.receiptNumber = `RCP-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Receipt', receiptSchema);
