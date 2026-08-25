import { useEntriesStore } from '@/features/journal/entriesStore';
import { useLibraryStore } from '@/features/discover/libraryStore';
import { BOOKS } from '@/constants/books';
import { LOSS_TYPES, READING } from '@/constants/copy';

export type SearchScope = 'global' | 'discover' | 'support';

export interface SearchResult {
  id: string;
  kind: 'entry' | 'book' | 'reading' | 'org';
  title: string;
  subtitle?: string;
}

/** Build the searchable index for a scope from entries + static content. A thin
 * mock; the real search runs server-side over the same shapes. */
export function search(query: string, scope: SearchScope): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];

  if (scope === 'global') {
    for (const e of useEntriesStore.getState().entries) {
      const hay = `${e.headline} ${e.turns.map((t) => t.text).join(' ')}`.toLowerCase();
      if (hay.includes(q)) {
        results.push({ id: e.id, kind: 'entry', title: e.headline, subtitle: e.type });
      }
    }
  }

  if (scope === 'global' || scope === 'discover') {
    // Search the static catalog AND the user's own library shelf, so a book the
    // user added themselves surfaces too. Dedup by id: a curated book that is
    // also shelved appears in both lists but should match once.
    const seen = new Set<string>();
    const consider = (b: { id: string; title: string; author: string; summary?: string }) => {
      if (seen.has(b.id)) return;
      // Search the summary too: it is the book's most visible text on the
      // Discover card, so a term the reader can plainly see there must match.
      if (`${b.title} ${b.author} ${b.summary ?? ''}`.toLowerCase().includes(q)) {
        seen.add(b.id);
        results.push({ id: b.id, kind: 'book', title: b.title, subtitle: b.author });
      }
    };
    for (const b of BOOKS) consider(b);
    for (const b of useLibraryStore.getState().myLibrary) consider(b);
  }

  if (scope === 'global' || scope === 'support') {
    for (const r of READING) {
      if (r.title.toLowerCase().includes(q)) {
        results.push({ id: r.title, kind: 'reading', title: r.title });
      }
    }
    for (const loss of LOSS_TYPES) {
      if (loss.toLowerCase().includes(q)) {
        results.push({ id: loss, kind: 'org', title: `${loss} loss`, subtitle: 'Organizations' });
      }
    }
  }

  return results;
}
