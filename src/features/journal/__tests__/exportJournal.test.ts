import { userEntries } from '@/features/journal/exportSelection';
import type { Entry } from '@/features/journal/types';

function entry(over: Partial<Entry> & { id: string; createdAt: string }): Entry {
  return {
    type: 'Journal',
    headline: 'h',
    turns: [],
    safetyLevel: 1,
    ...over,
  } as Entry;
}

describe('userEntries (journal export)', () => {
  it('keeps only the author’s own words, oldest first', () => {
    const out = userEntries(
      [
        entry({
          id: 'b',
          createdAt: '2026-02-01T00:00:00.000Z',
          turns: [
            { id: '1', role: 'user', text: 'Second day.', at: '2026-02-01T00:00:00.000Z' },
            { id: '2', role: 'companion', text: 'Companion reply.', at: '2026-02-01T00:00:00.000Z' },
          ],
        }),
        entry({
          id: 'a',
          createdAt: '2026-01-01T00:00:00.000Z',
          turns: [
            { id: '3', role: 'user', text: 'First day.', at: '2026-01-01T00:00:00.000Z' },
          ],
        }),
      ],
    );

    expect(out.map((e) => e.text)).toEqual(['First day.', 'Second day.']);
    expect(JSON.stringify(out)).not.toContain('Companion reply.');
  });

  it('drops entries with no user text at all', () => {
    const out = userEntries(
      [
        entry({
          id: 'a',
          createdAt: '2026-01-01T00:00:00.000Z',
          turns: [
            { id: '1', role: 'companion', text: 'Only me.', at: '2026-01-01T00:00:00.000Z' },
          ],
        }),
      ],
    );
    expect(out).toEqual([]);
  });
});
