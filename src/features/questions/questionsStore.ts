import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { lovedOneName, useSessionStore } from '@/features/auth/sessionStore';
import { scopedStorage } from '@/features/profile/activeProfile';
import { useWhatIKnowStore } from '@/features/profile/whatIKnowStore';
import { services } from '@/services';
import {
  MAX_STAGE,
  QUALIFY_SECONDS,
  type CadenceQuestion,
  type CadenceState,
} from './cadence';

/**
 * Per-profile question-cadence state (ported from the demo). A `journalStage`
 * unlocks question buckets; `startSession`/`dismissCheckin` gate the Home card
 * per app-open session. Durable fields persist; session-scoped fields do not.
 */

interface QuestionsState {
  /** How many qualifying journaling sessions have advanced the cadence. */
  journalStage: number;
  /** Ids of questions answered or skipped. */
  answeredIds: string[];
  /** Cumulative journaling seconds (display). */
  journalSeconds: number;
  /** Journaling seconds in the current app-open session. */
  sessionJournalSeconds: number;
  /** App-open session counter (not persisted). */
  sessionCount: number;
  /** Session in which the user last tapped "Not now" (not persisted). */
  checkinSnoozeSession: number;
  faithLanguage?: string;
  faithTradition?: string;
  faithTraditionDetail?: string;
  causeOfDeath?: string;

  recordAnswer: (q: CadenceQuestion, value: string) => void;
  skip: (q: CadenceQuestion) => void;
  dismissCheckin: () => void;
  /** Demo control: advance one cadence stage. */
  simulateSession: () => void;
  /** Demo control: reset all cadence progress. */
  resetProgress: () => void;
  /** Count one app open (once per session). */
  startSession: () => void;
  /** Accrue journaling time; advance the stage per qualifying length. */
  addJournalSeconds: (seconds: number) => void;
  resetForProfile: () => void;
}

/** Merge the store's cadence data with the active session (module, name, onboarded). */
export function cadenceState(): CadenceState {
  const q = useQuestionsStore.getState();
  const session = useSessionStore.getState().session;
  return {
    module: session?.gateAnswers.mode ?? 'pet',
    name: lovedOneName(),
    onboarded: !!session?.gateComplete,
    journalStage: q.journalStage,
    answeredIds: q.answeredIds,
    sessionCount: q.sessionCount,
    checkinSnoozeSession: q.checkinSnoozeSession,
    faithLanguage: q.faithLanguage,
    faithTradition: q.faithTradition,
    faithTraditionDetail: q.faithTraditionDetail,
    causeOfDeath: q.causeOfDeath,
  };
}

let sessionStarted = false;

export const useQuestionsStore = create<QuestionsState>()(
  persist(
    (set, get) => ({
      journalStage: 0,
      answeredIds: [],
      journalSeconds: 0,
      sessionJournalSeconds: 0,
      sessionCount: 0,
      checkinSnoozeSession: 0,

      recordAnswer(q, value) {
        const v = value.trim();
        if (!v) return;
        set((s) => ({
          answeredIds: [...s.answeredIds, q.id],
          ...(q.sets ? q.sets(v) : {}),
        }));
        useWhatIKnowStore.getState().addLearnedLine(q.toLine(v, lovedOneName()));
        // Persist the answer to the backend profile so it survives reload and
        // reaches the companion prompt — not just local zustand. Keyed by the
        // cadence question id; the backend merges and keeps omitted answers.
        // Fire-and-forget: saving a gentle answer never blocks on the network.
        const profileId = useSessionStore.getState().session?.backendProfileId;
        if (profileId != null) {
          void services.survey.updateProfileAnswers(profileId, { [q.id]: v }).catch(() => {});
        }
      },

      skip(q) {
        set((s) =>
          s.answeredIds.includes(q.id) ? s : { answeredIds: [...s.answeredIds, q.id] },
        );
      },

      dismissCheckin() {
        set((s) => ({ checkinSnoozeSession: s.sessionCount }));
      },

      simulateSession() {
        set((s) => ({ journalStage: Math.min(s.journalStage + 1, MAX_STAGE) }));
      },

      resetProgress() {
        set({
          journalStage: 0,
          journalSeconds: 0,
          sessionJournalSeconds: 0,
          answeredIds: [],
          checkinSnoozeSession: 0,
          faithLanguage: undefined,
          faithTradition: undefined,
          faithTraditionDetail: undefined,
          causeOfDeath: undefined,
        });
      },

      startSession() {
        if (sessionStarted) return;
        sessionStarted = true;
        set((s) => ({ sessionCount: s.sessionCount + 1, sessionJournalSeconds: 0 }));
      },

      addJournalSeconds(seconds) {
        set((s) => {
          const before = Math.floor(s.sessionJournalSeconds / QUALIFY_SECONDS);
          const sessionSecs = s.sessionJournalSeconds + seconds;
          const after = Math.floor(sessionSecs / QUALIFY_SECONDS);
          const advances = Math.max(0, after - before);
          return {
            journalSeconds: s.journalSeconds + seconds,
            sessionJournalSeconds: sessionSecs,
            journalStage: Math.min(s.journalStage + advances, MAX_STAGE),
          };
        });
      },

      resetForProfile() {
        set({
          journalStage: 0,
          answeredIds: [],
          journalSeconds: 0,
          sessionJournalSeconds: 0,
          checkinSnoozeSession: 0,
          faithLanguage: undefined,
          faithTradition: undefined,
          faithTraditionDetail: undefined,
          causeOfDeath: undefined,
        });
      },
    }),
    {
      name: 'westercove.questions',
      storage: createJSONStorage(() => scopedStorage('questions')),
      // Session counters snooze/sessions are per app-open, not persisted.
      partialize: (s) => ({
        journalStage: s.journalStage,
        answeredIds: s.answeredIds,
        journalSeconds: s.journalSeconds,
        faithLanguage: s.faithLanguage,
        faithTradition: s.faithTradition,
        faithTraditionDetail: s.faithTraditionDetail,
        causeOfDeath: s.causeOfDeath,
      }),
    },
  ),
);
