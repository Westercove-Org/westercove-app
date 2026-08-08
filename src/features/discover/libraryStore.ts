import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '@/lib/secureStorage';
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
}

/** Rotating cover colors from the grief palette. */
const SPINES = ['#2F6B33', '#3D2F5E', '#1F4D22', '#26114E', '#0E5F18'];
const spineFor = (i: number) => SPINES[i % SPINES.length];

const RECOMMENDED_SEED: Array<Pick<LibraryBook, 'title' | 'author'>> = [
  { title: 'Letters to Grief', author: 'Kate Motaung' },
  { title: 'Navigating Intense Grief', author: 'Emily Vandenberg' },
  { title: 'Shattered: Surviving the Loss of a Child', author: 'Gary Roe' },
  { title: 'The Grief Recovery Handbook Workbook', author: 'John W. James and Russell Friedman' },
  { title: 'F**k Death Workbook', author: 'Steve Case' },
  { title: 'Imagine Heaven', author: 'John Burke' },
  { title: 'The Broken Way', author: 'Ann Voskamp' },
  { title: 'How to Survive the Death of an Adult Child', author: 'G.M. Grace' },
  { title: 'Journey of Souls: Case Studies of Life Between Lives', author: 'Michael Newton, PhD' },
  { title: 'Signs: The Secret Language of the Universe', author: 'Laura Lynne Jackson' },
  { title: 'Bearing the Unbearable: Love, Loss, and the Heartbreaking Path of Grief', author: 'Joanne Cacciatore, PhD' },
  { title: "I Wasn't Ready to Say Goodbye", author: 'Brook Noel and Pamela D. Blair, PhD' },
  { title: 'Healing After Loss', author: 'Martha W. Hickman' },
  { title: 'When Our Grown Kids Disappoint Us', author: 'Jane Adams' },
  { title: 'Heaven is for Real', author: 'Todd Burpo with Lynn Vincent' },
  { title: 'Broken Walk', author: 'Gary Roe' },
  { title: 'Grieving Beyond Gender: Understanding Diverse Grieving Styles', author: 'Kenneth J. Doka and Terry L. Martin' },
  { title: 'Grief Counseling and Grief Therapy', author: 'J. William Worden' },
  { title: 'Continuing Bonds: New Understandings of Grief', author: 'Dennis Klass, Phyllis R. Silverman, and Steven L. Nickman' },
  { title: 'Disenfranchised Grief: Recognizing Hidden Sorrow', author: 'Kenneth J. Doka' },
  { title: 'The Twelve Steps of Forgiveness', author: 'Paul Ferrini' },
  { title: 'Induced After Death Communication', author: 'Allan L. Botkin and Craig Hogan' },
];

const RECOMMENDED: LibraryBook[] = RECOMMENDED_SEED.map((b, i) => ({
  id: `rec-${i}`,
  title: b.title,
  author: b.author,
  source: 'westercove',
  spine: spineFor(i),
}));

interface LibraryState {
  /** Curated Westercove catalog (static). */
  recommended: LibraryBook[];
  /** Books the user has added to their own library. */
  myLibrary: LibraryBook[];
  addToLibrary: (id: string) => void;
  addAll: () => void;
  addOwnBook: (title: string, author: string) => Promise<void>;
  inLibrary: (id: string) => boolean;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      recommended: RECOMMENDED,
      myLibrary: [],

      inLibrary(id) {
        return get().myLibrary.some((b) => b.id === id);
      },

      addToLibrary(id) {
        const book = get().recommended.find((b) => b.id === id);
        if (!book || get().inLibrary(id)) return;
        set((s) => ({ myLibrary: [...s.myLibrary, book] }));
      },

      addAll() {
        set((s) => {
          const have = new Set(s.myLibrary.map((b) => b.id));
          const added = s.recommended.filter((b) => !have.has(b.id));
          return { myLibrary: [...s.myLibrary, ...added] };
        });
      },

      async addOwnBook(title, author) {
        const t = title.trim();
        const a = author.trim();
        if (!t) return;
        const summary = await services.content.generateBookSummary(t, a);
        set((s) => ({
          myLibrary: [
            ...s.myLibrary,
            { id: `own-${Date.now()}`, title: t, author: a, source: 'own', spine: spineFor(s.myLibrary.length), summary },
          ],
        }));
      },
    }),
    {
      name: 'westercove.library',
      storage: createJSONStorage(() => secureStorage),
      // Recommended catalog is static code; only persist the user's library.
      partialize: (s) => ({ myLibrary: s.myLibrary }),
    },
  ),
);
