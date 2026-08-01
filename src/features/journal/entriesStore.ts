import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useSessionStore } from '@/features/auth/sessionStore';
import { secureStorage } from '@/lib/secureStorage';
import { services } from '@/services';
import { SafetyLevel } from '@/services/safety';
import type { ConversationTurn, Entry } from './types';

let counter = 100;
const nextId = () => `t${counter++}`;

function turn(role: 'user' | 'companion', text: string, at = new Date()): ConversationTurn {
  return { id: nextId(), role, text, at: at.toISOString() };
}

function daysAgo(days: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Sample entries for a brand-new account that has no persona history of its
 * own — the four threads from the hi-fi screens. */
export function defaultSeedEntries(): Entry[] {
  const mk = (
    id: string,
    type: string,
    headline: string,
    createdAt: string,
    body: string,
    response: string,
  ): Entry => ({
    id,
    type,
    headline,
    createdAt,
    safetyLevel: SafetyLevel.Normal,
    turns: [
      { id: `${id}-u`, role: 'user', text: body, at: createdAt },
      { id: `${id}-c`, role: 'companion', text: response, at: createdAt },
    ],
  });
  return [
    mk(
      'e1',
      'Memory',
      'The lake house, and the way he laughed',
      daysAgo(2, 21, 12),
      'I keep thinking about the lake house, the summers there, and the way he laughed at his own jokes before he even finished them.',
      'Thank you for putting this here. That laugh sounds like something worth holding onto. You do not have to tidy the memory — let it be as full as it is.',
    ),
    mk(
      'e2',
      'Struggle',
      'A hard morning, missing the ordinary',
      daysAgo(3, 7, 40),
      'This morning was hard for no reason I can name. I think I miss the ordinary things most.',
      'The ordinary things carry so much. It makes sense that their absence is where the ache lives. I am here with it, and with you.',
    ),
    mk(
      'e3',
      'Letter',
      'Things I did not say out loud',
      daysAgo(4, 20, 15),
      'There are things I never said out loud, and I want to say them now.',
      'This is a good place for them. Say as much or as little as you want — it will keep.',
    ),
    mk(
      'e4',
      'Anniversary',
      'The 17th is close',
      daysAgo(5, 18, 2),
      'The 17th is close and I can feel it coming.',
      'Dates can arrive in the body before the mind names them. We can move toward it together, at whatever pace is yours.',
    ),
  ];
}

const GUEST = '__guest__';

/** Slot that holds a journal migrated from the old single-journal layout, so
 * content written before per-account storage existed is never lost. */
export const LEGACY_USER = '__legacy__';

interface EntriesState {
  /** Whose journal is currently in `entries`. */
  activeUserId: string;
  /** Every account's journal, kept separate so switching users never mixes
   * content and each person's entries survive a sign-out. */
  byUser: Record<string, Entry[]>;
  /** The active user's journal (a live view of `byUser[activeUserId]`). */
  entries: Entry[];
  /** Point the store at an account, seeding its journal the first time only. */
  setActiveUser: (userId: string, seed?: Entry[]) => void;
  /** Detach from any account (sign-out); shows an empty journal. */
  clearActiveUser: () => void;
  addEntry: (input: {
    type: string;
    text: string;
    justHeard?: boolean;
  }) => Promise<{ id: string; level: SafetyLevel }>;
  continueEntry: (id: string, text: string) => Promise<SafetyLevel>;
  getEntry: (id: string) => Entry | undefined;
}

function lovedOneName(): string | undefined {
  return useSessionStore.getState().session?.gateAnswers.lovedOneName;
}

export const useEntriesStore = create<EntriesState>()(
  persist(
    (set, get) => ({
      activeUserId: GUEST,
      byUser: {},
      entries: [],

      setActiveUser(userId, seed) {
        set((s) => {
          const existing = s.byUser[userId];
          const list = existing ?? seed ?? [];
          const byUser = existing ? s.byUser : { ...s.byUser, [userId]: list };
          return { activeUserId: userId, byUser, entries: list };
        });
      },

      clearActiveUser() {
        set({ activeUserId: GUEST, entries: get().byUser[GUEST] ?? [] });
      },

      async addEntry({ type, text, justHeard }) {
        // Safety runs on every submission, before response generation.
        const { level } = services.safety.classify(text);
        const at = new Date();
        const turns: ConversationTurn[] = [turn('user', text, at)];
        let headline: string;

        // Six Moves are suspended at Level 3/4 — the safety surface governs there.
        if (level < SafetyLevel.High) {
          const reply = await services.companion.respond({
            text,
            type,
            lovedOneName: lovedOneName(),
            justHeard,
          });
          turns.push(turn('companion', reply.response, at));
          headline = reply.headline;
        } else {
          const reply = await services.companion.respond({ text, type, justHeard: true });
          headline = reply.headline;
        }

        const id = `e${Date.now()}`;
        const entry: Entry = {
          id,
          type,
          headline,
          createdAt: at.toISOString(),
          turns,
          justHeard,
          safetyLevel: level,
        };
        set((s) => {
          const list = [entry, ...(s.byUser[s.activeUserId] ?? [])];
          return { byUser: { ...s.byUser, [s.activeUserId]: list }, entries: list };
        });
        return { id, level };
      },

      async continueEntry(id, text) {
        const { level } = services.safety.classify(text);
        const at = new Date();
        const userTurn = turn('user', text, at);
        const extra: ConversationTurn[] = [userTurn];
        if (level < SafetyLevel.High) {
          const reply = await services.companion.respond({
            text,
            type: 'Journal',
            lovedOneName: lovedOneName(),
          });
          extra.push(turn('companion', reply.response, at));
        }
        set((s) => {
          const list = (s.byUser[s.activeUserId] ?? []).map((e) =>
            e.id === id
              ? { ...e, turns: [...e.turns, ...extra], safetyLevel: Math.max(e.safetyLevel, level) }
              : e,
          );
          return { byUser: { ...s.byUser, [s.activeUserId]: list }, entries: list };
        });
        return level;
      },

      getEntry(id) {
        return get().entries.find((e) => e.id === id);
      },
    }),
    {
      // Every account's journal is persisted together (one cache, readable
      // offline); `entries` is rebuilt from the active user's slot on rehydrate.
      name: 'westercove.entries',
      storage: createJSONStorage(() => secureStorage),
      version: 1,
      partialize: (s) => ({ byUser: s.byUser, activeUserId: s.activeUserId }),
      // v0 stored one shared journal as `{ entries: [...] }`. Carry any such
      // journal forward into a legacy slot rather than dropping it, so nothing
      // written before per-account storage is deleted on upgrade.
      migrate: (persisted, version) => {
        const p = persisted as
          | { entries?: Entry[]; byUser?: Record<string, Entry[]>; activeUserId?: string }
          | undefined;
        if (version < 1 && p && Array.isArray(p.entries) && !p.byUser) {
          return {
            byUser: { [LEGACY_USER]: p.entries },
            activeUserId: LEGACY_USER,
          } as { byUser: Record<string, Entry[]>; activeUserId: string };
        }
        return p as { byUser: Record<string, Entry[]>; activeUserId: string };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const list = state.byUser[state.activeUserId] ?? [];
        useEntriesStore.setState({ entries: list });
      },
    },
  ),
);
