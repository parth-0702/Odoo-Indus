import express from 'express';
import crypto from 'node:crypto';
import { User } from '../models/User.js';

export const authRouter = express.Router();

function hashPassword(password) {
  // Simple SHA-256 for demo. Replace with bcrypt/argon2 for production.
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Debug helper: list supported auth routes
authRouter.get('/routes', (_req, res) => {
  res.json({
    data: {
      routes: ['POST /login', 'POST /signup', 'POST /dev/bootstrap-admin'],
    },
  });
});

authRouter.post('/login', async (req, res) => {
  const { loginId, password } = req.body ?? {};
  if (!loginId || !password) return res.status(400).json({ error: 'loginId and password are required' });

  const user = await User.findOne({ loginId, status: 'active' }).lean();
  if (!user) return res.status(401).json({ error: 'Invalid login ID or password.' });

  const passHash = hashPassword(password);
  if (user.passwordHash !== passHash) return res.status(401).json({ error: 'Invalid login ID or password.' });

  // Return safe user object (no passwordHash)
  res.json({
    data: {
      id: String(user._id),
      loginId: user.loginId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

authRouter.post('/signup', async (req, res) => {
  const { loginId, email, fullName, password } = req.body ?? {};
  if (!loginId || !email || !fullName || !password) {
    return res.status(400).json({ error: 'loginId, email, fullName and password are required' });
  }

  const existingLogin = await User.findOne({ loginId }).lean();
  if (existingLogin) return res.status(409).json({ error: 'Login ID already taken.' });

  const existingEmail = await User.findOne({ email }).lean();
  if (existingEmail) return res.status(409).json({ error: 'Email already registered.' });

  const created = await User.create({
    loginId,
    email,
    fullName,
    role: 'staff',
    status: 'active',
    passwordHash: hashPassword(password),
  });

  res.status(201).json({
    data: {
      id: String(created._id),
      loginId: created.loginId,
      email: created.email,
      fullName: created.fullName,
      role: created.role,
    },
  });
});

// Dev-only helper: create an initial admin if none exists.
authRouter.post('/dev/bootstrap-admin', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'Not found' });

  const existing = await User.findOne({ role: 'admin' }).lean();
  if (existing) {
    return res.json({ data: { ok: true, alreadyExisted: true, loginId: existing.loginId } });
  }

  const loginId = process.env.BOOTSTRAP_ADMIN_LOGIN || 'admin';
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || 'Admin@123';
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@example.com';

  const created = await User.create({
    loginId,
    email,
    fullName: 'Admin',
    role: 'admin',
    passwordHash: hashPassword(password),
  });

  res.status(201).json({ data: { ok: true, created: true, loginId: created.loginId } });
});
