import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useSessionStore } from '@/features/auth/sessionStore';
import { scopedStorage } from '@/features/profile/activeProfile';
import {
  DAYS_HUMAN,
  DAYS_PET,
  QUESTION_INTERVAL_MS,
  type DayBucket,
  type Question,
} from '@/constants/questions';

/**
 * State for the timer-driven profile questions. Talk-time accumulates while the
 * user is on an entry conversation screen; every completed interval unlocks the
 * next Day bucket. `daysShown` is how many buckets have already been surfaced —
 * a new Day is "due" when the interval count exceeds it.
 *
 * Persisted with the same secureStorage pattern as the session/entries stores,
 * which on web is localStorage — so answers survive a reload for testing.
 */

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
  /** Demo control: advance one interval of talk-time, unlocking the next Day. */
  simulateSession: () => void;
  /** Demo control: wipe all question progress. */
  resetProgress: () => void;
  /** Reset to a fresh cadence for a new test profile. */
  resetForProfile: () => void;
}

/**
 * The next gentle question to surface inline on Home: the first unlocked,
 * unanswered, un-skipped `text` question across all unlocked Day buckets (info
 * and chip questions are handled by the overlay flow, not the Home card).
 * Returns null when nothing is unlocked yet or everything is answered.
 */
export function nextHomeQuestion(
  talkMs: number,
  answers: Record<string, string>,
  skipped: string[],
): Question | null {
  const days = activeDays();
  const due = dueDayIndex(talkMs, days.length);
  for (let d = 0; d <= due; d++) {
    for (const q of days[d].questions) {
      if (q.kind !== 'text') continue;
      if (answers[q.id] || skipped.includes(q.id)) continue;
      return q;
    }
  }
  return null;
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

      simulateSession() {
        set((s) => ({ talkMs: s.talkMs + QUESTION_INTERVAL_MS }));
      },

      resetProgress() {
        set({ talkMs: 0, daysShown: 0, answers: {}, skipped: [], pending: null });
      },

      resetForProfile() {
        set({
          talkMs: 0,
          daysShown: 0,
          answers: {},
          skipped: [],
          pending: null,
          deferAfterNo: false,
        });
      },
    }),
    {
      name: 'westercove.questions',
      storage: createJSONStorage(() => scopedStorage('questions')),
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
