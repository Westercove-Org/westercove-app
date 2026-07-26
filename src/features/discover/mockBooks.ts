export interface Book {
  id: string;
  title: string;
  author: string;
  /** Spine block color (Discover book-cover cards). */
  spine: string;
}

/** The three grief-literature titles shown on the Discover screen. */
export const MOCK_BOOKS: Book[] = [
  {
    id: 'b1',
    title: 'Bearing the Unbearable',
    author: 'Joanne Cacciatore',
    spine: '#2F6B33',
  },
  {
    id: 'b2',
    title: 'The Wild Edge of Sorrow',
    author: 'Francis Weller',
    spine: '#3D2F5E',
  },
  {
    id: 'b3',
    title: 'Continuing Bonds',
    author: 'Klass, Silverman, Nickman',
    spine: '#1F4D22',
  },
];
