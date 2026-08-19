import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  BOOKS,
  booksForModule,
  guidanceFor,
  GUIDED_ENTRY_TYPES,
  type Book,
  type BookModule,
} from '@/constants/books';
import type { CompanionLibraryBook } from '@/services/companionPrompt';
import { scopedStorage } from '@/features/profile/activeProfile';
import { services } from '@/services';

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
}

/** Rotating cover colors from the grief palette. */
const SPINES = ['#2F6B33', '#3D2F5E', '#1F4D22', '#26114E', '#0E5F18'];
const spineFor = (i: number) => SPINES[i % SPINES.length];

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

/**
 * What the companion may draw on for one entry. The person's own shelf when
 * they have built one; on the guided entry types (where they are reaching for
 * help) the whole loss-path catalog stands in, so a fitting book can always be
 * named. Otherwise nothing: the companion never suggests a book the person has
 * not chosen.
 */
export function libraryForCompanion(
  myLibrary: LibraryBook[],
  module: BookModule,
  entryType: string,
): CompanionLibraryBook[] {
  const guided = GUIDED_ENTRY_TYPES.includes(entryType);
  const books = myLibrary.length ? myLibrary : guided ? recommendedFor(module) : [];
  return books.map((b) => ({
    title: b.title,
    author: b.author,
    guidance: guidanceFor(b.id),
    summary: b.summary,
  }));
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
  inLibrary: (id: string) => boolean;
  /** Reset the user's library for a new test profile. */
  resetForProfile: () => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      myLibrary: [],

      inLibrary(id) {
        return get().myLibrary.some((b) => b.id === id);
      },

      addToLibrary(id) {
        const book = BOOKS.find((b) => b.id === id);
        if (!book || get().inLibrary(id)) return;
        set((s) => ({ myLibrary: [...s.myLibrary, fromCatalog(book)] }));
      },

      addAll(module) {
        set((s) => {
          const have = new Set(s.myLibrary.map((b) => b.id));
          const added = recommendedFor(module).filter((b) => !have.has(b.id));
          return { myLibrary: [...s.myLibrary, ...added] };
        });
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
        // Rate-limited (rateLimited:true) leaves the book un-summarized; opening
        // its detail re-requests, so no retry is needed here.
        const { summary } = await services.content.generateBookSummary(t, a);
        if (summary) get().setSummary(id, summary);
      },

      removeFromLibrary(id) {
        set((s) => ({ myLibrary: s.myLibrary.filter((b) => b.id !== id) }));
      },

      setSummary(id, summary) {
        set((s) => ({
          myLibrary: s.myLibrary.map((b) => (b.id === id ? { ...b, summary } : b)),
        }));
      },

      resetForProfile() {
        set({ myLibrary: [] });
      },
    }),
    {
      name: 'westercove.library',
      storage: createJSONStorage(() => scopedStorage('library')),
      // Recommended catalog is static code; only persist the user's library.
      partialize: (s) => ({ myLibrary: s.myLibrary }),
    },
  ),
);
