import { NOTICE_VERSION, WELCOME_NOTICE } from '@/constants/welcomeNotice';

/**
 * The S0 notice is verbatim and load-bearing (Q-Set v7 spec L42-58). This test
 * freezes the parts that must never drift; if the copy legitimately changes,
 * change it here on purpose AND bump NOTICE_VERSION so acceptance is re-asked.
 */
describe('welcome notice (S0, verbatim)', () => {
  it('has a version', () => {
    expect(typeof NOTICE_VERSION).toBe('string');
    expect(NOTICE_VERSION.length).toBeGreaterThan(0);
  });

  it('opens with the exact title and tagline', () => {
    expect(WELCOME_NOTICE.title).toBe('Welcome to Westercove™');
    expect(WELCOME_NOTICE.tagline).toBe('Here for you when the world goes quiet.');
  });

  it('keeps the crisis numbers at the foot of the notice', () => {
    const crisis = WELCOME_NOTICE.sections.find((s) =>
      s.heading.startsWith('If you are in crisis'),
    );
    expect(crisis).toBeDefined();
    expect(crisis!.body).toContain('988');
    expect(crisis!.body).toContain('741741');
    expect(crisis!.body).toContain('911');
  });

  it('keeps the adults-only line and the load-bearing promises verbatim', () => {
    expect(WELCOME_NOTICE.adultsLine).toBe(
      'Westercove™ is for adults. You must be 18 or older to use it.',
    );
    const promises = WELCOME_NOTICE.sections.find((s) => s.heading === 'A few promises.');
    expect(promises).toBeDefined();
    expect(promises!.body).toContain('We will not use the word closure');
    expect(promises!.body).toContain('We will not call this a journey');
    expect(promises!.body).toContain('We will not say “at least.”');
  });

  it('uses the exact tick label', () => {
    expect(WELCOME_NOTICE.tickLabel).toBe(
      'I am 18 or older, and I have read and understand the above.',
    );
  });
});
