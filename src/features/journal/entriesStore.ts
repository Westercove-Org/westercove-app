import { create } from 'zustand';

import { useSessionStore } from '@/features/auth/sessionStore';
import { useCadenceStore } from '@/features/cadence/cadenceStore';
import { services } from '@/services';
import { SafetyLevel, levelForTier } from '@/services/safety';
import { useSafetyStore } from '@/features/safety/safetyStore';
import { planLimitFrom, type PlanLimit } from '@/features/billing/planLimit';
import type { ChatSessionSummary, CompanionSafety } from '@/services/chat';
import type { JournalRecord } from '@/services/journal';
import { entryTypeEnum, labelForEntryType } from './entryTypes';
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

/**
 * Rebuild conversation turns from a server journal record read back after a
 * reload (the app is online-only now — entry bodies are not persisted on-device).
 * A command entry stores the user's text in `entry` and the companion's reply in
 * `reflection` → two turns. A session entry stores the whole conversation in
 * `entry` as the backend's labelled transcript ("You: …\n\nCompanion: …") with a
 * null reflection → split it back into turns.
 *
 * ponytail: the transcript split assumes the backend's fixed `You:`/`Companion:`
 * labels (format_chat_session_transcript). A user message that itself contains a
 * line like "\n\nCompanion:" could mis-split; if no label is found we fall back
 * to a single user turn of the raw text. Upgrade path is the P3
 * fe-journal-conversation-history endpoint (structured turns from the server).
 */
function recordToTurns(r: JournalRecord, at: Date): ConversationTurn[] {
  if (r.reflection != null) {
    const turns = [turn('user', r.entry, at)];
    if (r.reflection.trim()) turns.push(turn('companion', r.reflection, at));
    return turns;
  }
  const parts = r.entry.split(/\n\n(?=(?:You|Companion): )/);
  const turns: ConversationTurn[] = [];
  for (const p of parts) {
    const m = /^(You|Companion): ([\s\S]*)$/.exec(p);
    if (m) turns.push(turn(m[1] === 'You' ? 'user' : 'companion', m[2].trim(), at));
  }
  return turns.length ? turns : [turn('user', r.entry.trim(), at)];
}

/** Map a server journal record to the app's Entry. `sessionId` links it to its
 * chat session (so continuing the entry reaches the same server session), and
 * `level` is the session's server-ratcheted safety tier. */
function recordToEntry(
  r: JournalRecord,
  sessionId: number | undefined,
  level: SafetyLevel,
): Entry {
  const at = new Date(r.createdAt);
  return {
    id: `j${r.id}`,
    type: labelForEntryType(r.entryType),
    headline: r.title,
    createdAt: r.createdAt,
    turns: recordToTurns(r, at),
    safetyLevel: level,
    sessionId,
    journalId: r.id,
  };
}

/** The server journal-entry id for an entry, when resolvable: the stamped
 * `journalId`, else parsed from a `j<n>` id (server-loaded entry), else looked
 * up from the linked chat session's `journalEntryId`. Undefined ⇒ not yet
 * persisted server-side, so it can't be edited via `/api/journal` yet. */
export function journalIdOf(
  entry: Entry,
  serverSessions: ChatSessionSummary[],
): number | undefined {
  if (entry.journalId != null) return entry.journalId;
  if (entry.id.startsWith('j')) {
    const n = Number(entry.id.slice(1));
    if (Number.isInteger(n)) return n;
  }
  if (entry.sessionId != null) {
    return serverSessions.find((s) => s.id === entry.sessionId)?.journalEntryId ?? undefined;
  }
  return undefined;
}

/** The server journal id an in-memory (live) entry corresponds to, via its chat
 * session's linked `journalEntryId`. Used to dedupe live entries against the
 * ones the journal API returns for the same rows. */
function liveJournalId(
  entry: Entry,
  sessionById: Map<number, ChatSessionSummary>,
): number | undefined {
  return entry.sessionId != null ? sessionById.get(entry.sessionId)?.journalEntryId : undefined;
}

