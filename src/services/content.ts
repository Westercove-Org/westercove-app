/** Organizations for a given loss type (Support → org detail). */
export interface Organization {
  id: string;
  name: string;
  description: string;
}

export interface ContentService {
  /** Fetch a book's summary so responses can meet the user inside its framework. */
  fetchBookSummary(bookId: string): Promise<string>;
  /** Organizations grouped by loss type. */
  organizationsFor(lossType: string): Promise<Organization[]>;
}

const SUMMARIES: Record<string, string> = {
  b1: 'A companion through traumatic grief that refuses easy comfort, honoring the enormity of loss while making room to keep living alongside it.',
  b2: 'On grief as a natural, even necessary, part of a whole life — and on tending sorrow in community rather than alone.',
  b3: 'The idea that we do not "let go" but carry our people forward, keeping a continuing bond that changes shape over time.',
};

/** Mock content service — canned summaries and org lists with a small delay to
 * exercise the loading state. Real impl fetches from the backend / catalog. */
export class MockContentService implements ContentService {
  async fetchBookSummary(bookId: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 700));
    return (
      SUMMARIES[bookId] ??
      'A gentle, grounded companion for this kind of loss, written with warmth for anyone looking for words when their own are hard to find.'
    );
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
