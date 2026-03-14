import crypto from 'node:crypto';

export function hashPassword(password) {
  // Simple SHA-256 for demo. Replace with bcrypt/argon2 for production.
  return crypto.createHash('sha256').update(password).digest('hex');
}
