import type { Entry } from './types';

/**
 * What goes into an export, kept apart from the PDF rendering so it can be
 * tested (and reasoned about) without pulling in jsPDF.
 */

/**
 * The author's own words only, oldest first. Companion replies are dropped
 * here, not later: the export is the person's writing, not a transcript of the
 * app talking to them.
 */
export function userEntries(entries: Entry[]): { date: string; text: string }[] {
  return entries
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
