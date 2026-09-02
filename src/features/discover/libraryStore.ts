import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  BOOKS,
  booksForModule,
  type Book,
  type BookModule,
} from '@/constants/books';
import { scopedStorage } from '@/features/profile/activeProfile';
import { useSessionStore } from '@/features/auth/sessionStore';
import { services } from '@/services';
import type { EnrichmentStatus } from '@/services/library';

export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  /** Curated Westercove title vs. a book the user added themselves. */
  source: 'westercove' | 'own';
  /** Cover/spine block color. */
  spine: string;
  /** Present for own books (companion-written); fetched on demand otherwise. */
  summary?: string;
  /** Which loss path a curated book belongs to. Absent on the user's own books. */
  module?: BookModule;
  /** Cover accent from the catalog. */
  accent?: string;
  /** Own-book reading state, e.g. "In progress". */
  status?: string;
  /** Who is reading it, for shared accounts. */
  reader?: string;
  /** Backend `UserBook.id`, once the book is persisted on the profile's shelf.
   * Present → summary/enrichment can be read from the server. */
  backendId?: number;
  /** Latest backend enrichment status, for the inline "still researching" hint. */
  enrichmentStatus?: EnrichmentStatus;
}

/** Rotating cover colors from the grief palette. */
const SPINES = ['#2F6B33', '#3D2F5E', '#1F4D22', '#26114E', '#0E5F18'];
const spineFor = (i: number) => SPINES[i % SPINES.length];

function backendProfileId(): number | undefined {
  return useSessionStore.getState().session?.backendProfileId;
}

/** A catalog book as the library stores it. */
export function fromCatalog(b: Book): LibraryBook {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    source: 'westercove',
    spine: b.cover,
    accent: b.accent,
    summary: b.summary,
    module: b.module,
  };
}

/** The curated shelf for a loss path. Pet grievers never see the human shelf. */
export function recommendedFor(module: BookModule): LibraryBook[] {
  return booksForModule(module).map(fromCatalog);
}

