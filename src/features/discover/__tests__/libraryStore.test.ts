import { booksForModule } from '@/constants/books';
import {
  libraryForCompanion,
  recommendedFor,
  useLibraryStore,
} from '@/features/discover/libraryStore';
import { useSessionStore } from '@/features/auth/sessionStore';
import { services } from '@/services';

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

describe('libraryStore server shelf', () => {
  beforeEach(() => {
    reset();
    useSessionStore.setState({
      session: {
        user: { email: 'a@b.co' },
        entryPath: 'consumer_trial',
        entitlement: 'trial_active',
        disclaimerAcked: true,
        gateComplete: true,
        gateAnswers: { mode: 'human', skipped: [] },
        backendProfileId: 3,
      },
    });
  });
  afterEach(() => {
    jest.restoreAllMocks();
    useSessionStore.setState({ session: null });
  });

  it('addOwnBook persists to the server shelf and keeps the backend id + status', async () => {
    const addBook = jest.spyOn(services.library, 'addBook').mockResolvedValue({
      id: 5,
      profileId: 3,
      title: 'My Book',
      authors: ['Me'],
      source: 'manual',
      enrichment: { id: 9, status: 'researching', confidence: 'low', themes: [] },
    });

    await useLibraryStore.getState().addOwnBook('My Book', 'Me');

    expect(addBook).toHaveBeenCalledWith({ profileId: 3, title: 'My Book', authors: ['Me'] });
    const [book] = useLibraryStore.getState().myLibrary;
    expect(book.backendId).toBe(5);
    expect(book.enrichmentStatus).toBe('researching');
    expect(book.summary).toBeUndefined(); // still researching → no summary yet
  });

  it('refreshBookSummary pulls the enrichment and returns its status', async () => {
    useLibraryStore.setState({
      myLibrary: [{ id: 'own-1', title: 'B', author: 'Me', source: 'own', spine: '#000', backendId: 5 }],
    });
    jest.spyOn(services.library, 'getBookSummary').mockResolvedValue({
      id: 9,
      status: 'approved',
      confidence: 'high',
      summary: 'A gentle summary',
      themes: [],
    });

    const status = await useLibraryStore.getState().refreshBookSummary('own-1');

    expect(status).toBe('approved');
    expect(useLibraryStore.getState().myLibrary[0].summary).toBe('A gentle summary');
  });

  it('syncServerBooks merges enrichment onto matching own-books by backend id', async () => {
    useLibraryStore.setState({
      myLibrary: [{ id: 'own-1', title: 'B', author: 'Me', source: 'own', spine: '#000', backendId: 5 }],
    });
    jest.spyOn(services.library, 'listBooks').mockResolvedValue([
      { id: 5, profileId: 3, title: 'B', authors: ['Me'], source: 'manual', enrichment: { id: 9, status: 'approved', confidence: 'high', summary: 'Done', themes: [] } },
    ]);

    await useLibraryStore.getState().syncServerBooks();

    expect(useLibraryStore.getState().myLibrary[0].summary).toBe('Done');
    expect(useLibraryStore.getState().myLibrary[0].enrichmentStatus).toBe('approved');
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
