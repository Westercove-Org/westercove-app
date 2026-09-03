import { shouldShowRecoveryBanner, useRecoveryBannerStore } from '../recoveryBanner';

describe('shouldShowRecoveryBanner', () => {
  it('shows in the lapsed grace window when not dismissed', () => {
    expect(shouldShowRecoveryBanner('lapsed', false)).toBe(true);
  });

  it('hides once dismissed for the session', () => {
    expect(shouldShowRecoveryBanner('lapsed', true)).toBe(false);
  });

  it('never shows for a healthy or absent entitlement', () => {
    expect(shouldShowRecoveryBanner('active_monthly', false)).toBe(false);
    expect(shouldShowRecoveryBanner('trial_active', false)).toBe(false);
    expect(shouldShowRecoveryBanner('license_active', false)).toBe(false);
    expect(shouldShowRecoveryBanner(undefined, false)).toBe(false);
  });
});

describe('useRecoveryBannerStore', () => {
  it('dismiss is session-only and resettable (not persisted)', () => {
    useRecoveryBannerStore.getState().reset();
    expect(useRecoveryBannerStore.getState().dismissed).toBe(false);
    useRecoveryBannerStore.getState().dismiss();
    expect(useRecoveryBannerStore.getState().dismissed).toBe(true);
    useRecoveryBannerStore.getState().reset();
    expect(useRecoveryBannerStore.getState().dismissed).toBe(false);
  });
});
