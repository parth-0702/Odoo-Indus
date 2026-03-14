const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const transferSchema = new mongoose.Schema({
  transferNumber: { type: String, unique: true },
  fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  fromLocationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  fromLocationName: { type: String, required: true },
  toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  toLocationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  toLocationName: { type: String, required: true },
  lines: [lineItemSchema],
  status: { type: String, enum: ['draft', 'waiting', 'ready', 'done', 'cancelled'], default: 'draft' },
  note: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: { type: Date },
}, { timestamps: true });

transferSchema.pre('save', async function (next) {
  if (!this.transferNumber) {
    const count = await this.constructor.countDocuments();
    this.transferNumber = `TRF-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Transfer', transferSchema);
