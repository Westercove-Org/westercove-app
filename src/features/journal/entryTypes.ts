import { copy } from '@/constants/copy';

/**
 * The 11 command / entry types shown in the compose picker, in the order the
 * Journal screen presents them. Presented as one flat list; no built-in vs.
 * custom grouping is shown to the user (handoff §5.3). Order is `Journal` and
 * `Grief Question` first, then alphabetical.
 */
export const ENTRY_TYPES = [
  'Journal',
  'Grief Question',
  'Anniversary',
  'Emotions',
  'Forgiveness',
  'Gratitude',
  'Letter',
  'Memory',
  'Practice',
  'Sign',
  'Struggle',
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

/** Type-specific placeholder copy for the compose field. */
export const ENTRY_PLACEHOLDERS: Record<EntryType, string> = {
  Journal: 'Write your journal entry here...',
  'Grief Question': 'Ask your grief question here...',
  Anniversary: 'Which dates do you want me to remember?',
  Emotions: 'What are you feeling?',
  Forgiveness: 'How can I help with forgiveness?',
  Gratitude: 'Name one thing, however small, you are grateful for...',
  Letter: 'Write your letter here...',
  Memory: 'Record your memory here...',
  Practice: 'Enter practices that help you...',
  Sign: 'Enter a sign you experienced here...',
  Struggle: 'What is your struggle?',
};

/**
 * Optional lead-in shown above the compose field for a type, when the type
 * needs framing before someone starts writing. Only Gratitude has one today:
 * unframed, a gratitude prompt reads to a griever as "look on the bright
 * side", so the invitation has to name that first. Types with no entry here
 * render no card.
 */
export const ENTRY_INTROS: Partial<Record<EntryType, { title: string; body: string }>> = {
  Gratitude: copy.gratitude,
};

export function isEntryType(value: string | undefined): value is EntryType {
  return !!value && (ENTRY_TYPES as readonly string[]).includes(value);
}

/**
 * Client entry-type label → backend `JournalEntryType` enum (Dwight's chat/
 * journal contract). Sent as `entry_type` on the chat message so the server
 * picks the guided/book-bearing reply. `Emotions → emotions` and `Gratitude →
 * gratitude` are additive backend enums still landing; until they do they
 * safely no-op to a normal turn (an absent or unknown `entry_type` is a normal
 * chat turn per the chat contract, so nothing fails to save meanwhile).
 */
export const ENTRY_TYPE_ENUM: Record<EntryType, string> = {
  Journal: 'journal',
  'Grief Question': 'grief_question',
  Anniversary: 'anniversary',
  Emotions: 'emotions',
  Forgiveness: 'forgive',
  Gratitude: 'gratitude',
  Letter: 'letter',
  Memory: 'memory',
  Practice: 'practice',
  Sign: 'sign',
  Struggle: 'struggle',
};

/** The backend enum for an entry-type label, or undefined for an unknown label
 * (the server then treats the turn as a normal one). */
export function entryTypeEnum(label: string | undefined): string | undefined {
  return isEntryType(label) ? ENTRY_TYPE_ENUM[label] : undefined;
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
