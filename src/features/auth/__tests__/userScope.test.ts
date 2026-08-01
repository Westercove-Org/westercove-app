jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { useSessionStore } from '@/features/auth/sessionStore';
import { useEntriesStore } from '@/features/journal/entriesStore';

const PATRICE = 'patrice-ellison';
const MARIA = 'maria-delgado';

const entries = () => useEntriesStore.getState().entries;

describe('per-persona journaling persistence', () => {
  it('loads each persona’s own journal and keeps them separate', () => {
    useSessionStore.getState().signInDemo(PATRICE);
    const patriceCount = entries().length;
    expect(patriceCount).toBeGreaterThan(0);
    expect(useSessionStore.getState().session?.user.firstName).toBe('Patrice');

    useSessionStore.getState().signInDemo(MARIA);
    const mariaHeadlines = entries().map((e) => e.headline);
    // Maria’s journal is her own — none of Patrice’s entries bleed through.
    expect(mariaHeadlines).not.toContain('Dad at the workbench, sawdust and coffee');
    expect(entries().length).toBeGreaterThan(0);
  });

  it('signing out clears the visible journal', () => {
    useSessionStore.getState().signInDemo(PATRICE);
    expect(entries().length).toBeGreaterThan(0);
    useSessionStore.getState().signOut();
    expect(entries()).toEqual([]);
  });

  it('content added as a persona is still there after switching away and back', async () => {
    useSessionStore.getState().signInDemo(PATRICE);
    const before = entries().length;
    const { id } = await useEntriesStore
      .getState()
      .addEntry({ type: 'Journal', text: 'A new thought I added during the demo.' });
    expect(entries().length).toBe(before + 1);

    // Switch to the other persona, then sign out entirely...
    useSessionStore.getState().signInDemo(MARIA);
    expect(entries().find((e) => e.id === id)).toBeUndefined();
    useSessionStore.getState().signOut();

    // ...and come back: the added entry is still in Patrice’s journal.
    useSessionStore.getState().signInDemo(PATRICE);
    expect(entries().length).toBe(before + 1);
    expect(entries().find((e) => e.id === id)).toBeDefined();
  });
});
