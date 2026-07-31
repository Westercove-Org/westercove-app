import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useSessionStore } from '@/features/auth/sessionStore';
import { secureStorage } from '@/lib/secureStorage';
import { services } from '@/services';
import { SafetyLevel } from '@/services/safety';
import { ENTRIES_BASE, profileKey } from '@/features/profiles/profileKeys';
import type { Attachment, ConversationTurn, Entry } from './types';

let counter = 100;
const nextId = () => `t${counter++}`;

function turn(role: 'user' | 'companion', text: string, at = new Date()): ConversationTurn {
  return { id: nextId(), role, text, at: at.toISOString() };
}

interface EntriesState {
  entries: Entry[];
  addEntry: (input: {
    type: string;
    text: string;
    justHeard?: boolean;
    attachments?: Attachment[];
  }) => Promise<{ id: string; level: SafetyLevel }>;
  continueEntry: (id: string, text: string) => Promise<SafetyLevel>;
  getEntry: (id: string) => Entry | undefined;
}

function lovedOneName(): string | undefined {
  return useSessionStore.getState().session?.gateAnswers.lovedOneName;
}

function tone(): string | undefined {
  return useSessionStore.getState().session?.gateAnswers.tone;
}

export const useEntriesStore = create<EntriesState>()(
  persist(
    (set, get) => ({
  // A test profile begins blank; testers add entries per the Content Pack.
  entries: [],

  async addEntry({ type, text, justHeard, attachments }) {
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
        tone: tone(),
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
      attachments: attachments?.length ? attachments : undefined,
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
        tone: tone(),
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
      // Dynamic per-profile key: bindProfileStores rebinds before hydration.
      name: profileKey(ENTRIES_BASE, 'unbound'),
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ entries: s.entries }),
      skipHydration: true,
    },
  ),
);

/** Reset entries to blank (used when switching/creating profiles). */
export function resetEntries() {
  useEntriesStore.setState({ entries: [] });
}
