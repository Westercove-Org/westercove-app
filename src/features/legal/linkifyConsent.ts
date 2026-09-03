import type { LegalLink } from '@/services/legal';

/** A piece of a consent line: plain text, or text that links to a legal screen. */
export type ConsentSegment = { text: string; route?: string };

/** Legal documents the app can actually open. A served link whose document is
 * not here resolves to nothing, so it must stay plain text — a tap that opens
 * nothing on a consent screen is worse than prose. Privacy has no screen yet. */
const ROUTES: Record<string, string> = {
  terms: '/legal-terms',
  disclaimer: '/legal-disclaimer',
};

export function routeForDocument(document: string): string | null {
  return ROUTES[document] ?? null;
}

/**
 * Split a consent summary line into plain + linked segments, linkifying each
 * served label in place. A link is applied only when BOTH hold, because this is
 * a consent screen and any failure must read as ordinary prose:
 *   1. the label is found in the line — a stale label (Wesley revises the copy)
 *      degrades to plain text, never throws or blanks the line; and
 *   2. its document resolves to a real screen — an unoffered target (e.g.
 *      Privacy, not seeded) shows nothing rather than a dead tap.
 * With no applicable links the whole line comes back as a single plain segment.
 */
export function linkifyConsentLine(line: string, links: LegalLink[]): ConsentSegment[] {
  const matches = links
    .map((l) => ({ label: l.label, route: routeForDocument(l.document), index: line.indexOf(l.label) }))
    .filter((m): m is { label: string; route: string; index: number } =>
      m.route != null && m.label.length > 0 && m.index >= 0,
    )
    // By start index; at a shared start the longer label wins, so an overlapping
    // shorter one (e.g. "Privacy" inside "Privacy notice") is consumed by the
    // full phrase rather than orphaning its tail. Order-independent: the day a
    // second label seeds adjacent, the outcome does not depend on served order.
    .sort((a, b) => a.index - b.index || b.label.length - a.label.length);

  const segments: ConsentSegment[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.index < cursor) continue; // overlapping label already consumed
    if (m.index > cursor) segments.push({ text: line.slice(cursor, m.index) });
    segments.push({ text: m.label, route: m.route });
    cursor = m.index + m.label.length;
  }
  if (cursor < line.length) segments.push({ text: line.slice(cursor) });
  return segments.length > 0 ? segments : [{ text: line }];
}
