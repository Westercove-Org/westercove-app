/** Organizations for a given loss type (Support → org detail). */
export interface Organization {
  id: string;
  name: string;
  description: string;
}

export interface ContentService {
  /** Write a short summary for a book the user added themselves (title + author). */
  generateBookSummary(title: string, author: string): Promise<string>;
  /** Organizations grouped by loss type. */
  organizationsFor(lossType: string): Promise<Organization[]>;
}

/** Mock content service — a templated summary and generated org lists, with a
 * small delay to exercise the loading state. Stands in whenever the API route
 * is unreachable or has no key. */
export class MockContentService implements ContentService {
  async generateBookSummary(title: string, author: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 700));
    const by = author ? ` by ${author}` : '';
    return `${title}${by} — added to your library. Your companion will draw on this book in your conversations, and a short summary will appear in your downloaded journal.`;
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

/**
 * Real book summaries, written by the companion via `/api/booksummary`.
 * Falls back to the mock whenever the route is unreachable or unconfigured,
 * the same contract `ApiCompanionService` follows: adding a book must never
 * fail in the user's face.
 */
export class ApiContentService implements ContentService {
  private readonly fallback = new MockContentService();

  async generateBookSummary(title: string, author: string): Promise<string> {
    try {
      const res = await fetch('/api/booksummary', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, author }),
      });
      if (!res.ok) return this.fallback.generateBookSummary(title, author);
      const data = (await res.json()) as { summary?: string };
      const summary = data.summary?.trim();
      return summary || this.fallback.generateBookSummary(title, author);
    } catch {
      return this.fallback.generateBookSummary(title, author);
    }
  }

  organizationsFor(lossType: string): Promise<Organization[]> {
    return this.fallback.organizationsFor(lossType);
  }
}
