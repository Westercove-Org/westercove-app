import { TRIAL_DAYS, firstChargeDate } from '@/constants/billing';

describe('billing trial terms', () => {
  it('trial is 14 days', () => {
    expect(TRIAL_DAYS).toBe(14);
  });

  it('first charge lands TRIAL_DAYS after the given start', () => {
    // 2026-01-01 → +14 days → 2026-01-15.
    const start = new Date('2026-01-01T12:00:00Z');
    expect(firstChargeDate(start)).toBe(
      new Date('2026-01-15T12:00:00Z').toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    );
  });
});
