import { booksForModule } from '@/constants/books';
import {
  libraryForCompanion,
  recommendedFor,
  useLibraryStore,
} from '@/features/discover/libraryStore';

const reset = () => useLibraryStore.setState({ myLibrary: [] });

describe('libraryStore', () => {
  beforeEach(reset);

  it('recommends only the books for the griever’s loss path', () => {
    expect(recommendedFor('pet')).toHaveLength(10);
    expect(recommendedFor('human')).toHaveLength(22);
    expect(recommendedFor('pet').every((b) => b.module === 'pet')).toBe(true);
  });

  it('adds a catalog book once, with its summary', () => {
    const { addToLibrary } = useLibraryStore.getState();
    addToLibrary('loss-of-a-pet');
    addToLibrary('loss-of-a-pet');
    const lib = useLibraryStore.getState().myLibrary;
    expect(lib).toHaveLength(1);
    expect(lib[0].id).toBe('loss-of-a-pet');
    expect(lib[0].summary).toBeTruthy();
  });

  it('addAll copies one loss path without duplicating', () => {
    const { addToLibrary, addAll } = useLibraryStore.getState();
    addToLibrary('loss-of-a-pet');
    addAll('pet');
    expect(useLibraryStore.getState().myLibrary).toHaveLength(booksForModule('pet').length);
  });

  it('removes a book from the library', () => {
    const { addToLibrary, removeFromLibrary } = useLibraryStore.getState();
    addToLibrary('loss-of-a-pet');
    removeFromLibrary('loss-of-a-pet');
    expect(useLibraryStore.getState().myLibrary).toHaveLength(0);
  });

  it('addOwnBook shelves the book, then fills in a companion summary', async () => {
    await useLibraryStore.getState().addOwnBook('My Book', 'Me');
    const [book] = useLibraryStore.getState().myLibrary;
    expect(book.source).toBe('own');
    expect(book.summary).toContain('My Book');
  });
});

describe('libraryForCompanion', () => {
  it('offers nothing until the person builds a library', () => {
    expect(libraryForCompanion([], 'pet', 'Journal')).toHaveLength(0);
  });

  it('falls back to the loss-path shelf when they are reaching for help', () => {
    const lib = libraryForCompanion([], 'pet', 'Grief Question');
    expect(lib).toHaveLength(10);
    expect(lib[0].guidance.length).toBeGreaterThan(0);
  });

  it('uses the person’s own shelf once they have one', () => {
    const { addToLibrary } = useLibraryStore.getState();
    useLibraryStore.setState({ myLibrary: [] });
    addToLibrary('goodbye-friend');
    const lib = libraryForCompanion(useLibraryStore.getState().myLibrary, 'pet', 'Grief Question');
    expect(lib.map((b) => b.title)).toEqual(['Goodbye, Friend']);
  });
});
