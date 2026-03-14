import mongoose from 'mongoose';

const UnitSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

UnitSchema.index({ name: 1 }, { unique: true });
UnitSchema.index({ symbol: 1 });

export const Unit = mongoose.model('Unit', UnitSchema);
