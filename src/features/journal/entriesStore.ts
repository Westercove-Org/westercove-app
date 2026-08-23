import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useSessionStore } from '@/features/auth/sessionStore';
import { libraryForCompanion, useLibraryStore } from '@/features/discover/libraryStore';
import { useWhatIKnowStore } from '@/features/profile/whatIKnowStore';
import { scopedStorage } from '@/features/profile/activeProfile';
import { services } from '@/services';
import { SafetyLevel } from '@/services/safety';
import type { ChatSessionSummary } from '@/services/chat';
import type { ConversationTurn, Entry } from './types';

let counter = 100;
const nextId = () => `t${counter++}`;

function turn(role: 'user' | 'companion', text: string, at = new Date()): ConversationTurn {
  return { id: nextId(), role, text, at: at.toISOString() };
}

interface EntriesState {
  entries: Entry[];
  /** Chat-session summaries fetched from the backend for the active profile. */
  serverSessions: ChatSessionSummary[];
  addEntry: (input: {
    type: string;
    text: string;
    justHeard?: boolean;
  }) => Promise<{ id: string; level: SafetyLevel }>;
  continueEntry: (id: string, text: string) => Promise<SafetyLevel>;
  getEntry: (id: string) => Entry | undefined;
  /** Load the backend chat-session summaries for the persisted profile id.
   * No-op (clears) when there is no backend profile id yet. */
  refreshServerSessions: () => Promise<void>;
  /** Reset to seed data (used when switching to a fresh test profile). */
  resetForProfile: () => void;
}

function lovedOneName(): string | undefined {
  return useSessionStore.getState().session?.gateAnswers.lovedOneName;
}

/** Gate answers that shape the companion's voice. */
function companionContext(entryType: string) {
  const gate = useSessionStore.getState().session?.gateAnswers;
  const mode = gate?.mode ?? 'human';
  const myLibrary = useLibraryStore.getState().myLibrary;
  return {
    tone: gate?.tone,
    userName: gate?.callName,
    mode,
    species: gate?.species,
    relationship: gate?.relationship,
    // Only what this entry type earns: nothing until the person builds a
    // library, except the guided types, which fall back to the loss-path shelf.
    library: libraryForCompanion(myLibrary, mode, entryType),
    profile: useWhatIKnowStore.getState().learned.map((k) => `${k.label}: ${k.value}`),
  };
}

/** Prior turns of an entry, in the shape the companion API expects. */
function historyFor(entry: Entry | undefined): { role: 'user' | 'assistant'; content: string }[] {
  return (entry?.turns ?? []).map((t) => ({
    role: t.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: t.text,
  }));
}

export const useEntriesStore = create<EntriesState>()(
  persist(
    (set, get) => ({
  entries: [],
  serverSessions: [],

  async addEntry({ type, text, justHeard }) {
    // Fast local pre-flight, instant and offline: gates response generation.
    const pre = services.safety.classify(text).level;
    const at = new Date();
    const turns: ConversationTurn[] = [turn('user', text, at)];
    let headline: string;

    // Six Moves are suspended at Level 3/4 — the safety surface governs there.
    if (pre < SafetyLevel.High) {
      const reply = await services.companion.respond({
        text,
        type,
        lovedOneName: lovedOneName(),
        justHeard,
        context: companionContext(type),
      });
      turns.push(turn('companion', reply.response, at));
      headline = reply.headline;
    } else {
      const reply = await services.companion.respond({ text, type, justHeard: true });
      headline = reply.headline;
    }

    // Authoritative tier from the backend classifier (never below the local
    // pre-flight); this is what we persist and what drives the crisis surfaces.
    const level = (await services.safety.classifyRemote(text)).level;
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

    // Create the backend chat session that will back this entry, and stamp its
    // id onto the entry once it returns. Fire-and-forget: writing an entry must
    // never block on the network, and entries stay readable offline. Scope to
    // the backend profile id when we have one (falls back to the default).
    // ponytail: session create only; posting turns to /chat/sessions/{id}/messages
    // is a later ticket.
    void services.chat
      .createSession({
        title: headline,
        profileId: useSessionStore.getState().session?.backendProfileId,
      })
      .then(({ sessionId }) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, sessionId } : e)),
        })),
      )
      .catch(() => {});

    return { id, level };
  },

  async continueEntry(id, text) {
    const pre = services.safety.classify(text).level;
    const at = new Date();
    const userTurn = turn('user', text, at);
    const extra: ConversationTurn[] = [userTurn];
    if (pre < SafetyLevel.High) {
      const reply = await services.companion.respond({
        text,
        type: 'Journal',
        lovedOneName: lovedOneName(),
        history: historyFor(get().entries.find((e) => e.id === id)),
        context: companionContext('Journal'),
      });
      extra.push(turn('companion', reply.response, at));
    }
    // Authoritative tier for the entry's running safety level + crisis routing.
    const level = (await services.safety.classifyRemote(text)).level;
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

  async refreshServerSessions() {
    const profileId = useSessionStore.getState().session?.backendProfileId;
    if (profileId == null) {
      set({ serverSessions: [] });
      return;
    }
    try {
      set({ serverSessions: await services.chat.listSessions(profileId) });
    } catch {
      // Offline / transient: keep whatever we last loaded.
    }
  },

  resetForProfile() {
    set({ entries: [], serverSessions: [] });
  },
    }),
    {
      // Cached entries are readable offline; only the entries are persisted.
      name: 'westercove.entries',
      storage: createJSONStorage(() => scopedStorage('entries')),
      partialize: (s) => ({ entries: s.entries }),
    },
  ),
);
