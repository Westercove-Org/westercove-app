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

export interface ChatSessionService {
  /** Create a chat session for a new journal entry; returns its id. */
  createSession(input?: CreateSessionInput): Promise<{ sessionId: number }>;
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
