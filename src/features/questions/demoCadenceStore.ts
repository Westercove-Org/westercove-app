import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '@/lib/secureStorage';
import { CADENCE_BASE, profileKey } from '@/features/profiles/profileKeys';

/** Minutes a single simulated journaling session represents (demo copy). */
export const SESSION_MINUTES = 8;

interface CadenceState {
  /** Number of simulated journaling sessions so far. Unlocks question buckets. */
  stage: number;
  /** Talk-minutes attributed to the most recent simulated session. */
  sessionMinutes: number;
  /** Cumulative talk-minutes across all simulated sessions. */
  totalMinutes: number;

  simulateSession: () => void;
  resetProgress: () => void;
}

export const useCadenceStore = create<CadenceState>()(
  persist(
    (set) => ({
      stage: 0,
      sessionMinutes: 0,
      totalMinutes: 0,

      simulateSession() {
        set((s) => ({
          stage: s.stage + 1,
          sessionMinutes: SESSION_MINUTES,
          totalMinutes: s.totalMinutes + SESSION_MINUTES,
        }));
      },

      resetProgress() {
        set({ stage: 0, sessionMinutes: 0, totalMinutes: 0 });
      },
    }),
    {
      name: profileKey(CADENCE_BASE, 'unbound'),
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({
        stage: s.stage,
        sessionMinutes: s.sessionMinutes,
        totalMinutes: s.totalMinutes,
      }),
      skipHydration: true,
    },
  ),
);

/** Reset cadence to zero (used when switching/creating profiles). */
export function resetCadence() {
  useCadenceStore.setState({ stage: 0, sessionMinutes: 0, totalMinutes: 0 });
}