interface LibraryState {
  /** Books the user has added to their own library, curated or their own. */
  myLibrary: LibraryBook[];
  /** Add a catalog book by id. */
  addToLibrary: (id: string) => void;
  /** Add every curated book for a loss path that is not already in the library. */
  addAll: (module: BookModule) => void;
  addOwnBook: (title: string, author: string) => Promise<void>;
  /** Drop a book from the library, curated or own. */
  removeFromLibrary: (id: string) => void;
  /** Fill in a summary once the companion has written one. */
  setSummary: (id: string, summary: string) => void;
  /** Pull the profile's server shelf and merge enrichment (summary + status)
   * onto matching own-books. No-op without a backend profile id. */
  syncServerBooks: () => Promise<void>;
  /** Refresh one book's enrichment from the server; returns its status so the
   * caller can decide whether to poll again ("still researching"). */
  refreshBookSummary: (id: string) => Promise<EnrichmentStatus | null>;
  inLibrary: (id: string) => boolean;
  /** Reset the user's library for a new test profile. */
  resetForProfile: () => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => {
      // Best-effort: persist a curated catalog book to the profile's server shelf
      // by slug (== the local catalog id) and attach its backend id, so removal
      // drops the server row and a later sync can match. The instant local add has
      // already succeeded; a 404 (stale slug) or offline is swallowed. Add-by-slug
      // is idempotent server-side, so a repeat can't duplicate — no client dedup.
      const persistCurated = (slug: string) => {
        const profileId = backendProfileId();
        if (profileId == null) return;
        void services.library
          .addCuratedBook(profileId, slug)
          .then((ub) =>
            set((s) => ({
              myLibrary: s.myLibrary.map((b) => (b.id === slug ? { ...b, backendId: ub.id } : b)),
            })),
          )
          .catch(() => {});
      };

      return {
        myLibrary: [],

        inLibrary(id) {
          return get().myLibrary.some((b) => b.id === id);
        },

        addToLibrary(id) {
          const book = BOOKS.find((b) => b.id === id);
          if (!book || get().inLibrary(id)) return;
          set((s) => ({ myLibrary: [...s.myLibrary, fromCatalog(book)] }));
          persistCurated(id);
        },

        addAll(module) {
          const have = new Set(get().myLibrary.map((b) => b.id));
          const added = recommendedFor(module).filter((b) => !have.has(b.id));
          if (!added.length) return;
          set((s) => ({ myLibrary: [...s.myLibrary, ...added] }));
          for (const b of added) persistCurated(b.id);
        },

        async addOwnBook(title, author) {
          const t = title.trim();
          const a = author.trim();
          if (!t) return;
          const id = `own-${Date.now()}`;
          // Shelve it first so the book appears while the summary is being written.
          set((s) => ({
            myLibrary: [
              ...s.myLibrary,
              { id, title: t, author: a, source: 'own', spine: spineFor(s.myLibrary.length) },
            ],
          }));
          // Persist to the profile's server shelf when we have a backend profile
          // id, and keep its backend id + enrichment status so the summary can be
          // read/polled later. Best-effort: shelving locally already succeeded.
          const profileId = backendProfileId();
          if (profileId != null) {
            try {
              const book = await services.library.addBook({
                profileId,
                title: t,
                authors: a ? [a] : [],
              });
              set((s) => ({
                myLibrary: s.myLibrary.map((b) =>
                  b.id === id
                    ? { ...b, backendId: book.id, enrichmentStatus: book.enrichment?.status }
                    : b,
                ),
              }));
              if (book.enrichment?.summary) get().setSummary(id, book.enrichment.summary);
              return; // server shelf drives the summary from here (enrichment)
            } catch {
              // fall through to the on-demand companion summary
            }
          }
          // Rate-limited (rateLimited:true) leaves the book un-summarized; opening
          // its detail re-requests, so no retry is needed here.
          const { summary } = await services.content.generateBookSummary(t, a);
          if (summary) get().setSummary(id, summary);
        },

        async syncServerBooks() {
          const profileId = backendProfileId();
          if (profileId == null) return;
          let books;
          try {
            books = await services.library.listBooks(profileId);
          } catch {
            return;
          }
          set((s) => ({
            myLibrary: s.myLibrary.map((b) => {
              // Own books: merge server enrichment (summary + status) by backend id.
              if (b.source === 'own') {
                const match = b.backendId != null ? books.find((x) => x.id === b.backendId) : undefined;
                if (!match) return b;
                return {
                  ...b,
                  enrichmentStatus: match.enrichment?.status ?? b.enrichmentStatus,
                  summary: match.enrichment?.summary ?? b.summary,
                };
              }
              // Curated books added before a profile existed: attach the backend id
              // by slug (== the local catalog id) so removal + later sync can match.
              // Only fills a missing backendId — never clears or rewrites the shelf,
              // and never touches the catalog-owned display (title/summary/cover).
              if (b.backendId == null) {
                const bySlug = books.find((x) => x.slug != null && x.slug === b.id);
                if (bySlug) return { ...b, backendId: bySlug.id };
              }
              return b;
            }),
          }));
        },

        async refreshBookSummary(id) {
          const book = get().myLibrary.find((b) => b.id === id);
          if (!book?.backendId) return null;
          let enrichment;
          try {
            enrichment = await services.library.getBookSummary(book.backendId);
          } catch {
            return null;
          }
          set((s) => ({
            myLibrary: s.myLibrary.map((b) =>
              b.id === id
                ? { ...b, enrichmentStatus: enrichment.status, summary: enrichment.summary ?? b.summary }
                : b,
            ),
          }));
          return enrichment.status;
        },

        removeFromLibrary(id) {
          const book = get().myLibrary.find((b) => b.id === id);
          set((s) => ({ myLibrary: s.myLibrary.filter((b) => b.id !== id) }));
          // Also drop it from the profile's server shelf; fire-and-forget so the
          // local removal is instant and never blocked by the network.
          if (book?.backendId != null) {
            void services.library.removeBook(book.backendId).catch(() => {});
          }
        },

        setSummary(id, summary) {
          set((s) => ({
            myLibrary: s.myLibrary.map((b) => (b.id === id ? { ...b, summary } : b)),
          }));
        },

        resetForProfile() {
          set({ myLibrary: [] });
        },
      };
    },
    {
      name: 'westercove.library',
      storage: createJSONStorage(() => scopedStorage('library')),
      // Recommended catalog is static code; only persist the user's library.
      partialize: (s) => ({ myLibrary: s.myLibrary }),
    },
  ),
);
