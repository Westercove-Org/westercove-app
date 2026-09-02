import { copy } from '@/constants/copy';
import { ENTRY_INTROS, ENTRY_TYPES } from '@/features/journal/entryTypes';

/**
 * The Gratitude lead-in is the one piece of copy on the compose screen that can
 * actively hurt a reader if it drifts. Unframed, "add something you are grateful
 * for" reads to a griever as "look on the bright side" — so these assertions lock
 * both the exact approved wording and the three properties the wording exists to
 * guarantee: it never asks anyone to be grateful FOR the death, it never claims
 * gratitude reduces grief, and it explicitly permits an empty day.
 */
const APPROVED_INTRO =
  'These are some of the worst days of your life, and gratitude will not make them lighter. ' +
  'But grief moves in waves, and in the space between them people often find something small ' +
  'still worth holding. Maybe it is a kindness, a song, an hour of sleep, the fact that your ' +
  'loved one existed at all. Add one if one comes. If nothing comes today, that is an honest ' +
  'answer too.';

describe('Gratitude intro copy', () => {
  it('is a category with a lead-in', () => {
    expect(ENTRY_TYPES).toContain('Gratitude');
    expect(ENTRY_INTROS.Gratitude).toBe(copy.gratitude);
  });

  it('is the approved wording, verbatim', () => {
    expect(copy.gratitude.title).toBe('Gratitude, alongside the grief');
    expect(copy.gratitude.body).toBe(APPROVED_INTRO);
  });

  it('names the hardness rather than softening it', () => {
    expect(copy.gratitude.body).toContain('worst days of your life');
    expect(copy.gratitude.body).toContain('gratitude will not make them lighter');
  });

  it('leaves an empty day as a valid answer', () => {
    expect(copy.gratitude.body).toContain('If nothing comes today, that is an honest answer too');
  });
});
