import { apiClient } from '@/lib/http';

/** Enrichment lifecycle for a user's book (QuietRoom `EnrichmentStatus`). */
export type EnrichmentStatus = 'pending' | 'researching' | 'needs_review' | 'approved' | 'failed';

/** The companion-written enrichment for a book (`EnrichmentSummary`). */
export interface BookEnrichment {
  id: number;
  status: EnrichmentStatus;
  confidence: 'high' | 'low';
  summary?: string;
  themes: string[];
}

/** A book on a profile's shelf, as the backend stores it (`UserBookResponse`). */
export interface UserBook {
  id: number;
  profileId: number;
  title: string;
  authors: string[];
  source: 'survey' | 'manual' | 'curated' | 'photo';
  coverUrl?: string;
  enrichment?: BookEnrichment;
  /** Local catalog id (constants/books.ts) for a curated add — the shared key
   * that reconciles a persisted shelf to the server. Null on manual/survey/photo
   * adds and on all legacy rows (no server-side backfill; devices hold the slug). */
  slug: string | null;
}

export interface AddBookInput {
  profileId: number;
  title: string;
  authors?: string[];
  source?: UserBook['source'];
}

export interface LibraryService {
  /** Persist a book on the profile's shelf; returns it with its backend id. */
  addBook(input: AddBookInput): Promise<UserBook>;
  /** Persist a curated catalog book by its local slug. The server resolves the
   * catalog row and ignores any title/authors; re-adding the same slug for the
   * same profile is idempotent (returns the existing row). Throws on an unknown
   * slug (404). */
  addCuratedBook(profileId: number, slug: string): Promise<UserBook>;
  /** The profile's shelf, with any inline enrichment. */
  listBooks(profileId: number): Promise<UserBook[]>;
  /** The enrichment for one book (drives the summary + "still researching"). */
  getBookSummary(bookId: number): Promise<BookEnrichment>;
  removeBook(bookId: number): Promise<void>;
}

type RawEnrichment = {
  id: number;
  status: EnrichmentStatus;
  confidence?: 'high' | 'low';
  summary?: string | null;
  themes?: string[];
};

function toEnrichment(e: RawEnrichment): BookEnrichment {
  return {
    id: e.id,
    status: e.status,
    confidence: e.confidence ?? 'low',
    summary: e.summary ?? undefined,
    themes: e.themes ?? [],
  };
}

function toBook(b: {
  id: number;
  profile_id: number;
  title: string;
  authors?: string[];
  source: UserBook['source'];
  cover_url?: string | null;
  enrichment?: RawEnrichment | null;
  slug?: string | null;
}): UserBook {
  return {
    id: b.id,
    profileId: b.profile_id,
    title: b.title,
    authors: b.authors ?? [],
    source: b.source,
    coverUrl: b.cover_url ?? undefined,
    enrichment: b.enrichment ? toEnrichment(b.enrichment) : undefined,
    slug: b.slug ?? null,
  };
}

/** Real library shelf over the shared `apiClient` (QuietRoom `/library/books`). */
export class ApiLibraryService implements LibraryService {
  async addBook(input: AddBookInput): Promise<UserBook> {
    return toBook(
      await apiClient.post('/library/books', {
        profile_id: input.profileId,
        title: input.title,
        authors: input.authors ?? [],
        source: input.source ?? 'manual',
      }),
    );
  }

  async addCuratedBook(profileId: number, slug: string): Promise<UserBook> {
    // Server resolves the catalog row from the slug and stamps source='curated';
    // any title/authors would be ignored, so we send none.
    return toBook(await apiClient.post('/library/books', { profile_id: profileId, slug }));
  }

  async listBooks(profileId: number): Promise<UserBook[]> {
    const res = await apiClient.get<Parameters<typeof toBook>[0][]>(
      `/library/books?profile_id=${profileId}`,
    );
    return res.map(toBook);
  }

  async getBookSummary(bookId: number): Promise<BookEnrichment> {
    return toEnrichment(await apiClient.get<RawEnrichment>(`/library/books/${bookId}/summary`));
  }

  async removeBook(bookId: number): Promise<void> {
    await apiClient.delete(`/library/books/${bookId}`);
  }
}
