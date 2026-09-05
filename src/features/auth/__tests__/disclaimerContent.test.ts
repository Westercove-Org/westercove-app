import { NOTICE_VERSION, WELCOME_NOTICE } from '@/constants/welcomeNotice';
import { resolveDisclaimer } from '@/features/auth/disclaimerContent';
import type { DisclaimerContent } from '@/services';

const served: DisclaimerContent = {
  version: 'v13.2026-09-05',
  title: 'Welcome to Westercove™',
  summary: ['Please read this before you begin. It is short, and it matters.'],
  paragraphs: [
    'What Westercove™ is.',
    'Westercove™ is a digital grief wellness companion …',
    'You must be 18 or older to use it.',
    'A few promises.',
    'We will not use the word closure.',
  ],
  bullets: [],
  acknowledgementChecks: ['By continuing, you confirm that you are 18 or older. …'],
  acknowledgementLabel: 'Begin',
  saveAndReadLaterLabel: 'Save and read later',
  communityGuidelinesUrl: null,
  links: [],
  lastUpdated: null,
};

describe('resolveDisclaimer', () => {
  it('renders the served content and records ITS version (v13)', () => {
    const r = resolveDisclaimer(served);
    expect(r.usingFallback).toBe(false);
    expect(r.version).toBe('v13.2026-09-05');
    expect(r.intro).toEqual(served.summary);
    // Recognized headings become heading blocks; everything else is body.
    expect(r.blocks).toContainEqual({ heading: 'What Westercove™ is.' });
    expect(r.blocks).toContainEqual({ heading: 'A few promises.' });
    expect(r.blocks).toContainEqual({ body: 'You must be 18 or older to use it.' });
    expect(r.blocks.some((b) => b.body?.includes('grief wellness companion'))).toBe(true);
  });

  it('falls back to the hardcoded notice when content is null (fetch failure / offline)', () => {
    const r = resolveDisclaimer(null);
    expect(r.usingFallback).toBe(true);
    // Version integrity: fallback carries its OWN version, never v13-on-v12-text.
    expect(r.version).toBe(NOTICE_VERSION);
    expect(r.version).not.toBe('v13.2026-09-05');
    expect(r.blocks).toBe(WELCOME_NOTICE.blocks);
    expect(r.communityGuidelinesUrl).toBeNull();
  });

  it('passes an absolute community-guidelines URL through unchanged', () => {
    const r = resolveDisclaimer({ ...served, communityGuidelinesUrl: 'https://x/guidelines' });
    expect(r.communityGuidelinesUrl).toBe('https://x/guidelines');
  });

  it('resolves a relative community-guidelines path against the public site', () => {
    const r = resolveDisclaimer({
      ...served,
      communityGuidelinesUrl: '/about/westercove#community-guidelines',
    });
    expect(r.communityGuidelinesUrl).toBe(
      'https://westercove.com/about/westercove#community-guidelines',
    );
  });
});
