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
});
