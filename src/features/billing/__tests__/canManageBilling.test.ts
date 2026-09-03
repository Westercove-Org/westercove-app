import { canManageBilling } from '../canManageBilling';

describe('canManageBilling', () => {
  it('grace with NO stripeStatus still sees manage-billing (the pre-#124 member the banner sends here)', () => {
    expect(canManageBilling('grace', false)).toBe(true);
  });

  it('lapsed with no stripeStatus still sees it — paying still brings them back', () => {
    expect(canManageBilling('lapsed', false)).toBe(true);
  });

  it('paying-by-entitlement members see it without a stripeStatus', () => {
    expect(canManageBilling('active_monthly', false)).toBe(true);
    expect(canManageBilling('active_annual', false)).toBe(true);
  });

  it('any stripeStatus subscriber sees it regardless of entitlement', () => {
    expect(canManageBilling('trial_active', true)).toBe(true);
    expect(canManageBilling(undefined, true)).toBe(true);
  });

  it('trial / sponsored / unknown with no stripeStatus have no personal billing to manage', () => {
    expect(canManageBilling('trial_active', false)).toBe(false);
    expect(canManageBilling('license_active', false)).toBe(false);
    expect(canManageBilling(undefined, false)).toBe(false);
  });
});
