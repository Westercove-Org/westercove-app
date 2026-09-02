import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { scopedStorage } from '@/features/profile/activeProfile';
import type { EntryType } from '@/features/journal/entryTypes';

/**
 * The single in-progress compose draft (R-30). Autosaved per-profile as the
 * writer types, on any of the ten categories, so closing the app — or a crash
 * mid-sentence — never loses their words. Cleared once the entry is saved; a
 * plain Back keeps the draft (no scolding "unsaved changes" warning).
 */
interface DraftState {
  text: string;
  type: EntryType;
  setDraft: (draft: Partial<Pick<DraftState, 'text' | 'type'>>) => void;
  clear: () => void;
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      text: '',
      type: 'Journal',
      setDraft: (draft) => set(draft),
      clear: () => set({ text: '', type: 'Journal' }),
    }),
    {
      name: 'westercove.entry-draft',
      storage: createJSONStorage(() => scopedStorage('entry-draft')),
      partialize: (s) => ({ text: s.text, type: s.type }),
    },
  ),
);

/**
 * Re-point the draft to the active profile after a profile switch. The store is
 * a singleton, so its scoped storage key changing (setActiveId) does not by
 * itself move the in-memory draft; and persist.rehydrate() alone can't clear the
 * leak — on a profile with no stored draft it reads null and leaves the previous
 * profile's {text,type} in place. So read the (already re-pointed) scoped key
 * first: reset to empty when absent, else rehydrate the stored draft.
 */
export async function reloadDraftForActiveProfile(): Promise<void> {
  const raw = await scopedStorage('entry-draft').getItem('entry-draft');
  if (raw == null) {
    useDraftStore.setState({ text: '', type: 'Journal' });
  } else {
    await useDraftStore.persist.rehydrate();
  }
}
