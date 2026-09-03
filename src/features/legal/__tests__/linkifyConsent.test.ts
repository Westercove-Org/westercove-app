import { linkifyConsentLine } from '../linkifyConsent';

const LINE = 'By continuing, you confirm you are 18 or older and that you agree to our Terms and Privacy notice.';

describe('linkifyConsentLine', () => {
  it('rule 1: a label not in the line renders the FULL sentence intact and unlinked, never throws', () => {
    const out = linkifyConsentLine(LINE, [{ label: 'Community Guidelines', document: 'terms' }]);
    // The whole sentence text is preserved, byte for byte...
    expect(out.map((s) => s.text).join('')).toBe(LINE);
    // ...and nothing in it is a link (no half-linked fragment, no blanked line).
    expect(out.some((s) => s.route !== undefined)).toBe(false);
    // Concretely: one plain segment carrying the entire sentence.
    expect(out).toEqual([{ text: LINE }]);
  });

  it('linkifies a served label in place, keeping the surrounding prose', () => {
    const out = linkifyConsentLine(LINE, [{ label: 'Terms', document: 'terms' }]);
    expect(out).toEqual([
      { text: 'By continuing, you confirm you are 18 or older and that you agree to our ' },
      { text: 'Terms', route: '/legal-terms' },
      { text: ' and Privacy notice.' },
    ]);
  });

  it('rule 2: a document with no screen (Privacy) stays plain text, no dead tap', () => {
    const out = linkifyConsentLine(LINE, [{ label: 'Privacy notice', document: 'privacy' }]);
    expect(out).toEqual([{ text: LINE }]);
  });

  it('links only the offered document when the line names two', () => {
    const out = linkifyConsentLine(LINE, [
      { label: 'Terms', document: 'terms' },
      { label: 'Privacy notice', document: 'privacy' },
    ]);
    expect(out.filter((s) => s.route)).toEqual([{ text: 'Terms', route: '/legal-terms' }]);
  });

  it('no links at all → single plain segment', () => {
    expect(linkifyConsentLine(LINE, [])).toEqual([{ text: LINE }]);
  });

  // Overlap hardening: two labels sharing a start index ("Privacy" ⊂ "Privacy
  // notice"). Fed shorter-first — the order that used to orphan " notice." — the
  // longer label must still win, so the seed of a second adjacent label lands on
  // deterministic behaviour rather than served order.
  it('overlapping labels at the same start index: the longer wins regardless of order', () => {
    const out = linkifyConsentLine(LINE, [
      { label: 'Privacy', document: 'terms' }, // shorter, listed first
      { label: 'Privacy notice', document: 'terms' },
    ]);
    expect(out.map((s) => s.text).join('')).toBe(LINE); // sentence intact
    expect(out.filter((s) => s.route)).toEqual([{ text: 'Privacy notice', route: '/legal-terms' }]);
  });

  // The go-live shape: the moment Privacy is seeded, the backend serves a second
  // link on the SAME sentence with no client change. This pins the multi-link
  // branch (two matches, sorted, emitted around the prose between them) so it
  // cannot activate silently and wrong on a content drop.
  it('links TWO served labels in one sentence — both linkify, order and prose intact, neither swallows the other', () => {
    const out = linkifyConsentLine(LINE, [
      { label: 'Terms', document: 'terms' },
      { label: 'Privacy notice', document: 'terms' },
    ]);
    // full sentence preserved byte-for-byte
    expect(out.map((s) => s.text).join('')).toBe(LINE);
    // exactly the two labels are linked, in sentence order
    expect(out.filter((s) => s.route)).toEqual([
      { text: 'Terms', route: '/legal-terms' },
      { text: 'Privacy notice', route: '/legal-terms' },
    ]);
    // the run of prose between the two links is intact and unlinked
    const i = out.findIndex((s) => s.text === 'Terms');
    const j = out.findIndex((s) => s.text === 'Privacy notice');
    expect(j).toBeGreaterThan(i);
    const between = out.slice(i + 1, j);
    expect(between.every((s) => s.route === undefined)).toBe(true);
    expect(between.map((s) => s.text).join('')).toBe(' and ');
  });
});
