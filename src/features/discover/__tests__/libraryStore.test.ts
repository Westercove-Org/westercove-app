jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { resetLibrary, useLibraryStore } from '@/features/discover/libraryStore';
import { MOCK_BOOKS } from '@/features/discover/mockBooks';

describe('book catalog', () => {
  it('offers a full demo-sized library with unique ids', () => {
    expect(MOCK_BOOKS.length).toBeGreaterThanOrEqual(20);
    const ids = new Set(MOCK_BOOKS.map((b) => b.id));
    expect(ids.size).toBe(MOCK_BOOKS.length);
  });
});

describe('libraryStore', () => {
  beforeEach(() => resetLibrary());

  it('starts empty', () => {
    expect(useLibraryStore.getState().bookIds).toEqual([]);
  });

  it('add is idempotent and has() reflects it', () => {
    const { add, has } = useLibraryStore.getState();
    add('b1');
    add('b1');
    expect(useLibraryStore.getState().bookIds).toEqual(['b1']);
    expect(has('b1')).toBe(true);
    expect(has('b2')).toBe(false);
  });

  it('toggle adds then removes', () => {
    const { toggle } = useLibraryStore.getState();
    toggle('b2');
    expect(useLibraryStore.getState().has('b2')).toBe(true);
    toggle('b2');
    expect(useLibraryStore.getState().has('b2')).toBe(false);
  });

  it('remove takes a book off the shelf', () => {
    useLibraryStore.getState().add('b3');
    useLibraryStore.getState().remove('b3');
    expect(useLibraryStore.getState().has('b3')).toBe(false);
  });

  it('addAll adds every id it is given', () => {
    const ids = MOCK_BOOKS.map((b) => b.id);
    useLibraryStore.getState().addAll(ids);
    expect(useLibraryStore.getState().bookIds).toEqual(ids);
  });

  it('resetLibrary clears the shelf', () => {
    useLibraryStore.getState().addAll(['b1', 'b2']);
    resetLibrary();
    expect(useLibraryStore.getState().bookIds).toEqual([]);
  });
});
