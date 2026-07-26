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

/** Seed entries from the hi-fi screens, each with a short body and a response
 * so opening one shows a conversation thread. */
function seed(): Entry[] {
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

interface EntriesState {
  entries: Entry[];
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
  entries: seed(),

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
    set((s) => ({ entries: [entry, ...s.entries] }));
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
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === id
          ? { ...e, turns: [...e.turns, ...extra], safetyLevel: Math.max(e.safetyLevel, level) }
          : e,
      ),
    }));
    return level;
  },

  getEntry(id) {
    return get().entries.find((e) => e.id === id);
  },
    }),
    {
      // Cached entries are readable offline; only the entries are persisted.
      name: 'westercove.entries',
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
);
