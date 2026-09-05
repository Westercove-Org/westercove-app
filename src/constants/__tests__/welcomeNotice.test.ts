import { NOTICE_VERSION, WELCOME_NOTICE } from '@/constants/welcomeNotice';

/**
 * The S0 notice is verbatim, load-bearing, AND order-bound (attorney-signed
 * "the wording, in full", Q-Set v7 spec L42-58). This test freezes the parts
 * and the sequence that must never drift; if the copy legitimately changes,
 * change it here on purpose AND bump NOTICE_VERSION so acceptance is re-asked.
 */
describe('welcome notice (S0, verbatim + ordered)', () => {
  const headings = WELCOME_NOTICE.blocks.map((b) => b.heading ?? '');
  const body = WELCOME_NOTICE.blocks.map((b) => b.body ?? '').join(' ');

  it('has a version', () => {
    expect(typeof NOTICE_VERSION).toBe('string');
    expect(NOTICE_VERSION.length).toBeGreaterThan(0);
  });

  it('opens with the exact title and tagline', () => {
    expect(WELCOME_NOTICE.title).toBe('Welcome to Westercove™');
    expect(WELCOME_NOTICE.tagline).toBe('Here for you when the world goes quiet.');
  });

  it('keeps the 18+ line right after the crisis section (spec L49 order)', () => {
    const crisisIdx = headings.findIndex((h) => h.startsWith('If you are in crisis'));
    const adultsIdx = headings.findIndex((h) =>
      h.startsWith('Westercove™ is for adults'),
    );
    const holdIdx = headings.findIndex((h) => h === 'What this space will hold.');
    expect(crisisIdx).toBeGreaterThanOrEqual(0);
    // Exactly between the crisis section and "What this space will hold".
    expect(adultsIdx).toBe(crisisIdx + 1);
    expect(holdIdx).toBe(adultsIdx + 1);
    expect(headings[adultsIdx]).toBe(
      'Westercove™ is for adults. You must be 18 or older to use it.',
    );
  });

  it('keeps the crisis numbers at the foot of the notice', () => {
    const crisis = WELCOME_NOTICE.blocks.find((b) =>
      b.heading?.startsWith('If you are in crisis'),
    );
    expect(crisis?.body).toContain('988');
    expect(crisis?.body).toContain('741741');
    expect(crisis?.body).toContain('911');
  });

  it('keeps the load-bearing promises verbatim', () => {
    expect(body).toContain('We will not use the word closure');
    expect(body).toContain('We will not call this a journey');
    expect(body).toContain('We will not say “at least.”');
  });

  it('uses the exact tick label', () => {
    expect(WELCOME_NOTICE.tickLabel).toBe(
      'I am 18 or older, and I have read and understand the above.',
    );
  });
});
