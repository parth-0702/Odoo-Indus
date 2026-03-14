import { hybrid } from '@/lib/api';

export function isDbOnlyMode() {
  return hybrid.dbOnly || !hybrid.enabled;
}

export function requireHybridEnabled() {
  if (!hybrid.enabled) throw new Error('Hybrid mode disabled');
}
