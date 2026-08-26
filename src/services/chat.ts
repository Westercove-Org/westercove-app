import { apiClient } from '@/lib/http';

/** A chat/journal session summary as returned by the backend
 * (`ChatSessionSummary` in QuietRoom `api/chat.py`). One session backs one
 * journal entry; `journalEntryId` links them once the entry is saved. */
export interface ChatSessionSummary {
  id: number;
  /** ISO timestamp. */
  createdAt: string;
  title?: string;
  /** e.g. `journal`. */
  entryType: string;
  /** Safety tier the backend assigned: `none` | `support` | `crisis` | … */
  safetyTier: string;
  journalEntryId?: number;
}

export interface CreateSessionInput {
  /** Backend profile id. Omit → backend uses the user's default profile. */
  profileId?: number;
  title?: string;
}

export interface PostMessageInput {
  /** Backend profile id → sent as `X-Profile-Id` so the reply is generated in
   * this companion's voice. */
  profileId?: number;
  /** IANA timezone (e.g. `America/New_York`) → `X-Client-Timezone`. */
  timezone?: string;
}

/** A staged 4-Doors question the companion voiced in this reply (the prompt text
 * is already appended to `reply`); drives the inline quick-reply / defer-skip UI.
 * Empty `options` = a free-text answer. */
export interface FourDoorsQuestion {
  questionId: string;
  options: string[];
}

export interface CompanionMessageReply {
  /** The companion's generated reply text (assistant turn). */
  reply: string;
  /** The session's title after this message, if the backend (re)named it. */
  sessionTitle?: string;
  /** Present when the reply carried a 4-Doors `four_doors_question` effect. */
  question?: FourDoorsQuestion;
}

export interface ChatSessionService {
  /** Create a chat session for a new journal entry; returns its id. */
  createSession(input?: CreateSessionInput): Promise<{ sessionId: number }>;
  /** Post a user message to a session and get the companion's reply. This is
   * where companion generation happens now (backend AI), replacing the app's
   * old direct-to-Anthropic route. */
  postMessage(
    sessionId: number,
    message: string,
    input?: PostMessageInput,
  ): Promise<CompanionMessageReply>;
  /** Summaries of a profile's sessions, newest first (backend order). */
  listSessions(profileId: number): Promise<ChatSessionSummary[]>;
  /** One session's summary. */
  getSession(sessionId: number): Promise<ChatSessionSummary>;
}

/** Wire the backend's snake_case `ChatSessionSummary` onto the camelCase type. */
function toSummary(s: {
  id: number;
  created_at: string;
  title?: string | null;
  entry_type?: string;
  safety_tier?: string;
  journal_entry_id?: number | null;
}): ChatSessionSummary {
  return {
    id: s.id,
    createdAt: s.created_at,
    title: s.title ?? undefined,
    entryType: s.entry_type ?? 'journal',
    safetyTier: s.safety_tier ?? 'none',
    journalEntryId: s.journal_entry_id ?? undefined,
  };
}

/**
 * Real chat-session API over the shared `apiClient` (bearer + central 401).
 * Mirrors QuietRoom routes:
 *  - POST  /chat/sessions                       → { session_id }
 *  - GET   /chat/profiles/{profileId}/sessions  → { sessions: [...] }
 *  - GET   /chat/sessions/{sessionId}           → ChatSessionSummary
 */
export class ApiChatSessionService implements ChatSessionService {
  async createSession(input: CreateSessionInput = {}): Promise<{ sessionId: number }> {
    const res = await apiClient.post<{ session_id: number }>('/chat/sessions', {
      profile_id: input.profileId,
      title: input.title?.trim() || undefined,
    });
    return { sessionId: res.session_id };
  }

  async postMessage(
    sessionId: number,
    message: string,
    input: PostMessageInput = {},
  ): Promise<CompanionMessageReply> {
    const headers: Record<string, string> = {};
    if (input.profileId != null) headers['X-Profile-Id'] = String(input.profileId);
    if (input.timezone) headers['X-Client-Timezone'] = input.timezone;
    const res = await apiClient.post<{
      assistant: { role: string; text: string };
      session_title?: string | null;
      effects?: { type: string; question_id?: string; options?: string[] }[];
    }>(`/chat/sessions/${sessionId}/messages`, { message }, { headers });
    const ask = res.effects?.find((e) => e.type === 'four_doors_question');
    return {
      reply: res.assistant?.text?.trim() ?? '',
      sessionTitle: res.session_title ?? undefined,
      question: ask?.question_id
        ? { questionId: ask.question_id, options: ask.options ?? [] }
        : undefined,
    };
  }

  async listSessions(profileId: number): Promise<ChatSessionSummary[]> {
    const res = await apiClient.get<{ sessions: Parameters<typeof toSummary>[0][] }>(
      `/chat/profiles/${profileId}/sessions`,
    );
    return res.sessions.map(toSummary);
  }

  async getSession(sessionId: number): Promise<ChatSessionSummary> {
    return toSummary(
      await apiClient.get<Parameters<typeof toSummary>[0]>(`/chat/sessions/${sessionId}`),
    );
  }
}
