import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

CategorySchema.index({ name: 1 }, { unique: true });

export const Category = mongoose.model('Category', CategorySchema);
