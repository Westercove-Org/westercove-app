import { MOCK_BOOKS, spine, type Book } from '@/features/discover/mockBooks';

import { apiFetch } from './http';

/** Organizations for a given loss type (Support → org detail). */
export interface Organization {
  id: string;
  name: string;
  description: string;
}

export interface ContentService {
  /** The Discover book catalog. */
  listCatalog(): Promise<Book[]>;
  /** Fetch a book's summary so responses can meet the user inside its framework. */
  fetchBookSummary(bookId: string): Promise<string>;
  /** Organizations grouped by loss type. */
  organizationsFor(lossType: string): Promise<Organization[]>;
}

const GENERIC_SUMMARY =
  'A gentle, grounded companion for this kind of loss, written with warmth for anyone looking for words when their own are hard to find.';

const SUMMARIES: Record<string, string> = {
  b1: 'A companion through traumatic grief that refuses easy comfort, honoring the enormity of loss while making room to keep living alongside it.',
  b2: 'On grief as a natural, even necessary, part of a whole life — and on tending sorrow in community rather than alone.',
  b3: 'The idea that we do not "let go" but carry our people forward, keeping a continuing bond that changes shape over time.',
};

/** Mock content service — canned summaries and org lists with a small delay to
 * exercise the loading state. Real impl fetches from the backend / catalog. */
export class MockContentService implements ContentService {
  async listCatalog(): Promise<Book[]> {
    return MOCK_BOOKS;
  }

  async fetchBookSummary(bookId: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 700));
    return SUMMARIES[bookId] ?? GENERIC_SUMMARY;
  }

  async organizationsFor(lossType: string): Promise<Organization[]> {
    await new Promise((r) => setTimeout(r, 300));
    return [
      {
        id: `${lossType}-1`,
        name: `${lossType} loss support network`,
        description: 'Peer support, resources, and a warm line for this kind of loss.',
      },
      {
        id: `${lossType}-2`,
        name: `Grief resources for ${lossType.toLowerCase()} loss`,
        description: 'Reading, groups, and organizations by region.',
      },
    ];
  }
}

/** One curated-catalog entry as returned by GET /library/curated. */
interface CuratedBookHit {
  id: number;
  title: string;
  authors: string[];
  summary: string | null;
}

/**
 * Real content service against the QuietRoom backend.
 * - listCatalog / fetchBookSummary → GET /library/curated (the Discover catalog
 *   is the backend's curated books; summaries resolve by real id).
 * - organizationsFor → GET /resources/organizations (empty until admin-seeded).
 */
export class ApiContentService implements ContentService {
  private catalog?: Promise<CuratedBookHit[]>;

  private curated(): Promise<CuratedBookHit[]> {
    // Cache the fetch: listCatalog + fetchBookSummary share one round trip.
    return (this.catalog ??= apiFetch<CuratedBookHit[]>('/library/curated'));
  }

  async listCatalog(): Promise<Book[]> {
    const curated = await this.curated();
    return curated.map((b, i) => ({
      id: String(b.id),
      title: b.title,
      author: b.authors.join(', ') || 'Unknown',
      spine: spine(i),
    }));
  }

  async fetchBookSummary(bookId: string): Promise<string> {
    const curated = await this.curated();
    const hit = curated.find((b) => String(b.id) === bookId);
    return hit?.summary ?? GENERIC_SUMMARY;
  }

  async organizationsFor(lossType: string): Promise<Organization[]> {
    return apiFetch<Organization[]>(
      `/resources/organizations?loss_type=${encodeURIComponent(lossType)}`,
    );
  }
}
