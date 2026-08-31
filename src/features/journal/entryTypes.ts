/**
 * The 10 command / entry types shown in the compose picker, in the order the
 * Journal screen presents them. Presented as one flat list; no built-in vs.
 * custom grouping is shown to the user (handoff §5.3).
 */
export const ENTRY_TYPES = [
  'Journal',
  'Grief Question',
  'Anniversary',
  'Emotions',
  'Forgiveness',
  'Letter',
  'Memory',
  'Practice',
  'Sign',
  'Struggle',
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

/** Type-specific placeholder copy for the compose field. */
export const ENTRY_PLACEHOLDERS: Record<EntryType, string> = {
  Journal: "What's on your mind today?",
  'Grief Question': 'What are you wondering about?',
  Anniversary: 'What does this date hold?',
  Emotions: "What are you feeling right now?",
  Forgiveness: 'What needs saying?',
  Letter: 'What would you like to say to them?',
  Memory: 'What do you want to hold onto?',
  Practice: 'What helps you steady yourself?',
  Sign: 'What did you notice?',
  Struggle: "What's been hard?",
};

export function isEntryType(value: string | undefined): value is EntryType {
  return !!value && (ENTRY_TYPES as readonly string[]).includes(value);
}

/**
 * Client entry-type label → backend `JournalEntryType` enum (Dwight's chat/
 * journal contract). Sent as `entry_type` on the chat message so the server
 * picks the guided/book-bearing reply. `Emotions → emotions` is an additive
 * backend enum still landing; until it does it safely no-ops to a normal turn.
 */
export const ENTRY_TYPE_ENUM: Record<EntryType, string> = {
  Journal: 'journal',
  'Grief Question': 'grief_question',
  Anniversary: 'anniversary',
  Emotions: 'emotions',
  Forgiveness: 'forgive',
  Letter: 'letter',
  Memory: 'memory',
  Practice: 'practice',
  Sign: 'sign',
  Struggle: 'struggle',
};

/**
 * Non-canonical labels that must still reach a real entry type. The visible chip
 * is 'Grief Question', but a bare 'Question' (beta's label, saved/downloaded
 * entries, any shorthand surface) must NOT drop to a normal, book-less turn —
 * it maps to the same guided enum so both labels unlock the guided reply
 * (nt-guided-chip-bug). These are aliases only: they are not shown as chips and
 * are not canonical `EntryType`s (`isEntryType` stays false for them).
 */
const ENTRY_TYPE_ALIASES: Record<string, EntryType> = {
  Question: 'Grief Question',
};

/** The backend enum for an entry-type label, or undefined for an unknown label
 * (the server then treats the turn as a normal one). Canonical labels resolve
 * directly; known aliases resolve through their canonical type. */
export function entryTypeEnum(label: string | undefined): string | undefined {
  if (isEntryType(label)) return ENTRY_TYPE_ENUM[label];
  const alias = label ? ENTRY_TYPE_ALIASES[label] : undefined;
  return alias ? ENTRY_TYPE_ENUM[alias] : undefined;
}

const LABEL_BY_ENUM: Record<string, EntryType> = Object.fromEntries(
  (Object.entries(ENTRY_TYPE_ENUM) as [EntryType, string][]).map(([label, e]) => [e, label]),
);

/** The picker label for a backend `JournalEntryType` enum, for rendering server
 * entries read back from the journal API. Backend-only enums with no client
 * label (e.g. `rage`, `community`) fall back to `Journal`. */
export function labelForEntryType(entryType: string | undefined): EntryType {
  return (entryType && LABEL_BY_ENUM[entryType]) || 'Journal';
}
