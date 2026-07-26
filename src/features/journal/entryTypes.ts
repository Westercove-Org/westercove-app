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
