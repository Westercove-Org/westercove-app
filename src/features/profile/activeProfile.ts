import type { StateStorage } from 'zustand/middleware';

import { secureStorage } from '@/lib/secureStorage';

/**
 * The active test-profile id. Each profile gets its own namespaced copy of the
 * persisted stores (session/entries/questions/library), mirroring the demo's
 * per-profile localStorage blobs. Kept as an in-memory variable so the storage
 * key can be computed synchronously on both web and native.
 *
 * This module must stay dependency-free (no store imports) — the data stores
 * import `scopedStorage` from here, and `profilesStore` drives `setActiveId`,
 * so a leaf module avoids an import cycle.
 */
let activeId = 'p-1';

export function getActiveId(): string {
  return activeId;
}

export function setActiveId(id: string): void {
  if (id) activeId = id;
}

/** Per-profile storage: keys are `westercove.<activeId>.<suffix>`. */
export function scopedStorage(suffix: string): StateStorage {
  const key = () => `westercove.${activeId}.${suffix}`;
  return {
    getItem: (_name) => secureStorage.getItem(key()),
    setItem: (_name, value) => secureStorage.setItem(key(), value),
    removeItem: (_name) => secureStorage.removeItem(key()),
  };
}

/** Clear one profile's namespaced data (used when deleting a profile). */
export async function clearProfileData(id: string): Promise<void> {
  await Promise.all(
    ['session', 'entries', 'questions', 'library'].map((suffix) =>
      secureStorage.removeItem(`westercove.${id}.${suffix}`),
    ),
  );
}
