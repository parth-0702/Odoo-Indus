import mongoose from 'mongoose';

const OperationItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OperationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['receipt', 'delivery', 'transfer', 'adjustment'], required: true, index: true },
    referenceNumber: { type: String, required: true, trim: true },
    status: { type: String, enum: ['draft', 'ready', 'done', 'cancelled'], default: 'draft', index: true },

    // receipt/delivery/adjustment
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },

    // transfer
    sourceWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },
    destinationWarehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse' },

    date: { type: Date, default: () => new Date() },
    notes: { type: String, default: '', trim: true },

    // receipt/delivery extra
    supplier: { type: String, default: '', trim: true },
    customer: { type: String, default: '', trim: true },

    items: { type: [OperationItemSchema], default: [] },

    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
);

OperationSchema.index({ type: 1, referenceNumber: 1 }, { unique: true });

export const Operation = mongoose.model('Operation', OperationSchema);
