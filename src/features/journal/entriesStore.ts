import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useSessionStore } from '@/features/auth/sessionStore';
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

function backendProfileId(): number | undefined {
  return useSessionStore.getState().session?.backendProfileId;
}

/** The device timezone, so the backend can stamp turns in the user's local time. */
function clientTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Ask the backend to generate the companion's reply for a message. The backend
 * (chat sessions API) now owns generation — voice, library, and profile context
 * all live server-side, keyed by the session + profile id. Falls back to the
 * offline companion when the backend is unreachable or its AI is unavailable
 * (e.g. 502 before Bedrock/Anthropic is enabled): the journal always answers.
 */
async function companionReply(
  sessionId: number | undefined,
  text: string,
  type: string,
): Promise<string> {
  const offline = await services.companion.respond({ text, type, lovedOneName: lovedOneName() });
  if (sessionId == null) return offline.response;
  try {
    const { reply } = await services.chat.postMessage(sessionId, text, {
      profileId: backendProfileId(),
      timezone: clientTimezone(),
    });
    return reply || offline.response;
  } catch {
    return offline.response;
  }
}

export const useEntriesStore = create<EntriesState>()(
  persist(
    (set, get) => ({
  entries: [],
  serverSessions: [],

  async addEntry({ type, text, justHeard }) {
    // Safety runs on every submission, before response generation.
    const { level } = services.safety.classify(text);
    const at = new Date();
    const turns: ConversationTurn[] = [turn('user', text, at)];
    const { headline } = await services.companion.respond({ text, type, justHeard: true });
    let sessionId: number | undefined;

    // Six Moves are suspended at Level 3/4 (safety surface governs) and when the
    // user asked to be "just heard". Otherwise create the backend session that
    // backs this entry and let the backend generate the companion reply.
    if (level < SafetyLevel.High && !justHeard) {
      try {
        ({ sessionId } = await services.chat.createSession({
          title: headline,
          profileId: backendProfileId(),
        }));
      } catch {
        // Offline: the entry still saves; the reply comes from the fallback.
      }
      const response = await companionReply(sessionId, text, type);
      turns.push(turn('companion', response, at));
    } else if (justHeard) {
      turns.push(turn('companion', 'It is heard. It stays here.', at));
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
      sessionId,
    };
    set((s) => ({ entries: [entry, ...s.entries] }));
    return { id, level };
  },

  async continueEntry(id, text) {
    const { level } = services.safety.classify(text);
    const at = new Date();
    const extra: ConversationTurn[] = [turn('user', text, at)];
    if (level < SafetyLevel.High) {
      const sessionId = get().entries.find((e) => e.id === id)?.sessionId;
      const response = await companionReply(sessionId, text, 'Journal');
      extra.push(turn('companion', response, at));
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
