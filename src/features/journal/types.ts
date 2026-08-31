export interface ConversationTurn {
  id: string;
  role: 'user' | 'companion';
  text: string;
  /** ISO timestamp. */
  at: string;
  /** A staged 4-Doors question the companion asked at the end of this turn
   * (question text already in `text`); drives the inline quick-reply chips.
   * Cleared once the user answers, defers, or skips it. */
  pendingQuestion?: { questionId: string; options: string[] };
}

export interface Entry {
  id: string;
  type: string;
  /** Neutral headline generated from the entry's own content. */
  headline: string;
  /** ISO timestamp of creation. */
  createdAt: string;
  turns: ConversationTurn[];
  /** The user chose "just heard" — no companion response for the first turn. */
  justHeard?: boolean;
  /** Highest safety level seen on this entry (1 Normal … 4 Critical). */
  safetyLevel: number;
  /** Backend chat-session id, once the session has been created for this entry. */
  sessionId?: number;
  /** Server journal-entry id (the `/api/journal/{id}` key), once known — set for
   * entries loaded from the server and stamped onto live entries on refresh.
   * Drives edit (title rename) via `journalService.update`. */
  journalId?: number;
}
