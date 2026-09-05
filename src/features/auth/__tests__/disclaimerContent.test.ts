import { DISCLAIMER_V13 } from '@/features/auth/disclaimerContent';

/**
 * The disclaimer body is FE-owned and rendered verbatim, so its STRUCTURE (five
 * headed sections in order, the standalone 18+ line, the inline "One thing we
 * ask." opening) and load-bearing copy are locked here. Changing the wording is
 * a deliberate act that must also bump DISCLAIMER_V13.version (acceptance is
 * re-asked against the shown version).
 */
describe('DISCLAIMER_V13', () => {
  const headings = DISCLAIMER_V13.blocks.filter((b) => b.kind === 'heading').map((b) => b.text);
  const standalones = DISCLAIMER_V13.blocks.filter((b) => b.kind === 'standalone').map((b) => b.text);
  const allText = DISCLAIMER_V13.blocks.map((b) => b.text).join('\n');

  it('records a v13 version', () => {
    expect(DISCLAIMER_V13.version).toBe('v13.2026-09-05');
  });

  it('has exactly five headed sections, in Wesley order', () => {
    expect(headings).toEqual([
      'What Westercove™ is.',
      'If you are in crisis, please reach a person.',
      'What this space will hold.',
      'Your writing belongs to you.',
      'A few promises.',
    ]);
  });

  it('carries the 18+ line as a standalone (not a heading), between §1 and §2', () => {
    expect(standalones).toEqual(['You must be 18 or older to use it.']);
    // It must sit after "What Westercove™ is." and before the crisis heading.
    const kinds = DISCLAIMER_V13.blocks.map((b) => b.kind);
    const standaloneIdx = kinds.indexOf('standalone');
    const crisisIdx = DISCLAIMER_V13.blocks.findIndex(
      (b) => b.kind === 'heading' && b.text.startsWith('If you are in crisis'),
    );
    expect(standaloneIdx).toBeGreaterThan(0);
    expect(standaloneIdx).toBeLessThan(crisisIdx);
  });

  it('opens the second "what this space will hold" paragraph with "One thing we ask." inline, not as a heading', () => {
    expect(headings).not.toContain('One thing we ask.');
    const para = DISCLAIMER_V13.blocks.find(
      (b) => b.kind === 'para' && b.text.startsWith('One thing we ask.'),
    );
    expect(para).toBeDefined();
  });

  it('renders the trademark glyph, never the word "trademark"', () => {
    expect(allText).toContain('Westercove™');
    expect(allText.toLowerCase()).not.toContain('trademark');
  });

  it('keeps the crisis numbers and the thirty-day window', () => {
    expect(allText).toContain('988');
    expect(allText).toContain('741741');
    expect(allText).toContain('911');
    expect(allText).toContain('thirty days');
  });
});
