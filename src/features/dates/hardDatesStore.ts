import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '@/lib/secureStorage';
import { DATES_BASE, profileKey } from '@/features/profiles/profileKeys';

export interface HardDate {
  id: string;
  label: string;
  /** 0-11 */
  month: number;
  /** 1-31 */
  day: number;
  /** Optional year the date first occurred (for context, not for recurrence). */
  year?: number;
}

export interface UpcomingDate {
  label: string;
  /** The next occurrence, as a Date. */
  when: Date;
  daysAway: number;
}

interface HardDatesState {
  dates: HardDate[];
  add: (d: Omit<HardDate, 'id'>) => void;
  remove: (id: string) => void;
  /** Parse dates out of free text (e.g. the meaningful-dates answer) and add them. */
  captureFromText: (text: string) => void;
}

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/** Choose a human label from keywords near the matched date. */
function labelFor(context: string): string {
  const c = context.toLowerCase();
  if (/born|birth|birthday/.test(c)) return 'Their birthday';
  if (/died|death|passed|anniversary/.test(c)) return 'Anniversary of their death';
  if (/wed|married|marriage/.test(c)) return 'Anniversary';
  if (/school/.test(c)) return 'First day of school';
  return 'A meaningful date';
}

/** Extract "May 3, 2017" / "August 21" style dates with a nearby label. */
export function parseDates(text: string): Omit<HardDate, 'id'>[] {
  const re = new RegExp(`\\b(${MONTHS.join('|')})\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?`, 'gi');
  const out: Omit<HardDate, 'id'>[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const month = MONTHS.indexOf(m[1].toLowerCase());
    const day = parseInt(m[2], 10);
    if (month < 0 || day < 1 || day > 31) continue;
    const year = m[3] ? parseInt(m[3], 10) : undefined;
    // Look only within the current clause (since the last sentence break) so a
    // keyword from a previous clause does not mislabel this date.
    const before = text.slice(0, m.index);
    const clauseStart = Math.max(
      before.lastIndexOf('.'),
      before.lastIndexOf(';'),
      before.lastIndexOf('\n'),
    );
    const context = before.slice(clauseStart + 1);
    out.push({ label: labelFor(context), month, day, year });
  }
  return out;
}

/** The next upcoming occurrence across all hard dates, or null if none. */
export function nextUpcoming(dates: HardDate[], now = new Date()): UpcomingDate | null {
  let best: UpcomingDate | null = null;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (const d of dates) {
    let when = new Date(now.getFullYear(), d.month, d.day);
    if (when < startOfToday) when = new Date(now.getFullYear() + 1, d.month, d.day);
    const daysAway = Math.round((when.getTime() - startOfToday.getTime()) / 86400000);
    if (!best || when < best.when) best = { label: d.label, when, daysAway };
  }
  return best;
}

let seq = 0;
const nextId = () => `hd_${Date.now().toString(36)}_${seq++}`;

export const useHardDatesStore = create<HardDatesState>()(
  persist(
    (set, get) => ({
      dates: [],

      add(d) {
        set((s) => ({ dates: [...s.dates, { ...d, id: nextId() }] }));
      },

      remove(id) {
        set((s) => ({ dates: s.dates.filter((x) => x.id !== id) }));
      },

      captureFromText(text) {
        const parsed = parseDates(text);
        if (parsed.length === 0) return;
        const existing = get().dates;
        const additions = parsed
          .filter((p) => !existing.some((e) => e.month === p.month && e.day === p.day))
          .map((p) => ({ ...p, id: nextId() }));
        if (additions.length) set({ dates: [...existing, ...additions] });
      },
    }),
    {
      name: profileKey(DATES_BASE, 'unbound'),
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ dates: s.dates }),
      skipHydration: true,
    },
  ),
);

/** Reset hard dates to empty (used when switching/creating profiles). */
export function resetHardDates() {
  useHardDatesStore.setState({ dates: [] });
}
