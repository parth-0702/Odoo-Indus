import mongoose from 'mongoose';

export const OP_TYPES = [
  'initial',
  'receipt',
  'delivery',
  'transfer_in',
  'transfer_out',
  'adjustment',
];

const StockLedgerSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    operationType: { type: String, enum: OP_TYPES, required: true, index: true },
    quantityChange: { type: Number, required: true },

    referenceType: {
      type: String,
      enum: ['receipt', 'delivery', 'transfer', 'adjustment', 'initial'],
      required: true,
      index: true,
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    referenceNumber: { type: String, default: '', trim: true },

    userId: { type: String, default: '' },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StockLedgerSchema.index({ productId: 1, warehouseId: 1 });
StockLedgerSchema.index({ referenceType: 1, referenceId: 1, operationType: 1 }, { unique: true });

export const StockLedger = mongoose.model('StockLedger', StockLedgerSchema);
