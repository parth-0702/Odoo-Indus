import { api, CreateOperationDTO } from '@/lib/api';

/**
 * Dexie outbox removed.
 * If you need offline support later, reintroduce an outbox using e.g. localStorage/Service Worker.
 */

export async function enqueueOperation(_op: CreateOperationDTO) {
  throw new Error('Offline outbox is not available (Dexie removed).');
}

export async function processOutboxOnce() {
  return { processed: 0 };
}

export function startOutboxSyncLoop() {
  return () => {};
}

export async function isOnline() {
  return navigator.onLine;
}

export function wireOnlineEvents(onOnline: () => void) {
  const handler = () => onOnline();
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}

// Helper retained for future use
export async function createAndPostOperation(op: CreateOperationDTO) {
  const created = await api.operations.create(op);
  return api.operations.post(created._id);
}
