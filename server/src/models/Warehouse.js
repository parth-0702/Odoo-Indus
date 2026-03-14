import mongoose from 'mongoose';

const WarehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, default: '', trim: true },
    manager: { type: String, default: '', trim: true },
    capacity: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

WarehouseSchema.index({ name: 1 }, { unique: true });

export const Warehouse = mongoose.model('Warehouse', WarehouseSchema);
