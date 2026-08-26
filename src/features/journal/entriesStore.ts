import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useSessionStore } from '@/features/auth/sessionStore';
import { useCadenceStore } from '@/features/cadence/cadenceStore';
import { scopedStorage } from '@/features/profile/activeProfile';
import { services } from '@/services';
import { SafetyLevel } from '@/services/safety';
import type { ChatSessionSummary } from '@/services/chat';
import type { ConversationTurn, Entry } from './types';

let counter = 100;
const nextId = () => `t${counter++}`;

/** Report the post-entry cadence signals (BE-4): the user spoke this session,
 * and — at a high safety tier — the entry is "heavy" so the ask is suspended.
 * No-op unless the 4-Doors flow is on (the cadence store guards each call). */
function reportCadence(level: SafetyLevel): void {
  const cadence = useCadenceStore.getState();
  cadence.userSpoke();
  if (level >= SafetyLevel.High) cadence.heavyEntry();
}

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
  /** Clear a companion turn's pending 4-Doors question once it's answered,
   * deferred, or skipped (so the quick-reply chips stop showing). */
  clearPendingQuestion: (entryId: string, turnId: string) => void;
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
): Promise<{ response: string; question?: ConversationTurn['pendingQuestion'] }> {
  const offline = await services.companion.respond({ text, type, lovedOneName: lovedOneName() });
  if (sessionId == null) return { response: offline.response };
  try {
    const { reply, question } = await services.chat.postMessage(sessionId, text, {
      profileId: backendProfileId(),
      timezone: clientTimezone(),
    });
    return { response: reply || offline.response, question };
  } catch {
    return { response: offline.response };
  }
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
    const { headline } = await services.companion.respond({ text, type, justHeard: true });
    let sessionId: number | undefined;

    // Six Moves are suspended at Level 3/4 (safety surface governs) and when the
    // user asked to be "just heard". Otherwise create the backend session that
    // backs this entry and let the backend generate the companion reply. The gate
    // uses the instant local pre-flight; the authoritative tier is fetched below.
    if (pre < SafetyLevel.High && !justHeard) {
      try {
        ({ sessionId } = await services.chat.createSession({
          title: headline,
          profileId: backendProfileId(),
        }));
      } catch {
        // Offline: the entry still saves; the reply comes from the fallback.
      }
      const { response, question } = await companionReply(sessionId, text, type);
      const cturn = turn('companion', response, at);
      if (question) cturn.pendingQuestion = question;
      turns.push(cturn);
    } else if (justHeard) {
      turns.push(turn('companion', 'It is heard. It stays here.', at));
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
      sessionId,
    };
    set((s) => ({ entries: [entry, ...s.entries] }));
    reportCadence(level);
    return { id, level };
  },

  async continueEntry(id, text) {
    const pre = services.safety.classify(text).level;
    const at = new Date();
    const extra: ConversationTurn[] = [turn('user', text, at)];
    if (pre < SafetyLevel.High) {
      const sessionId = get().entries.find((e) => e.id === id)?.sessionId;
      const { response, question } = await companionReply(sessionId, text, 'Journal');
      const cturn = turn('companion', response, at);
      if (question) cturn.pendingQuestion = question;
      extra.push(cturn);
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
    reportCadence(level);
    return level;
  },

  getEntry(id) {
    return get().entries.find((e) => e.id === id);
  },

  clearPendingQuestion(entryId, turnId) {
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === entryId
          ? {
              ...e,
              turns: e.turns.map((t) =>
                t.id === turnId ? { ...t, pendingQuestion: undefined } : t,
              ),
            }
          : e,
      ),
    }));
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
