import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    category: { type: String, default: '', trim: true },
    unit: { type: String, default: 'pcs', trim: true },
    reorderLevel: { type: Number, default: 0 },
    description: { type: String, default: '', trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ name: 1 });

export const Product = mongoose.model('Product', ProductSchema);
