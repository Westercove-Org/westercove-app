import { useLibraryStore } from '@/features/discover/libraryStore';

const reset = () => useLibraryStore.setState({ myLibrary: [] });

describe('libraryStore', () => {
  beforeEach(reset);

  it('seeds the 22-book recommended catalog', () => {
    expect(useLibraryStore.getState().recommended).toHaveLength(22);
  });

  it('adds a recommended book once', () => {
    const { addToLibrary } = useLibraryStore.getState();
    addToLibrary('rec-0');
    addToLibrary('rec-0');
    const lib = useLibraryStore.getState().myLibrary;
    expect(lib).toHaveLength(1);
    expect(lib[0].id).toBe('rec-0');
  });

  it('addAll copies every recommended book without duplicating', () => {
    const { addToLibrary, addAll } = useLibraryStore.getState();
    addToLibrary('rec-3');
    addAll();
    expect(useLibraryStore.getState().myLibrary).toHaveLength(22);
  });

  it('addOwnBook writes a companion summary and labels it own', async () => {
    await useLibraryStore.getState().addOwnBook('My Book', 'Me');
    const [book] = useLibraryStore.getState().myLibrary;
    expect(book.source).toBe('own');
    expect(book.summary).toContain('My Book');
  });
});
