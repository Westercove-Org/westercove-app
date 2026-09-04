import type { Entry } from '@/features/journal/types';
import type { LearnedItem } from '@/features/profile/whatIKnowStore';

/**
 * A line typed straight into the Gratitude section is stored in What I Know
 * prefixed with this string, so it can be gathered back to the right place.
 */
export const GRATITUDE_LINE_PREFIX = 'Something I am grateful for: ';

/**
 * The Gratitude section is DERIVED, never stored (v16): read fresh every time
 * the screen opens so it can never drift from its sources. It gathers two
 * things — the person's Gratitude entries (their own words), and anything typed
 * straight into the section, which lives in What I Know on a line beginning
 * "Something I am grateful for: ". Entries come first (newest already first in
 * the store), then the typed lines. Blank items are dropped.
 */
export function gatherGratitude(entries: Entry[], learned: LearnedItem[]): string[] {
  const fromEntries = entries
    .filter((e) => e.type === 'Gratitude')
    .map((e) => e.turns.find((t) => t.role === 'user')?.text?.trim() ?? '')
    .filter(Boolean);

  const fromWhatIKnow = learned
    .filter((i) => i.value.startsWith(GRATITUDE_LINE_PREFIX))
    .map((i) => i.value.slice(GRATITUDE_LINE_PREFIX.length).trim())
    .filter(Boolean);

  return [...fromEntries, ...fromWhatIKnow];
}
