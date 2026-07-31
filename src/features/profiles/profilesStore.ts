import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthUser } from '@/features/auth/types';
import { secureStorage } from '@/lib/secureStorage';
import { bindProfileStores } from './bindProfileStores';

/**
 * A single test profile: a separate saved person on this device. `setUp` is
 * false for a profile that has been created but not yet taken through the
 * day-zero gate ("New test (not set up yet)" in the demo).
 */
interface Profile {
  id: string;
  label: string;
  avatar: string;
  createdAt: string;
  setUp: boolean;
}

interface ProfilesState {
  /** True once the roster has rehydrated and the active stores are bound. */
  hydrated: boolean;
  /** Whether the browser is signed in at all (shared across profiles). */
  signedIn: boolean;
  user?: AuthUser;
  profiles: Profile[];
  activeId: string | null;

  signIn: (user: AuthUser) => void;
  signOut: () => void;
  /** Create a blank profile, make it active, and bind its (empty) stores. */
  createProfile: () => Promise<string>;
  switchProfile: (id: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  resetActiveProfile: () => Promise<void>;
  /** Called when the gate completes: name the profile and mark it set up. */
  markActiveSetUp: (label: string) => void;
}

let seq = 0;
function newId(): string {
  seq += 1;
  return `pf_${Date.now().toString(36)}_${seq}`;
}

function avatarFor(label: string): string {
  const trimmed = label.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      signedIn: false,
      user: undefined,
      profiles: [],
      activeId: null,

      signIn(user) {
        set({ signedIn: true, user });
      },

      signOut() {
        // Keep the roster; only drop the browser-level sign-in.
        set({ signedIn: false });
      },

      async createProfile() {
        const id = newId();
        const profile: Profile = {
          id,
          label: 'New test',
          avatar: '?',
          createdAt: new Date().toISOString(),
          setUp: false,
        };
        set((s) => ({ profiles: [...s.profiles, profile], activeId: id }));
        // Bind (and clear) the per-profile stores, then seed a blank session so
        // the guard routes to the gate rather than back to sign-in.
        await bindProfileStores(id, { blankUser: get().user });
        return id;
      },

      async switchProfile(id) {
        if (get().activeId === id) return;
        set({ activeId: id });
        await bindProfileStores(id);
      },

      async deleteProfile(id) {
        const { profiles, activeId } = get();
        const remaining = profiles.filter((p) => p.id !== id);
        if (id === activeId) {
          const nextActive = remaining[0]?.id ?? null;
          set({ profiles: remaining, activeId: nextActive });
          if (nextActive) await bindProfileStores(nextActive);
        } else {
          set({ profiles: remaining });
        }
      },

      async resetActiveProfile() {
        const id = get().activeId;
        if (!id) return;
        // Clear the person back to blank and mark them not-set-up again.
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === id ? { ...p, label: 'New test', avatar: '?', setUp: false } : p,
          ),
        }));
        await bindProfileStores(id, { blankUser: get().user, fresh: true });
      },

      markActiveSetUp(label) {
        const id = get().activeId;
        if (!id) return;
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === id
              ? { ...p, label: label.trim() || p.label, avatar: avatarFor(label || p.label), setUp: true }
              : p,
          ),
        }));
      },
    }),
    {
      name: 'westercove.profiles',
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({
        signedIn: s.signedIn,
        user: s.user,
        profiles: s.profiles,
        activeId: s.activeId,
      }),
      onRehydrateStorage: () => (state) => {
        // After the roster loads, bind the active profile's stores (if any),
        // then flip hydrated so the router guard can act.
        const activeId = state?.activeId ?? null;
        const finish = () => useProfilesStore.setState({ hydrated: true });
        if (activeId) {
          void bindProfileStores(activeId).then(finish, finish);
        } else {
          finish();
        }
      },
    },
  ),
);
