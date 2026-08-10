import type { Entry } from './types';

/**
 * What goes into an export, kept apart from the PDF rendering so it can be
 * tested (and reasoned about) without pulling in jsPDF.
 */

/** Entry types kept out of the export when the Rage toggle is off. */
export const PROTECTED_TYPES = ['Rage'];

/**
 * The author's own words only, oldest first. Companion replies are dropped
 * here, not later: the export is the person's writing, not a transcript of the
 * app talking to them.
 */
export function userEntries(
  entries: Entry[],
  includeRage: boolean,
): { date: string; text: string }[] {
  return entries
    .filter((e) => includeRage || !PROTECTED_TYPES.includes(e.type))
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((e) => ({
      date: e.createdAt,
      text: e.turns
        .filter((t) => t.role === 'user')
        .map((t) => t.text.trim())
        .filter(Boolean)
        .join('\n\n'),
    }))
    .filter((e) => e.text);
}
