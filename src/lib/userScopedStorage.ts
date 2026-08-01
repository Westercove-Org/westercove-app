import { secureStorage } from './secureStorage';

/**
 * A per-user view over {@link secureStorage}. Persisted stores that hold a
 * signed-in person's own content (their journal question progress, etc.) write
 * through this so each account keeps a separate copy — signing out and back in
 * as someone else never shows the previous person's data, and each person's
 * content survives the switch.
 *
 * The active user id is set on sign-in (and cleared on sign-out) via
 * {@link setActiveUserId}. Keys are suffixed with that id, so the same store
 * name maps to a different slot per account.
 */

const GUEST = '__guest__';
let activeUserId = GUEST;

/** Point per-user storage at a signed-in account (or the guest slot when null). */
export function setActiveUserId(id: string | null | undefined): void {
  activeUserId = id && id.length > 0 ? id : GUEST;
}

export function getActiveUserId(): string {
  return activeUserId;
}

export const userScopedStorage = {
  getItem(key: string): Promise<string | null> {
    return secureStorage.getItem(`${key}::${activeUserId}`);
  },
  setItem(key: string, value: string): Promise<void> {
    return secureStorage.setItem(`${key}::${activeUserId}`, value);
  },
  removeItem(key: string): Promise<void> {
    return secureStorage.removeItem(`${key}::${activeUserId}`);
  },
};
