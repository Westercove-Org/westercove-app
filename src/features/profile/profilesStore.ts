import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useSessionStore } from '@/features/auth/sessionStore';
import { secureStorage } from '@/lib/secureStorage';

/**
 * Demo "Test Profiles" — a browser-local persona switcher mirroring the
 * reference demo. Switching sets the active persona and reflects its name onto
 * the session greeting.
 *
 * ponytail: shallow isolation — switching updates the display name only, not a
 * full per-persona snapshot of entries/questions. Wire deep isolation if the
 * demo needs each persona to carry its own saved data.
 */

export interface Persona {
  id: string;
  name: string;
  /** false = "New test (not set up yet)". */
  setup: boolean;
}

interface ProfilesState {
  personas: Persona[];
  activeId: string;
  switchTo: (id: string) => void;
  createNew: () => void;
  remove: (id: string) => void;
}

function reflectName(name: string) {
  useSessionStore.getState().updateGate({ callName: name });
}

export const useProfilesStore = create<ProfilesState>()(
  persist(
    (set, get) => ({
      personas: [{ id: 'p-corinne', name: 'Corinne', setup: true }],
      activeId: 'p-corinne',

      switchTo(id) {
        const p = get().personas.find((x) => x.id === id);
        if (!p) return;
        set({ activeId: id });
        if (p.setup) reflectName(p.name);
      },

      createNew() {
        const id = `p-${Date.now()}`;
        set((s) => ({
          personas: [...s.personas, { id, name: 'New test', setup: false }],
          activeId: id,
        }));
      },

      remove(id) {
        set((s) => {
          const personas = s.personas.filter((p) => p.id !== id);
          const activeId =
            s.activeId === id ? (personas[0]?.id ?? '') : s.activeId;
          return { personas, activeId };
        });
      },
    }),
    {
      name: 'westercove.profiles',
      storage: createJSONStorage(() => secureStorage),
    },
  ),
);
