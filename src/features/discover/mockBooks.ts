export interface Book {
  id: string;
  title: string;
  author: string;
  /** Spine block color (Discover book-cover cards). */
  spine: string;
}

// Spine palette cycles through plum / green / gold / deep-green, matching the
// demo's book covers.
const SPINES = ['#3D2F5E', '#2F6B33', '#B9902F', '#1F4D22'];
/** Spine block color for the i-th book cover; cycles the palette. */
export const spine = (i: number) => SPINES[i % SPINES.length];

const TITLES: [string, string][] = [
  ['Bearing the Unbearable', 'Joanne Cacciatore, PhD'],
  ['The Wild Edge of Sorrow', 'Francis Weller'],
  ['Continuing Bonds', 'Klass, Silverman, and Nickman'],
  ['Letters to Grief', 'Kate Motaung'],
  ['Navigating Intense Grief', 'Emily Vandenberg'],
  ['Shattered: Surviving the Loss of a Child', 'Gary Roe'],
  ['The Grief Recovery Handbook Workbook', 'John W. James and Russell Friedman'],
  ['Imagine Heaven', 'John Burke'],
  ['The Broken Way', 'Ann Voskamp'],
  ['How to Survive the Death of an Adult Child', 'G.M. Grace'],
  ['Journey of Souls', 'Michael Newton, PhD'],
  ['Signs: The Secret Language of the Universe', 'Laura Lynne Jackson'],
  ["I Wasn't Ready to Say Goodbye", 'Brook Noel and Pamela D. Blair, PhD'],
  ['Healing After Loss', 'Martha W. Hickman'],
  ['When Our Grown Kids Disappoint Us', 'Jane Adams'],
  ['Heaven is for Real', 'Todd Burpo with Lynn Vincent'],
  ['Broken Walk', 'Gary Roe'],
  ['Grieving Beyond Gender', 'Kenneth J. Doka and Terry L. Martin'],
  ['Grief Counseling and Grief Therapy', 'J. William Worden'],
  ['Disenfranchised Grief', 'Kenneth J. Doka'],
  ['The Twelve Steps of Forgiveness', 'Paul Ferrini'],
];

/** The Westercove library catalog shown on the Discover screen. */
export const MOCK_BOOKS: Book[] = TITLES.map(([title, author], i) => ({
  id: `b${i + 1}`,
  title,
  author,
  spine: spine(i),
}));
