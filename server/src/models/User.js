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

UserSchema.index({ loginId: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model('User', UserSchema);
