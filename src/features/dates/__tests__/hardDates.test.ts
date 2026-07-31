jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import {
  nextUpcoming,
  parseDates,
  resetHardDates,
  useHardDatesStore,
} from '@/features/dates/hardDatesStore';

describe('parseDates', () => {
  it('pulls month/day/year and labels from a meaningful-dates answer', () => {
    const parsed = parseDates('Born May 3, 2017. Died February 9, 2026.');
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({ month: 4, day: 3, year: 2017, label: 'Their birthday' });
    expect(parsed[1]).toMatchObject({ month: 1, day: 9, year: 2026 });
    expect(parsed[1].label).toBe('Anniversary of their death');
  });

  it('handles a month/day with no year', () => {
    const parsed = parseDates('Her birthday is coming, August 21.');
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({ month: 7, day: 21, year: undefined });
  });
});

describe('nextUpcoming', () => {
  it('picks the soonest upcoming occurrence', () => {
    const now = new Date(2026, 6, 1); // July 1, 2026
    const up = nextUpcoming(
      [
        { id: '1', label: 'Their birthday', month: 4, day: 3 }, // May 3 → next year
        { id: '2', label: 'Anniversary', month: 7, day: 21 }, // Aug 21 → soon
      ],
      now,
    );
    expect(up?.label).toBe('Anniversary');
    expect(up?.daysAway).toBe(51);
  });

  it('returns null when there are no dates', () => {
    expect(nextUpcoming([], new Date())).toBeNull();
  });
});

describe('hardDatesStore.captureFromText', () => {
  beforeEach(() => resetHardDates());

  it('adds parsed dates and de-duplicates by month/day', () => {
    useHardDatesStore.getState().captureFromText('Born May 3, 2017. Died February 9, 2026.');
    expect(useHardDatesStore.getState().dates).toHaveLength(2);
    // Re-capturing the same dates does not duplicate them.
    useHardDatesStore.getState().captureFromText('We remember May 3 every year.');
    expect(useHardDatesStore.getState().dates).toHaveLength(2);
  });
});
