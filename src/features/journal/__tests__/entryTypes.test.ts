import {
  ENTRY_PLACEHOLDERS,
  ENTRY_TYPES,
  isEntryType,
} from '@/features/journal/entryTypes';

describe('entry types', () => {
  it('has the 10 official command types', () => {
    expect(ENTRY_TYPES).toHaveLength(10);
    expect(ENTRY_TYPES).toContain('Grief Question');
    expect(ENTRY_TYPES).toContain('Forgiveness');
  });

  it('every type has a placeholder', () => {
    for (const t of ENTRY_TYPES) {
      expect(ENTRY_PLACEHOLDERS[t].length).toBeGreaterThan(0);
    }
  });

  it('isEntryType guards correctly', () => {
    expect(isEntryType('Memory')).toBe(true);
    expect(isEntryType('Question')).toBe(false);
    expect(isEntryType(undefined)).toBe(false);
  });
});
