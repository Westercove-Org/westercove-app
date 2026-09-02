import { DEEP_LINK_TARGETS, rememberTarget, takeTarget } from '../deepLink';

describe('deepLink target', () => {
  afterEach(() => {
    takeTarget(); // drain any pending target between tests
  });

  it('remembers a registered target and hands it back once', () => {
    rememberTarget('/subscription');
    expect(takeTarget()).toBe('/subscription');
    // consumed: the next read is empty (guard then falls soft to Home)
    expect(takeTarget()).toBeNull();
  });

  it('fails soft: a non-registered path is not remembered', () => {
    rememberTarget('/some/other/screen');
    expect(takeTarget()).toBeNull();
  });

  it('a non-target clears a previously remembered target', () => {
    rememberTarget('/subscription');
    rememberTarget('/'); // e.g. a cold unauthenticated open at Home
    expect(takeTarget()).toBeNull();
  });

  it('only the billing deep-link targets are registered', () => {
    expect([...DEEP_LINK_TARGETS]).toEqual(['/subscription', '/update-card']);
  });
});
