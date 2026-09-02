import {
  ENTRY_PLACEHOLDERS,
  ENTRY_TYPES,
  ENTRY_TYPE_ENUM,
  entryTypeEnum,
  isEntryType,
} from '@/features/journal/entryTypes';

describe('entry types', () => {
  it('has the 11 official command types', () => {
    expect(ENTRY_TYPES).toHaveLength(11);
    expect(ENTRY_TYPES).toContain('Grief Question');
    expect(ENTRY_TYPES).toContain('Forgiveness');
    expect(ENTRY_TYPES).toContain('Gratitude');
  });

  it('every type has a placeholder', () => {
    for (const t of ENTRY_TYPES) {
      expect(ENTRY_PLACEHOLDERS[t].length).toBeGreaterThan(0);
    }
  });

  it('maps every label to a backend enum, and unknown labels to undefined', () => {
    for (const t of ENTRY_TYPES) expect(entryTypeEnum(t)).toBe(ENTRY_TYPE_ENUM[t]);
    expect(entryTypeEnum('Grief Question')).toBe('grief_question');
    expect(entryTypeEnum('Forgiveness')).toBe('forgive');
    expect(entryTypeEnum('Emotions')).toBe('emotions');
    expect(entryTypeEnum('Gratitude')).toBe('gratitude');
    expect(entryTypeEnum('Nonsense')).toBeUndefined();
    expect(entryTypeEnum(undefined)).toBeUndefined();
  });

  it('isEntryType guards correctly', () => {
    expect(isEntryType('Memory')).toBe(true);
    expect(isEntryType('Question')).toBe(false);
    expect(isEntryType(undefined)).toBe(false);
  });
});
