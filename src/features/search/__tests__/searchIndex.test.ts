jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { search } from '@/features/search/searchIndex';

describe('search index', () => {
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
