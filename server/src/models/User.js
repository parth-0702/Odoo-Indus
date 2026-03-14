import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    loginId: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, unique: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'manager', 'staff'], default: 'staff' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

// Note: `unique: true` already creates indexes; avoid duplicating with `schema.index()`.

export const User = mongoose.model('User', UserSchema);
