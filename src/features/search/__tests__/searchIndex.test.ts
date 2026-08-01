jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { defaultSeedEntries, useEntriesStore } from '@/features/journal/entriesStore';
import { search } from '@/features/search/searchIndex';

describe('search index', () => {
  // Entries are per-account and empty until someone signs in; put a signed-in
  // user's journal in place so the global scope has entries to match.
  beforeAll(() => {
    useEntriesStore.getState().setActiveUser('search-test-user', defaultSeedEntries());
  });

  it('returns nothing for an empty query', () => {
    expect(search('', 'global')).toEqual([]);
  });

  it('finds a book in the discover scope', () => {
    const r = search('sorrow', 'discover');
    expect(r.some((x) => x.kind === 'book')).toBe(true);
  });

  it('finds an org and reading in the support scope', () => {
    expect(search('pet', 'support').some((x) => x.kind === 'org')).toBe(true);
    expect(search('glossary', 'support').some((x) => x.kind === 'reading')).toBe(true);
  });

  it('global scope searches entries too', () => {
    const r = search('lake house', 'global');
    expect(r.some((x) => x.kind === 'entry')).toBe(true);
  });

  it('support scope does not return books', () => {
    expect(search('sorrow', 'support').some((x) => x.kind === 'book')).toBe(false);
  });
});
