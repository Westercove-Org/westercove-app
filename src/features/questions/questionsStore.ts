import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useSessionStore } from '@/features/auth/sessionStore';
import { userScopedStorage } from '@/lib/userScopedStorage';
import {
  DAYS_HUMAN,
  DAYS_PET,
  QUESTION_INTERVAL_MS,
  type DayBucket,
} from '@/constants/questions';

/**
 * State for the timer-driven profile questions. Talk-time accumulates while the
 * user is on an entry conversation screen; every completed interval unlocks the
 * next Day bucket. `daysShown` is how many buckets have already been surfaced —
 * a new Day is "due" when the interval count exceeds it.
 *
 * Persisted per signed-in account via userScopedStorage (localStorage on web),
 * so answers survive a reload and never leak between accounts.
 */

/** Durable question progress reset to its empty state — used when switching
 * accounts, before the incoming user's saved progress is rehydrated. */
export const QUESTIONS_EMPTY = {
  talkMs: 0,
  daysShown: 0,
  answers: {} as Record<string, string>,
  skipped: [] as string[],
  pending: null,
  deferAfterNo: false,
};

export type PendingMode = 'dialog' | 'direct';

export interface Pending {
  dayIndex: number;
  mode: PendingMode;
}

interface QuestionsState {
  /** Accumulated talk-time on entry screens, in ms. Persisted. */
  talkMs: number;
  /** How many Day buckets have been surfaced so far. Persisted. */
  daysShown: number;
  /** Answers keyed by question id. Persisted. */
  answers: Record<string, string>;
  /** Skipped question ids. Persisted. */
  skipped: string[];

  /** Transient: a Day awaiting presentation (not persisted). */
  pending: Pending | null;
  /** Transient: user declined this session; show directly on their return. */
  deferAfterNo: boolean;

  addTalkMs: (ms: number) => void;
  recordAnswer: (qid: string, value: string) => void;
  skipQuestion: (qid: string) => void;
  markDayShown: () => void;
  setPending: (pending: Pending | null) => void;
  declinePending: () => void;
}

/** The active module's Day buckets, chosen from the day-zero gate answer. */
export function activeDays(): DayBucket[] {
  const mode = useSessionStore.getState().session?.gateAnswers.mode;
  return mode === 'pet' ? DAYS_PET : DAYS_HUMAN;
}

/**
 * The highest Day index (0-based) unlocked by the accumulated talk-time, or -1
 * if none yet. Capped at the last available Day.
 */
export function dueDayIndex(talkMs: number, total: number): number {
  const intervals = Math.floor(talkMs / QUESTION_INTERVAL_MS);
  return Math.min(intervals, total) - 1;
}

export const useQuestionsStore = create<QuestionsState>()(
  persist(
    (set) => ({
      talkMs: 0,
      daysShown: 0,
      answers: {},
      skipped: [],
      pending: null,
      deferAfterNo: false,

      addTalkMs(ms) {
        set((s) => ({ talkMs: s.talkMs + ms }));
      },

      recordAnswer(qid, value) {
        set((s) => ({ answers: { ...s.answers, [qid]: value } }));
      },

      skipQuestion(qid) {
        set((s) =>
          s.skipped.includes(qid) ? s : { skipped: [...s.skipped, qid] },
        );
      },

      // A Day has been fully surfaced: advance the pointer and clear the
      // transient presentation state so the next due Day starts fresh.
      markDayShown() {
        set((s) => ({
          daysShown: s.daysShown + 1,
          pending: null,
          deferAfterNo: false,
        }));
      },

      setPending(pending) {
        set({ pending });
      },

      // User said "no" to the permission dialog: dismiss it for now, and arm the
      // "show directly on their return" path (no dialog next time).
      declinePending() {
        set({ pending: null, deferAfterNo: true });
      },
    }),
    {
      name: 'westercove.questions',
      storage: createJSONStorage(() => userScopedStorage),
      // Only durable progress is persisted; pending/deferAfterNo are per-session.
      partialize: (s) => ({
        talkMs: s.talkMs,
        daysShown: s.daysShown,
        answers: s.answers,
        skipped: s.skipped,
      }),
    },
  ),
);
