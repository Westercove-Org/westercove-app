import type { EntryType } from './entryTypes';

export interface JournalEntry {
  id: string;
  type: EntryType | string;
  headline: string;
  date: Date;
  /** Optional free-form category tag (Grief, Emotions, …) for Journal filters. */
  category?: string;
}

function daysAgo(days: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** The four sample entries from the high-fidelity screens. */
export const MOCK_ENTRIES: JournalEntry[] = [
  {
    id: 'e1',
    type: 'Memory',
    headline: 'The lake house, and the way he laughed',
    date: daysAgo(2, 21, 12),
  },
  {
    id: 'e2',
    type: 'Struggle',
    headline: 'A hard morning, missing the ordinary',
    date: daysAgo(3, 7, 40),
  },
  {
    id: 'e3',
    type: 'Letter',
    headline: 'Things I did not say out loud',
    date: daysAgo(4, 20, 15),
  },
  {
    id: 'e4',
    type: 'Anniversary',
    headline: 'The 17th is close',
    date: daysAgo(5, 18, 2),
  },
];
