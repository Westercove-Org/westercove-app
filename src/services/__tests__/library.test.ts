const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/lib/http', () => ({
  apiClient: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
    delete: (...a: unknown[]) => mockDelete(...a),
  },
}));

import { ApiLibraryService } from '@/services/library';

describe('ApiLibraryService', () => {
  const svc = new ApiLibraryService();
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockDelete.mockReset();
  });

  it('adds a book (snake_case body) and maps the response + enrichment', async () => {
    mockPost.mockResolvedValue({
      id: 5,
      profile_id: 3,
      title: 'A Book',
      authors: ['An Author'],
      source: 'manual',
      enrichment: { id: 9, status: 'researching', confidence: 'low', summary: null, themes: [] },
    });

    const book = await svc.addBook({ profileId: 3, title: 'A Book', authors: ['An Author'] });

    expect(mockPost).toHaveBeenCalledWith('/library/books', {
      profile_id: 3,
      title: 'A Book',
      authors: ['An Author'],
      source: 'manual',
    });
    expect(book.id).toBe(5);
    expect(book.enrichment).toEqual({ id: 9, status: 'researching', confidence: 'low', summary: undefined, themes: [] });
  });

  it('adds a curated book by slug (no title/authors) and maps the returned slug', async () => {
    mockPost.mockResolvedValue({
      id: 42,
      profile_id: 3,
      title: 'The Loss of a Pet',
      authors: [],
      source: 'curated',
      slug: 'loss-of-a-pet',
    });

    const book = await svc.addCuratedBook(3, 'loss-of-a-pet');

    expect(mockPost).toHaveBeenCalledWith('/library/books', { profile_id: 3, slug: 'loss-of-a-pet' });
    expect(book).toMatchObject({ id: 42, source: 'curated', slug: 'loss-of-a-pet' });
  });

  it('maps a null slug on non-curated / legacy rows', async () => {
    mockGet.mockResolvedValue([{ id: 1, profile_id: 3, title: 'B', source: 'manual' }]);
    const [book] = await svc.listBooks(3);
    expect(book.slug).toBeNull();
  });

  it('lists a profile\'s books via query param', async () => {
    mockGet.mockResolvedValue([{ id: 1, profile_id: 3, title: 'B', source: 'manual' }]);
    const books = await svc.listBooks(3);

    expect(mockGet).toHaveBeenCalledWith('/library/books?profile_id=3');
    expect(books[0]).toMatchObject({ id: 1, profileId: 3, authors: [] });
  });

  it('reads one book\'s enrichment', async () => {
    mockGet.mockResolvedValue({ id: 9, status: 'approved', confidence: 'high', summary: 'done', themes: ['x'] });
    const e = await svc.getBookSummary(5);

    expect(mockGet).toHaveBeenCalledWith('/library/books/5/summary');
    expect(e).toEqual({ id: 9, status: 'approved', confidence: 'high', summary: 'done', themes: ['x'] });
  });

  it('removes a book', async () => {
    mockDelete.mockResolvedValue(undefined);
    await svc.removeBook(5);
    expect(mockDelete).toHaveBeenCalledWith('/library/books/5');
  });
});
