export interface ConversationTurn {
  id: string;
  role: 'user' | 'companion';
  text: string;
  /** ISO timestamp. */
  at: string;
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
}
