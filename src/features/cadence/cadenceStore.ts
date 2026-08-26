import { create } from 'zustand';

import { USE_FOUR_DOORS } from '@/constants/flags';
import { useSessionStore } from '@/features/auth/sessionStore';
import { services, type CadenceEvent, type CadenceState } from '@/services';

/**
 * Client mirror of the server-owned 4-Doors cadence state (BE-4). The server
 * does all stage math (design doc §5): this store reports raw signals and
 * replaces its state with whatever the server returns. Everything is gated on
 * USE_FOUR_DOORS *and* a backend profile id — off, or pre-gate, every action is
 * a no-op so the current flow is untouched. Reporting is fire-and-forget: a
 * cadence signal must never block or fail a writing/chat action.
 */
interface CadenceStore {
  /** Server source of truth; null until hydrated (or when disabled). */
  state: CadenceState | null;
  /** Launch reconciliation: pull the authoritative state. */
  hydrate: () => Promise<void>;
  /** Cold start / return-to-foreground after a gap → new session. */
  appOpen: () => void;
  /** Foreground writing time on a writing surface, in seconds since last tick. */
  journalingTick: (seconds: number) => void;
  /** The user posted a message/entry this session. */
  userSpoke: () => void;
  /** The user's entry classified as heavy → suspend the ask this session. */
  heavyEntry: () => void;
  /** "Not now" on a pending question. */
  deferQuestion: (questionId: string) => Promise<void>;
  /** "Skip this one" on a pending question. */
  skipQuestion: (questionId: string) => Promise<void>;
}

/** The active backend profile id, only when the 4-Doors flow is enabled. */
function activeProfileId(): number | undefined {
  if (!USE_FOUR_DOORS) return undefined;
  return useSessionStore.getState().session?.backendProfileId;
}

function deviceTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

export const useCadenceStore = create<CadenceStore>((set) => {
  const report = (event: CadenceEvent, journalingSecondsDelta?: number) => {
    const profileId = activeProfileId();
    if (profileId == null) return;
    void services.cadence
      .reportEvent(profileId, {
        event,
        journalingSecondsDelta,
        clientTimezone: deviceTimezone(),
        clientNow: new Date().toISOString(),
      })
      .then((state) => set({ state }))
      .catch(() => {});
  };

  return {
    state: null,

    async hydrate() {
      const profileId = activeProfileId();
      if (profileId == null) return;
      try {
        set({ state: await services.cadence.getState(profileId) });
      } catch {
        // offline / transient — keep whatever mirror we have
      }
    },

    appOpen() {
      report('app_open');
    },
    journalingTick(seconds) {
      if (seconds > 0) report('journaling_tick', seconds);
    },
    userSpoke() {
      report('user_spoke');
    },
    heavyEntry() {
      report('heavy_entry');
    },

    async deferQuestion(questionId) {
      const profileId = activeProfileId();
      if (profileId == null) return;
      try {
        set({ state: await services.cadence.deferQuestion(profileId, questionId) });
      } catch {
        // leave the question pending; the user can try again
      }
    },
    async skipQuestion(questionId) {
      const profileId = activeProfileId();
      if (profileId == null) return;
      try {
        set({ state: await services.cadence.skipQuestion(profileId, questionId) });
      } catch {
        // leave the question pending; the user can try again
      }
    },
  };
});
