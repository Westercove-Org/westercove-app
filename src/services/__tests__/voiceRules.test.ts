import { sanitize } from '@/services/voiceRules';

describe('voiceRules.sanitize', () => {
  it('replaces em and en dashes with a comma', () => {
    expect(sanitize('the love and the ache — both true')).toBe(
      'the love and the ache, both true',
    );
    expect(sanitize('a pause – then quiet')).toBe('a pause, then quiet');
  });

  it('turns exclamation points into periods', () => {
    expect(sanitize('That is wonderful!')).toBe('That is wonderful.');
    expect(sanitize('Wow!!!')).toBe('Wow.');
  });

  it('replaces euphemisms for death with "died", preserving case', () => {
    expect(sanitize('She passed away in the spring.')).toBe('She died in the spring.');
    expect(sanitize('Passed on last year.')).toBe('Died last year.');
    expect(sanitize('He passed in January.')).toBe('He died in January.');
  });

  it('leaves compliant text untouched', () => {
    const s = 'What you carry is real, and it makes sense that it sits heavy.';
    expect(sanitize(s)).toBe(s);
  });
});