interface EntriesState {
  entries: Entry[];
  /** Chat-session summaries fetched from the backend for the active profile. */
  serverSessions: ChatSessionSummary[];
  /** The last plan-limit the backend returned (402), surfaced as an
   * upgrade-to-Premium prompt (R-1b). Null when none is outstanding. */
  planLimit: PlanLimit | null;
  setPlanLimit: (limit: PlanLimit) => void;
  clearPlanLimit: () => void;
  addEntry: (input: {
    type: string;
    text: string;
    justHeard?: boolean;
  }) => Promise<{ id: string; level: SafetyLevel }>;
  continueEntry: (id: string, text: string) => Promise<SafetyLevel>;
  /** Rename a saved entry's title, persisted to the encrypted journal row via
   * `PATCH /api/journal/{id}`. Throws if the entry isn't persisted server-side
   * yet (no resolvable journal id). */
  renameEntry: (id: string, title: string) => Promise<void>;
  getEntry: (id: string) => Entry | undefined;
  /** Clear a companion turn's pending 4-Doors question once it's answered,
   * deferred, or skipped (so the quick-reply chips stop showing). */
  clearPendingQuestion: (entryId: string, turnId: string) => void;
  /** Load this profile's server-authoritative journal entries (online-only; no
   * on-device persistence) plus the chat-session summaries that carry their
   * safety tier, merging with any live entries from this session. No-op (keeps
   * in-memory entries, clears sessions) when there is no backend profile id. */
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
): Promise<{
  response: string;
  question?: ConversationTurn['pendingQuestion'];
  safety?: CompanionSafety;
}> {
  const offline = await services.companion.respond({ text, type, lovedOneName: lovedOneName() });
  if (sessionId == null) return { response: offline.response };
  try {
    const { reply, question, safety } = await services.chat.postMessage(sessionId, text, {
      profileId: backendProfileId(),
      timezone: clientTimezone(),
      // The entry-type chip → backend enum, so the server picks the guided/book
      // reply for this turn. Unknown label → undefined → a normal turn.
      entryType: entryTypeEnum(type),
    });
    return { response: reply || offline.response, question, safety };
  } catch (err) {
    // A chat-turn cap (402) is an upgrade prompt, not an outage: surface it.
    // Any other failure stays a silent offline fallback (the journal answers).
    const limit = planLimitFrom(err);
    if (limit) useEntriesStore.getState().setPlanLimit(limit);
    return { response: offline.response };
  }
}

/**
 * The entry's authoritative safety level, plus publishing the crisis context so
 * the surfaces can render the server's resources. Prefer the chat turn's server
 * `safety` (session-ratcheted, carries the resource card); fall back to the
 * standalone remote classifier when the turn had none (offline, no session, or a
 * Level 3/4 entry that skipped the chat call). Never below the instant local
 * pre-flight — fail-safe toward showing help.
 */
async function resolveSafety(text: string, safety: CompanionSafety | undefined): Promise<SafetyLevel> {
  const pre = services.safety.classify(text).level;
  if (safety) {
    useSafetyStore.getState().setFromServer(safety);
    return Math.max(pre, levelForTier(safety.tier)) as SafetyLevel;
  }
  return (await services.safety.classifyRemote(text)).level;
}

