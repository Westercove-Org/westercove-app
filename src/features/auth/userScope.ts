import { useEntriesStore } from '@/features/journal/entriesStore';
import type { Entry } from '@/features/journal/types';
import { QUESTIONS_EMPTY, useQuestionsStore } from '@/features/questions/questionsStore';
import { setActiveUserId } from '@/lib/userScopedStorage';
import { getPersonaById } from './demoPersonas';

/**
 * Point every per-user store at `userId`, loading that account's own content.
 *
 * - The entries store selects (and, the first time only, seeds) this account's
 *   journal. A demo persona is seeded from its fixture; anyone else falls back
 *   to `fallbackSeed` when given.
 * - The questions store is reset to empty and then rehydrated from this user's
 *   namespaced slot, so profile-question progress follows the account.
 */
export function activateUserStores(userId: string, fallbackSeed?: Entry[]): void {
  setActiveUserId(userId);

  const persona = getPersonaById(userId);
  const seed = persona?.seedEntries ?? fallbackSeed;
  useEntriesStore.getState().setActiveUser(userId, seed);

  useQuestionsStore.setState(QUESTIONS_EMPTY);
  void useQuestionsStore.persist.rehydrate();
}

/** Detach every per-user store on sign-out. */
export function deactivateUserStores(): void {
  setActiveUserId(null);
  useEntriesStore.getState().clearActiveUser();
  useQuestionsStore.setState(QUESTIONS_EMPTY);
}
