import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '@/lib/secureStorage';
import { LIBRARY_BASE, profileKey } from '@/features/profiles/profileKeys';

/**
 * The per-profile book library. A profile begins with no books chosen; until
 * any are added the companion draws softly on the whole Discover list. Adding a
 * book pins it to this person's shelf.
 */
interface LibraryState {
  /** Book ids the person has added to their library. */
  bookIds: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  addAll: (ids: string[]) => void;
  has: (id: string) => boolean;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      bookIds: [],

      add(id) {
        set((s) => (s.bookIds.includes(id) ? s : { bookIds: [...s.bookIds, id] }));
      },

      remove(id) {
        set((s) => ({ bookIds: s.bookIds.filter((b) => b !== id) }));
      },

      toggle(id) {
        set((s) =>
          s.bookIds.includes(id)
            ? { bookIds: s.bookIds.filter((b) => b !== id) }
            : { bookIds: [...s.bookIds, id] },
        );
      },

      addAll(ids) {
        set({ bookIds: [...ids] });
      },

      has(id) {
        return get().bookIds.includes(id);
      },
    }),
    {
      name: profileKey(LIBRARY_BASE, 'unbound'),
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ bookIds: s.bookIds }),
      skipHydration: true,
    },
  ),
);

/** Reset the library to empty (used when switching/creating profiles). */
export function resetLibrary() {
  useLibraryStore.setState({ bookIds: [] });
}