export const useEntriesStore = create<EntriesState>()((set, get) => ({
  entries: [],
  serverSessions: [],
  planLimit: null,

  setPlanLimit(limit) {
    set({ planLimit: limit });
  },

  clearPlanLimit() {
    set({ planLimit: null });
  },

  async addEntry({ type, text, justHeard }) {
    // Fast local pre-flight, instant and offline: gates response generation and
    // is the entry's floor safety level until the authoritative tier arrives.
    const pre = services.safety.classify(text).level;
    const at = new Date();
    // Headline comes from the offline companion (the local Mock, the designated
    // headline authority — it never touches the network and never throws).
    const { headline } = await services.companion.respond({ text, type, justHeard: true });

    // v16 P0 — the person's words are persisted FIRST, before any companion or
    // safety call. Nobody's writing is contingent on a network call succeeding:
    // a failed reply below must leave the entry standing with their own words in
    // it (in the Journal, on Profile, in the download), not vanish behind a line
    // of red text. The companion reply and authoritative tier are fetched after
    // and merged into this same entry.
    const id = `e${Date.now()}`;
    set((s) => ({
      entries: [
        {
          id,
          type,
          headline,
          createdAt: at.toISOString(),
          turns: [turn('user', text, at)],
          justHeard,
          safetyLevel: pre,
          sessionId: undefined,
        },
        ...s.entries,
      ],
    }));

    // Everything from here on only enriches the entry that already exists. The
    // whole block is guarded: an unexpected throw anywhere in reply generation or
    // safety resolution leaves the persisted entry untouched with the user's turn.
    let level = pre;
    try {
      let sessionId: number | undefined;
      const extra: ConversationTurn[] = [];

      // Six Moves are suspended at Level 3/4 (safety surface governs) and when the
      // user asked to be "just heard". Otherwise create the backend session that
      // backs this entry and let the backend generate the companion reply. The gate
      // uses the instant local pre-flight; the authoritative tier is fetched below.
      let safety: CompanionSafety | undefined;
      if (pre < SafetyLevel.High && !justHeard) {
        try {
          ({ sessionId } = await services.chat.createSession({
            title: headline,
            profileId: backendProfileId(),
          }));
        } catch {
          // Offline: the entry still stands; the reply comes from the fallback.
        }
        const reply = await companionReply(sessionId, text, type);
        const cturn = turn('companion', reply.response, at);
        if (reply.question) cturn.pendingQuestion = reply.question;
        extra.push(cturn);
        safety = reply.safety;
      } else if (justHeard) {
        extra.push(turn('companion', 'It is heard. It stays here.', at));
      }

      // Authoritative tier — the chat turn's server safety when present, else the
      // standalone classifier; never below the local pre-flight. Drives the entry's
      // level, the crisis surfaces, and (via the safety store) their resources.
      level = await resolveSafety(text, safety);
      set((s) => ({
        entries: s.entries.map((e) =>
          e.id === id
            ? {
                ...e,
                sessionId,
                turns: [...e.turns, ...extra],
                safetyLevel: Math.max(e.safetyLevel, level),
              }
            : e,
        ),
      }));
    } catch {
      // Reply/safety failed unexpectedly: the entry already stands with the
      // person's words. Fall through with the pre-flight level.
    }
    reportCadence(level);
    return { id, level };
  },

  async continueEntry(id, text) {
    const pre = services.safety.classify(text).level;
    const at = new Date();
    const extra: ConversationTurn[] = [turn('user', text, at)];
    let safety: CompanionSafety | undefined;
    if (pre < SafetyLevel.High) {
      const sessionId = get().entries.find((e) => e.id === id)?.sessionId;
      const reply = await companionReply(sessionId, text, 'Journal');
      const cturn = turn('companion', reply.response, at);
      if (reply.question) cturn.pendingQuestion = reply.question;
      extra.push(cturn);
      safety = reply.safety;
    }
    // Authoritative tier for the entry's running safety level + crisis routing.
    const level = await resolveSafety(text, safety);
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

  async renameEntry(id, title) {
    const next = title.trim();
    if (!next) return;
    const entry = get().entries.find((e) => e.id === id);
    if (!entry || next === entry.headline) return;
    const journalId = journalIdOf(entry, get().serverSessions);
    if (journalId == null) {
      throw new Error('This entry is still saving — try renaming again in a moment.');
    }
    // Persist to the encrypted title column, then reflect it locally.
    await services.journal.update(journalId, { title: next });
    set((s) => ({
      entries: s.entries.map((e) =>
        e.id === id ? { ...e, headline: next, journalId } : e,
      ),
    }));
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
      // No backend profile (e.g. offline / pre-survey): keep any in-memory
      // entries from this session; there is nothing server-side to load.
      set({ serverSessions: [] });
      return;
    }
    try {
      // The journal is server-authoritative now (online-only; no on-device
      // persistence of entry bodies). Load the persisted entries for this
      // profile and the chat-session summaries that carry their safety tier.
      const [sessions, records] = await Promise.all([
        services.chat.listSessions(profileId),
        services.journal.list(profileId),
      ]);
      const sessionById = new Map(sessions.map((s) => [s.id, s]));
      // A session's journal_entry_id links it to the journal row (Dwight's
      // contract): map that id → the session (for continue) and its tier.
      const sessionByJournalId = new Map<number, ChatSessionSummary>();
      for (const s of sessions) {
        if (s.journalEntryId != null) sessionByJournalId.set(s.journalEntryId, s);
      }
      set((state) => {
        // Live entries created this session keep their rich turns / pending
        // questions; dedupe them against the server rows by journal id.
        const liveByJournalId = new Map<number, Entry>();
        for (const e of state.entries) {
          const jid = liveJournalId(e, sessionById);
          if (jid != null) liveByJournalId.set(jid, e);
        }
        const merged: Entry[] = records.map((r) => {
          const session = sessionByJournalId.get(r.id);
          const level = session ? levelForTier(session.safetyTier) : SafetyLevel.Normal;
          const live = liveByJournalId.get(r.id);
          if (live) {
            // Keep the richer live entry; stamp its now-known journal id and only
            // ratchet its tier up. Never downgrade.
            return {
              ...live,
              journalId: r.id,
              safetyLevel: Math.max(live.safetyLevel, level),
            };
          }
          return recordToEntry(r, session?.id, level);
        });
        // In-memory entries with no server row yet (offline create, or the
        // journal link not written) survive so nothing the user just wrote drops.
        const serverIds = new Set(records.map((r) => r.id));
        const leftovers = state.entries.filter((e) => {
          const jid = liveJournalId(e, sessionById);
          return jid == null || !serverIds.has(jid);
        });
        const entries = [...merged, ...leftovers].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        );
        return { serverSessions: sessions, entries };
      });
    } catch {
      // Offline / transient: keep whatever we last loaded.
    }
  },

  resetForProfile() {
    useSafetyStore.getState().clear();
    set({ entries: [], serverSessions: [], planLimit: null });
  },
}));
