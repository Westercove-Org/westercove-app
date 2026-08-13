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

/**
 * How the person asked to be met on faith, in one line for the overview. Silence
 * is meaningful here: an unanswered question says nothing, and "prefer not to
 * say" or an unnamed tradition is never guessed at.
 */
export function faithSummary(q: {
  faithLanguage?: string;
  faithTradition?: string;
  faithTraditionDetail?: string;
}): string {
  const fl = (q.faithLanguage ?? '').trim();
  if (!fl) return '';
  const detail = (q.faithTraditionDetail ?? '').trim();
  const trad = (q.faithTradition ?? '').trim();
  const named =
    detail || (trad && trad !== 'Prefer not to say' && !/^Another faith/i.test(trad) ? trad : '');
  if (/^No/i.test(fl)) return 'Prefers that faith or spiritual language be kept out of this space.';
  if (/^Some/i.test(fl))
    return `Some faith or spiritual language is welcome${named ? ` (${named})` : ''}.`;
  if (/^Yes/i.test(fl)) return `Welcomes faith or spiritual language${named ? ` (${named})` : ''}.`;
  return '';
}
