import { gatherGratitude, GRATITUDE_LINE_PREFIX } from '@/features/profile/gatherGratitude';
import type { Entry } from '@/features/journal/types';
import type { LearnedItem } from '@/features/profile/whatIKnowStore';

function entry(type: string, userText: string): Entry {
  return {
    id: `e${Math.random()}`,
    type,
    headline: 'h',
    createdAt: new Date().toISOString(),
    turns: [
      { id: 'u', role: 'user', text: userText, at: new Date().toISOString() },
      { id: 'c', role: 'companion', text: 'reply', at: new Date().toISOString() },
    ],
    safetyLevel: 0,
  } as Entry;
}

function learned(value: string): LearnedItem {
  return { id: `l${Math.random()}`, label: 'x', value } as LearnedItem;
}

describe('gatherGratitude (v16 derived, not stored)', () => {
  it('gathers Gratitude entries and prefixed What-I-Know lines, entries first', () => {
    const entries = [entry('Gratitude', 'an hour of sleep'), entry('Memory', 'not this one')];
    const items = [
      learned(`${GRATITUDE_LINE_PREFIX}the lake at dawn`),
      learned('A place that matters: the lake house'),
    ];
    expect(gatherGratitude(entries, items)).toEqual(['an hour of sleep', 'the lake at dawn']);
  });

  it('only matches the exact prefix and drops blank items', () => {
    const items = [
      learned(`${GRATITUDE_LINE_PREFIX}   `), // blank after prefix → dropped
      learned('Something I am grateful: no trailing space → no match'),
      learned(`${GRATITUDE_LINE_PREFIX}a song`),
    ];
    expect(gatherGratitude([], items)).toEqual(['a song']);
  });

  it('is empty when there is nothing to gather (a fair place to be)', () => {
    expect(gatherGratitude([entry('Journal', 'today')], [])).toEqual([]);
  });
});
