jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { useLibraryStore } from '@/features/discover/libraryStore';
import { useEntriesStore } from '@/features/journal/entriesStore';
import { search } from '@/features/search/searchIndex';
import { SafetyLevel } from '@/services/safety';

describe('search index', () => {
  afterEach(() => useLibraryStore.setState({ myLibrary: [] }));

  it('returns nothing for an empty query', () => {
    expect(search('', 'global')).toEqual([]);
  });

  it('finds a book in the discover scope', () => {
    const r = search('sorrow', 'discover');
    expect(r.some((x) => x.kind === 'book')).toBe(true);
  });

  it('finds a book the user added to their own library (not in the static catalog)', () => {
    useLibraryStore.setState({
      myLibrary: [
        {
          id: 'own-1',
          title: 'Zephyrwood Nights',
          author: 'Q. Marlowe',
          source: 'own',
          spine: '#2F6B33',
        },
      ],
    });
    const r = search('zephyrwood', 'discover');
    expect(r.some((x) => x.kind === 'book' && x.id === 'own-1')).toBe(true);
  });

  it('does not duplicate a curated book that is also shelved', () => {
    const shelved = search('sorrow', 'discover').find((x) => x.kind === 'book');
    // Re-shelve that exact catalog book into the user's library by the same id.
    if (shelved) {
      useLibraryStore.setState({
        myLibrary: [
          { id: shelved.id, title: shelved.title, author: shelved.subtitle ?? '', source: 'westercove', spine: '#2F6B33' },
        ],
      });
    }
    const ids = search('sorrow', 'discover')
      .filter((x) => x.kind === 'book')
      .map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('matches a term that appears only in a book summary, not its title/author', () => {
    // "veterinarians" is nowhere in any book title or author, only in summary
    // copy — the regression the search bug produced ("Nothing matches yet.").
    const r = search('veterinarians', 'discover');
    expect(r.some((x) => x.kind === 'book')).toBe(true);
  });

  it('finds an org and reading in the support scope', () => {
    expect(search('pet', 'support').some((x) => x.kind === 'org')).toBe(true);
    expect(search('glossary', 'support').some((x) => x.kind === 'reading')).toBe(true);
  });

  it('global scope searches entries too', () => {
    useEntriesStore.setState({
      entries: [
        {
          id: 'x1',
          type: 'Memory',
          headline: 'The lake house',
          createdAt: new Date().toISOString(),
          safetyLevel: SafetyLevel.Normal,
          turns: [],
        },
      ],
    });
    const r = search('lake house', 'global');
    expect(r.some((x) => x.kind === 'entry')).toBe(true);
  });

  it('support scope does not return books', () => {
    expect(search('sorrow', 'support').some((x) => x.kind === 'book')).toBe(false);
  });
});
