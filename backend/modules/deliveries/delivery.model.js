const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const deliverySchema = new mongoose.Schema({
  deliveryNumber: { type: String, unique: true },
  customer: { type: String, required: true, trim: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, required: true },
  locationName: { type: String, required: true },
  lines: [lineItemSchema],
  status: { type: String, enum: ['draft', 'waiting', 'ready', 'done', 'cancelled'], default: 'draft' },
  note: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  validatedAt: { type: Date },
}, { timestamps: true });

deliverySchema.pre('save', async function (next) {
  if (!this.deliveryNumber) {
    const count = await this.constructor.countDocuments();
    this.deliveryNumber = `DEL-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);
