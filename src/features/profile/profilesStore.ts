import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useSessionStore } from '@/features/auth/sessionStore';
import { useLibraryStore } from '@/features/discover/libraryStore';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { useQuestionsStore } from '@/features/questions/questionsStore';
import { secureStorage } from '@/lib/secureStorage';
import { setActiveId } from './activeProfile';
import { useWhatIKnowStore } from './whatIKnowStore';

/**
 * Per-profile local data. Each profile has its own namespaced copy of the
 * session/entries/questions/library stores (see activeProfile.ts); switching a
 * profile just changes which namespace those stores read. A real user has a
 * single profile; `startRealUser` collapses to it and wipes any leftover
 * demo/seed data on the first real sign-in.
 */

export interface Persona {
  id: string;
  name: string;
}

/** The single default profile a real user starts from. */
const DEFAULT_PROFILE: Persona = { id: 'p-1', name: '' };

interface ProfilesState {
  profiles: Persona[];
  activeId: string;
  /**
   * Profiles whose namespace has been written at least once. A roster profile
   * nobody has opened yet has nothing to rehydrate, so it must be reset rather
   * than left holding the previous profile's data.
   */
  initialized: string[];
  /** True once a real sign-in has collapsed to the single profile + wiped any
   * leftover demo/seed data — so the wipe runs exactly once. */
  realSignInDone: boolean;
  setActiveName: (name: string) => void;
  /** On the first real sign-in, wipe any local demo/seed data and start the
   * real user clean on the single default profile. Idempotent. */
  startRealUser: () => void;
}

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
      profiles: [DEFAULT_PROFILE],
      activeId: DEFAULT_PROFILE.id,
      initialized: [],
      realSignInDone: false,

      startRealUser() {
        if (get().realSignInDone) return;
        // Point the data stores at the single real-user namespace and reset each
        // to empty, so any leftover demo/seed data never surfaces for a real
        // user. The resets persist a clean slate into the `p-1` namespace.
        setActiveId(DEFAULT_PROFILE.id);
        useEntriesStore.getState().resetForProfile();
        useQuestionsStore.getState().resetForProfile();
        useLibraryStore.getState().resetForProfile();
        useWhatIKnowStore.setState({ learned: [] });
        set({
          profiles: [DEFAULT_PROFILE],
          activeId: DEFAULT_PROFILE.id,
          initialized: [DEFAULT_PROFILE.id],
          realSignInDone: true,
        });
      },

      setActiveName(name) {
        set((s) => {
          const idx = s.profiles.findIndex((p) => p.id === s.activeId);
          // A profile's label is the loved-one's name; a self-door profile (no
          // loved-one) gets a neutral "Profile N". Callers pass the loved-one
          // name (empty for the self door).
          const label = name.trim() || `Profile ${idx >= 0 ? idx + 1 : s.profiles.length + 1}`;
          return {
            profiles: s.profiles.map((p) => (p.id === s.activeId ? { ...p, name: label } : p)),
          };
        });
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
