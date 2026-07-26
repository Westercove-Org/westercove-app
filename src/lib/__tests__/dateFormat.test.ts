import { formatEntryTimestamp, formatHeaderDateTime } from '@/lib/dateFormat';

describe('date formatting', () => {
  it('formats the header date/time', () => {
    // Thursday, 16 July 2026, 9:41 PM
    const d = new Date(2026, 6, 16, 21, 41);
    expect(formatHeaderDateTime(d)).toBe('Thursday, July 16 · 9:41 PM');
  });

  it('converts midnight and noon correctly', () => {
    expect(formatHeaderDateTime(new Date(2026, 0, 1, 0, 0))).toContain('12:00 AM');
    expect(formatHeaderDateTime(new Date(2026, 0, 1, 12, 0))).toContain('12:00 PM');
  });

  it('pads single-digit minutes', () => {
    expect(formatHeaderDateTime(new Date(2026, 0, 1, 9, 5))).toContain('9:05 AM');
  });

  it('formats an entry timestamp as weekday + time', () => {
    // Tuesday, 9:12 PM
    expect(formatEntryTimestamp(new Date(2026, 6, 14, 21, 12))).toBe('Tue 9:12 PM');
  });
});
