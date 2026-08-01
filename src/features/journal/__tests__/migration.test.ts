// Proves that a journal saved under the old single-journal layout
// (`{ entries: [...] }`) is preserved — not deleted — when the store upgrades
// to the per-account layout, and that it can be recovered by signing in.

// Seed storage with a v0 payload (the old single-journal shape) before the
// store module loads. Inlined inside the factory — jest.mock cannot reference
// out-of-scope variables.
jest.mock('expo-secure-store', () => {
  const oldEntry = {
    id: 'old1',
    type: 'Memory',
    headline: 'Something I wrote yesterday',
    createdAt: '2026-07-31T12:00:00.000Z',
    safetyLevel: 1,
    turns: [{ id: 'old1-u', role: 'user', text: 'Please keep this.', at: '2026-07-31T12:00:00.000Z' }],
  };
  const store: Record<string, string> = {
    'westercove.entries': JSON.stringify({ state: { entries: [oldEntry] }, version: 0 }),
  };
  return {
    getItemAsync: jest.fn((k: string) => Promise.resolve(store[k] ?? null)),
    setItemAsync: jest.fn((k: string, v: string) => {
      store[k] = v;
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((k: string) => {
      delete store[k];
      return Promise.resolve();
    }),
  };
});

import { LEGACY_USER, useEntriesStore } from '@/features/journal/entriesStore';
import { useSessionStore } from '@/features/auth/sessionStore';

describe('legacy journal migration', () => {
  it('preserves a pre-upgrade journal and lets a returning sign-in recover it', async () => {
    // Let the persisted v0 payload rehydrate + migrate.
    await useEntriesStore.persist.rehydrate();

    const legacy = useEntriesStore.getState().byUser[LEGACY_USER];
    expect(legacy).toBeDefined();
    expect(legacy.map((e) => e.id)).toContain('old1');

    // Signing in as a fresh account surfaces the preserved journal.
    await useSessionStore.getState().signIn('someone@example.com', 'pw');
    expect(useEntriesStore.getState().entries.map((e) => e.id)).toContain('old1');
  });
});
