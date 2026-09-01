import { TRIAL_DAYS, formatFirstChargeDate } from '@/constants/billing';

describe('billing trial terms', () => {
  it('trial length fallback is 14 days', () => {
    expect(TRIAL_DAYS).toBe(14);
  });

  it('formats an ISO first-charge date as a plain date', () => {
    expect(formatFirstChargeDate('2026-01-15T00:00:00')).toBe(
      new Date('2026-01-15T00:00:00').toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    );
  });

  it('renders a non-date server value as-is (never invents a date)', () => {
    expect(formatFirstChargeDate('January 15, 2026')).toBe('January 15, 2026');
  });
});
