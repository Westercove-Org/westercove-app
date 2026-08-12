import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useSessionStore } from '@/features/auth/sessionStore';
import { useLibraryStore } from '@/features/discover/libraryStore';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { useQuestionsStore } from '@/features/questions/questionsStore';
import { secureStorage } from '@/lib/secureStorage';
import { clearProfileData, setActiveId } from './activeProfile';
import { DEMO_ROSTER, type DemoProfile } from './demoProfiles';
import { useWhatIKnowStore } from './whatIKnowStore';

/**
 * Test-profile roster. Each profile is a separate saved "person" in this
 * browser: its own namespaced copy of the session/entries/questions/library
 * stores (see activeProfile.ts). Switching or creating a profile just changes
 * which namespace those stores read, so every profile keeps its own data —
 * mirroring the demo's per-profile localStorage blobs.
 */

export interface Persona {
  id: string;
  name: string;
}

interface ProfilesState {
  profiles: Persona[];
  activeId: string;
  /**
   * Profiles whose namespace has been written at least once. A roster profile
   * nobody has opened yet has nothing to rehydrate, so it must be reset rather
   * than left holding the previous profile's data.
   */
  initialized: string[];
  switchTo: (id: string) => Promise<void>;
  createNew: () => Promise<void>;
  remove: (id: string) => void;
  setActiveName: (name: string) => void;
  /** Open the test profile behind a recognized sign-in name. */
  signInAs: (profile: DemoProfile) => Promise<void>;
}

/** The nine test profiles, listed and blank until a tester fills one in. */
const ROSTER_SEED: Persona[] = DEMO_ROSTER.map((p) => ({ id: p.id, name: p.name }));

/**
 * Point the data stores at profile `id` and load its data.
 * - `fresh` (a brand-new profile): reset each store to its seed. Persist then
 *   saves that seed into the new namespace.
 * - otherwise (switch / boot): rehydrate each store from that profile's
 *   namespace. (We must NOT reset here — a reset auto-saves over the target
 *   namespace before rehydrate can read it.)
 */
export async function reloadProfileStores(id: string, fresh = false): Promise<void> {
  setActiveId(id);
  if (fresh) {
    // Stay signed in but unonboarded so a new test profile lands in onboarding.
    useSessionStore.getState().beginOnboardingSession();
    useEntriesStore.getState().resetForProfile();
    useQuestionsStore.getState().resetForProfile();
    useLibraryStore.getState().resetForProfile();
    useWhatIKnowStore.setState({ learned: [] });
  } else {
    await Promise.all([
      useSessionStore.persist.rehydrate(),
      useEntriesStore.persist.rehydrate(),
      useQuestionsStore.persist.rehydrate(),
      useLibraryStore.persist.rehydrate(),
      useWhatIKnowStore.persist.rehydrate(),
    ]);
  }
  useWhatIKnowStore.getState().hydrateFromSession();
}

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set, get) => ({
      profiles: ROSTER_SEED,
      activeId: ROSTER_SEED[0].id,
      initialized: [],

      async switchTo(id) {
        if (id === get().activeId || !get().profiles.some((p) => p.id === id)) return;
        const fresh = !get().initialized.includes(id);
        set((s) => ({
          activeId: id,
          initialized: fresh ? [...s.initialized, id] : s.initialized,
        }));
        await reloadProfileStores(id, fresh);
      },

      async createNew() {
        const id = `p-${Date.now()}`;
        set((s) => ({
          profiles: [...s.profiles, { id, name: '' }],
          activeId: id,
          initialized: [...s.initialized, id],
        }));
        await reloadProfileStores(id, true);
      },

      async signInAs(profile) {
        const known = get().profiles.some((p) => p.id === profile.id);
        const fresh = !get().initialized.includes(profile.id);
        const wasActive = get().activeId === profile.id;
        set((s) => ({
          profiles: known ? s.profiles : [...s.profiles, { id: profile.id, name: profile.name }],
          activeId: profile.id,
          initialized: fresh ? [...s.initialized, profile.id] : s.initialized,
        }));
        // Always load on a fresh profile; on a returning one, only when it is
        // not already the active namespace.
        if (fresh || !wasActive) await reloadProfileStores(profile.id, fresh);
      },

      remove(id) {
        const wasActive = get().activeId === id;
        set((s) => {
          const profiles = s.profiles.filter((p) => p.id !== id);
          const list = profiles.length ? profiles : ROSTER_SEED;
          const activeId = wasActive ? list[0].id : s.activeId;
          return { profiles: list, activeId };
        });
        void clearProfileData(id);
        if (wasActive) void reloadProfileStores(get().activeId);
      },

      setActiveName(name) {
        const label = name.trim();
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === s.activeId ? { ...p, name: label } : p)),
        }));
      },
    }),
    {
      name: 'westercove.profiles',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        // Data stores auto-hydrate under the default id first; once the active
        // id is known, point them at the right namespace.
        if (state) void reloadProfileStores(state.activeId);
      },
    },
  ),
);
