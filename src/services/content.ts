import { apiClient, HttpError } from '@/lib/http';

/** Organizations for a given loss type (Support → org detail). */
export interface Organization {
  id: string;
  name: string;
  description: string;
  /** Where tapping the card takes the user — a `mailto:` for a contact card, or
   * an `https:` org site once a real directory is wired. */
  url: string;
}

/** Result of a book-summary request. `summary` is null when none could be
 * written; `rateLimited` is true when the backend throttled the request
 * (HTTP 429) — the caller shows a soft "try again shortly" and does NOT retry. */
export interface BookSummaryResult {
  summary: string | null;
  rateLimited: boolean;
}

export interface ContentService {
  /** Write a short summary for a book the user added themselves (title + author). */
  generateBookSummary(title: string, author: string): Promise<BookSummaryResult>;
  /** Organizations grouped by loss type. */
  organizationsFor(lossType: string): Promise<Organization[]>;
}

/** Mock content service — a templated summary and generated org lists, with a
 * small delay to exercise the loading state. Stands in whenever the API route
 * is unreachable or has no key. */
export class MockContentService implements ContentService {
  async generateBookSummary(title: string, author: string): Promise<BookSummaryResult> {
    await new Promise((r) => setTimeout(r, 700));
    const by = author ? ` by ${author}` : '';
    return {
      summary: `${title}${by} — added to your library. Your companion will draw on this book in your conversations, and a short summary will appear in your downloaded journal.`,
      rateLimited: false,
    };
  }

  // ponytail: one real support contact for now (human decision, tk-815b), not a
  // per-loss org directory. lossType is ignored until a real directory is wired.
  async organizationsFor(_lossType: string): Promise<Organization[]> {
    return [
      {
        id: 'westercove-support',
        name: 'Westercove Support',
        description: 'Reach our team any time at support@westercove.com.',
        url: 'mailto:support@westercove.com',
      },
    ];
  }
}

/**
 * Real book summaries via QuietRoom `POST /library/books/generate-summary`.
 * This endpoint is rate limited: a 429 returns `rateLimited` so the UI can show
 * a soft "try again shortly" — we never retry (no retry-storm) and never
 * fabricate a summary in its place. Other failures fall back to the mock, the
 * same contract `ApiCompanionService` follows: adding a book must never fail in
 * the user's face.
 */
export class ApiContentService implements ContentService {
  private readonly fallback = new MockContentService();

  async generateBookSummary(title: string, author: string): Promise<BookSummaryResult> {
    try {
      const res = await apiClient.post<{ summary?: string; themes?: string[] }>(
        '/library/books/generate-summary',
        { title, authors: author.trim() ? [author.trim()] : [] },
      );
      const summary = res.summary?.trim();
      return summary ? { summary, rateLimited: false } : this.fallback.generateBookSummary(title, author);
    } catch (err) {
      // Throttled: surface it, do not retry and do not fabricate a summary.
      if (err instanceof HttpError && err.status === 429) {
        return { summary: null, rateLimited: true };
      }
      // 404 (no summary) / 502 / network: fall back to the gentle templated line.
      return this.fallback.generateBookSummary(title, author);
    }
  }

  organizationsFor(lossType: string): Promise<Organization[]> {
    return this.fallback.organizationsFor(lossType);
  }
}
