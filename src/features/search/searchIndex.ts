import { useEntriesStore } from '@/features/journal/entriesStore';
import { MOCK_BOOKS } from '@/features/discover/mockBooks';
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
    for (const b of MOCK_BOOKS) {
      if (`${b.title} ${b.author}`.toLowerCase().includes(q)) {
        results.push({ id: b.id, kind: 'book', title: b.title, subtitle: b.author });
      }
    }
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
