import { ENTRY_PLACEHOLDERS, ENTRY_TYPES } from '@/features/journal/entryTypes';

/**
 * R-31/R-45: this defect class ships silently — a hint drifts from the approved
 * copy, or a category disappears — and only a literal test catches it. The ten
 * hints below are Wesley's approved wording (spec v7 Item 9), verbatim, ASCII
 * ellipsis included. If a hint changes, change it here on purpose.
 *
 * The Home button list is `ENTRY_TYPES` itself (index.tsx `HOME_CHIPS =
 * ENTRY_TYPES`), so button list == category list by construction; locking
 * ENTRY_TYPES here locks both.
 */
const APPROVED_HINTS: Record<(typeof ENTRY_TYPES)[number], string> = {
  Journal: 'Write your journal entry here...',
  'Grief Question': 'Ask your grief question here...',
  Anniversary: 'Which dates do you want me to remember?',
  Emotions: 'What are you feeling?',
  Forgiveness: 'How can I help with forgiveness?',
  Letter: 'Write your letter here...',
  Memory: 'Record your memory here...',
  Practice: 'Enter practices that help you...',
  Sign: 'Enter a sign you experienced here...',
  Struggle: 'What is your struggle?',
};

describe('approved hints (R-31/R-45)', () => {
  it('the category list is the ten canonical types', () => {
    expect([...ENTRY_TYPES]).toEqual(Object.keys(APPROVED_HINTS));
  });

  it('every category resolves to its approved hint, verbatim', () => {
    expect(ENTRY_PLACEHOLDERS).toEqual(APPROVED_HINTS);
  });
});
