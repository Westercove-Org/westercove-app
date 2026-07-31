import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '@/lib/secureStorage';

/** User-facing theme control: follow the OS, or force a mode. */
export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

/** Persisted theme preference (survives reloads). Defaults to following the OS. */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'westercove.theme',
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ mode: s.mode }),
    },
  ),
);
