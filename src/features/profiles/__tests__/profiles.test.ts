jest.mock('expo-secure-store', () => {
  const mem: Record<string, string> = {};
  return {
    getItemAsync: jest.fn((k: string) => Promise.resolve(mem[k] ?? null)),
    setItemAsync: jest.fn((k: string, v: string) => {
      mem[k] = v;
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((k: string) => {
      delete mem[k];
      return Promise.resolve();
    }),
  };
});

import { useSessionStore } from '@/features/auth/sessionStore';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { useProfilesStore } from '@/features/profiles/profilesStore';
import { dueDayIndex } from '@/features/questions/questionsStore';
import { useCadenceStore } from '@/features/questions/demoCadenceStore';
import { useLibraryStore } from '@/features/discover/libraryStore';

beforeEach(() => {
  useProfilesStore.setState({ profiles: [], activeId: null, signedIn: false, user: undefined });
});

describe('test profiles isolation', () => {
  it('keeps each profile’s journal entries separate', async () => {
    useProfilesStore.getState().signIn({ email: 'demo', firstName: 'Demo' });

    const a = await useProfilesStore.getState().createProfile();
    await useEntriesStore.getState().addEntry({ type: 'Memory', text: 'Profile A memory' });
    expect(useEntriesStore.getState().entries).toHaveLength(1);

    // A brand-new profile begins blank — no bleed from A.
    const b = await useProfilesStore.getState().createProfile();
    expect(useEntriesStore.getState().entries).toHaveLength(0);
    await useEntriesStore.getState().addEntry({ type: 'Letter', text: 'Profile B letter' });

    // Switching back to A restores A’s single entry.
    await useProfilesStore.getState().switchProfile(a);
    expect(useEntriesStore.getState().entries).toHaveLength(1);
    expect(useEntriesStore.getState().entries[0].turns[0].text).toBe('Profile A memory');

    await useProfilesStore.getState().switchProfile(b);
    expect(useEntriesStore.getState().entries).toHaveLength(1);
  });

  it('a fresh profile still needs the gate', async () => {
    useProfilesStore.getState().signIn({ email: 'demo' });
    await useProfilesStore.getState().createProfile();
    expect(useSessionStore.getState().session?.gateComplete).toBe(false);
  });

  it('markActiveSetUp names the active profile and marks it set up', async () => {
    useProfilesStore.getState().signIn({ email: 'demo' });
    const id = await useProfilesStore.getState().createProfile();
    useProfilesStore.getState().markActiveSetUp('Corinne');
    const p = useProfilesStore.getState().profiles.find((x) => x.id === id)!;
    expect(p.setUp).toBe(true);
    expect(p.label).toBe('Corinne');
    expect(p.avatar).toBe('C');
  });

  it('deleteProfile removes it and re-binds a remaining profile', async () => {
    useProfilesStore.getState().signIn({ email: 'demo' });
    const a = await useProfilesStore.getState().createProfile();
    const b = await useProfilesStore.getState().createProfile();
    expect(useProfilesStore.getState().activeId).toBe(b);
    await useProfilesStore.getState().deleteProfile(b);
    expect(useProfilesStore.getState().profiles.map((p) => p.id)).toEqual([a]);
    expect(useProfilesStore.getState().activeId).toBe(a);
  });

  it('resetActiveProfile clears entries and returns the person to the gate', async () => {
    useProfilesStore.getState().signIn({ email: 'demo' });
    const id = await useProfilesStore.getState().createProfile();
    useProfilesStore.getState().markActiveSetUp('Corinne');
    useSessionStore.getState().completeGate({ mode: 'human', skipped: [], callName: 'Corinne' });
    await useEntriesStore.getState().addEntry({ type: 'Memory', text: 'something' });

    await useProfilesStore.getState().resetActiveProfile();

    expect(useEntriesStore.getState().entries).toHaveLength(0);
    expect(useSessionStore.getState().session?.gateComplete).toBe(false);
    const p = useProfilesStore.getState().profiles.find((x) => x.id === id)!;
    expect(p.setUp).toBe(false);
  });

  it('signOut drops the sign-in but keeps the roster', async () => {
    useProfilesStore.getState().signIn({ email: 'demo' });
    await useProfilesStore.getState().createProfile();
    useProfilesStore.getState().signOut();
    expect(useProfilesStore.getState().signedIn).toBe(false);
    expect(useProfilesStore.getState().profiles.length).toBe(1);
  });
});

describe('demo cadence unlocks question buckets', () => {
  it('exposes the first bucket at stage 0 and one more per session', () => {
    // total buckets is large; first bucket available immediately.
    expect(dueDayIndex(0, 9)).toBe(0);
    expect(dueDayIndex(1, 9)).toBe(1);
    expect(dueDayIndex(20, 9)).toBe(8); // capped at last bucket
  });

  it('simulateSession advances the stage and minutes', () => {
    useCadenceStore.getState().resetProgress();
    useCadenceStore.getState().simulateSession();
    expect(useCadenceStore.getState().stage).toBe(1);
    expect(useCadenceStore.getState().totalMinutes).toBeGreaterThan(0);
    useCadenceStore.getState().resetProgress();
    expect(useCadenceStore.getState().stage).toBe(0);
  });
});

describe('per-profile library', () => {
  it('adds, toggles, and adds all', () => {
    useLibraryStore.setState({ bookIds: [] });
    useLibraryStore.getState().add('b1');
    expect(useLibraryStore.getState().has('b1')).toBe(true);
    useLibraryStore.getState().toggle('b1');
    expect(useLibraryStore.getState().has('b1')).toBe(false);
    useLibraryStore.getState().addAll(['b1', 'b2', 'b3']);
    expect(useLibraryStore.getState().bookIds.length).toBeGreaterThan(1);
  });
});
