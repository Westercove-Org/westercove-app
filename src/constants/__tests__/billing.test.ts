import { TRIAL_DAYS, formatFirstChargeDate } from '@/constants/billing';

describe('billing trial terms', () => {
  it('trial length fallback is 14 days', () => {
    expect(TRIAL_DAYS).toBe(14);
  });

  // The three shapes the server may send for the same calendar day must all
  // render THAT day — never off-by-one from the device timezone (Angela, #73 QA).
  const sep15 = new Date(Date.UTC(2026, 8, 15)).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

  it('bare YYYY-MM-DD renders that day', () => {
    expect(formatFirstChargeDate('2026-09-15')).toBe(sep15);
  });

  it('Z-suffixed UTC-midnight renders that day', () => {
    expect(formatFirstChargeDate('2026-09-15T00:00:00Z')).toBe(sep15);
  });

  it('local ISO without offset renders that day', () => {
    expect(formatFirstChargeDate('2026-09-15T00:00:00')).toBe(sep15);
  });

  it('renders a non-date server value as-is (never invents a date)', () => {
    expect(formatFirstChargeDate('January 15, 2026')).toBe('January 15, 2026');
  });
});
