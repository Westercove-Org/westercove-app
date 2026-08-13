import { DEMO_ROSTER, resolveDemoProfile } from '@/features/profile/demoProfiles';

describe('demoProfiles', () => {
  it('carries the nine test profiles', () => {
    expect(DEMO_ROSTER).toHaveLength(9);
  });

  it('resolves a first name, a last name, or the full name', () => {
    expect(resolveDemoProfile('Corinne')?.id).toBe('demo-corinne');
    expect(resolveDemoProfile('Baker')?.id).toBe('demo-corinne');
    expect(resolveDemoProfile('Corinne Baker')?.fullName).toBe('Corinne Baker');
  });

  it('ignores case and stray spacing', () => {
    expect(resolveDemoProfile('  marcus   BELL ')?.id).toBe('demo-marcus');
  });

  it('resolves either name on the shared account', () => {
    expect(resolveDemoProfile('Paul')?.id).toBe('demo-carol');
    expect(resolveDemoProfile('carol & paul sutton')?.fullName).toBe('Carol & Paul Sutton');
  });

  it('refuses a name that is not on the roster', () => {
    expect(resolveDemoProfile('Someone Else')).toBeNull();
    expect(resolveDemoProfile('')).toBeNull();
  });
});
