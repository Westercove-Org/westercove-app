import { resetSession, startBlankSession, useSessionStore } from '@/features/auth/sessionStore';
import { resetEntries, useEntriesStore } from '@/features/journal/entriesStore';
import { useWhatIKnowStore } from '@/features/profile/whatIKnowStore';
import { resetCadence, useCadenceStore } from '@/features/questions/demoCadenceStore';
import { resetQuestions, useQuestionsStore } from '@/features/questions/questionsStore';
import { resetLibrary, useLibraryStore } from '@/features/discover/libraryStore';
import { resetHardDates, useHardDatesStore } from '@/features/dates/hardDatesStore';
import type { AuthUser } from '@/features/auth/types';
import { secureStorage } from '@/lib/secureStorage';
import {
  CADENCE_BASE,
  DATES_BASE,
  ENTRIES_BASE,
  LIBRARY_BASE,
  QUESTIONS_BASE,
  SESSION_BASE,
  profileKey,
} from './profileKeys';

/**
 * Point every per-profile store at the given profile's storage keys and
 * rehydrate them, so switching profiles swaps the whole person in one call.
 *
 * Each store is first reset to its blank initial state, because zustand's
 * persist.rehydrate() leaves the current in-memory state untouched when a key
 * has nothing stored yet — without the reset, a brand-new profile would inherit
 * the previous person's data.
 *
 * When `blankUser` is provided (create / reset), a fresh empty session is seeded
 * after rehydration so the router guard routes the new person to the gate.
 */
export async function bindProfileStores(
  id: string,
  opts: { blankUser?: AuthUser; fresh?: boolean } = {},
): Promise<void> {
  const bind = async (
    store: { persist: { setOptions: (o: { name: string }) => void; rehydrate: () => Promise<void> | void } },
    base: string,
    reset: () => void,
  ) => {
    const key = profileKey(base, id);
    // `fresh` (used by reset) must wipe the person back to blank even when data
    // is stored under this key. Otherwise we only reset when nothing is stored.
    const raw = opts.fresh ? null : await secureStorage.getItem(key);
    // Point future writes at the target key BEFORE touching state, so a reset
    // never clobbers the previously-active profile's storage.
    store.persist.setOptions({ name: key });
    if (raw != null) {
      // Existing profile: load its stored state.
      await store.persist.rehydrate();
    } else {
      // Brand-new / reset profile: start blank, persisting the blank state to
      // the target key (rehydrate would otherwise leave stale in-memory state).
      reset();
    }
  };

  await Promise.all([
    bind(useSessionStore, SESSION_BASE, resetSession),
    bind(useEntriesStore, ENTRIES_BASE, resetEntries),
    bind(useQuestionsStore, QUESTIONS_BASE, resetQuestions),
    bind(useLibraryStore, LIBRARY_BASE, resetLibrary),
    bind(useCadenceStore, CADENCE_BASE, resetCadence),
    bind(useHardDatesStore, DATES_BASE, resetHardDates),
  ]);

  if (opts.blankUser && !useSessionStore.getState().session) {
    startBlankSession(opts.blankUser);
  }

  // What I Know is derived from the (now-bound) session, not persisted itself.
  useWhatIKnowStore.getState().hydrateFromSession();
}
