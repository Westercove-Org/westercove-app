import { isSponsoredAccount } from '@/features/auth/sponsored';

describe('isSponsoredAccount (R-60 must-never-happen gate)', () => {
  it('is sponsored for a license entitlement or a partner entry path', () => {
    expect(isSponsoredAccount('license_active', 'consumer_trial')).toBe(true);
    expect(isSponsoredAccount('trial_active', 'partner_license')).toBe(true);
    expect(isSponsoredAccount('license_active', 'partner_license')).toBe(true);
  });

  it('is NOT sponsored for a paying or trialing consumer', () => {
    expect(isSponsoredAccount('trial_active', 'consumer_trial')).toBe(false);
    expect(isSponsoredAccount('active_monthly', 'consumer_trial')).toBe(false);
    expect(isSponsoredAccount('active_annual', 'consumer_trial')).toBe(false);
    expect(isSponsoredAccount('lapsed', 'consumer_trial')).toBe(false);
  });
});
