import {
  ENTRY_PLACEHOLDERS,
  ENTRY_TYPES,
  ENTRY_TYPE_ENUM,
  entryTypeEnum,
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

  it('maps every label to a backend enum, and unknown labels to undefined', () => {
    for (const t of ENTRY_TYPES) expect(entryTypeEnum(t)).toBe(ENTRY_TYPE_ENUM[t]);
    expect(entryTypeEnum('Grief Question')).toBe('grief_question');
    expect(entryTypeEnum('Forgiveness')).toBe('forgive');
    expect(entryTypeEnum('Emotions')).toBe('emotions');
    expect(entryTypeEnum('Nonsense')).toBeUndefined();
    expect(entryTypeEnum(undefined)).toBeUndefined();
  });

  it('isEntryType guards correctly', () => {
    expect(isEntryType('Memory')).toBe(true);
    // 'Question' is an alias, not a canonical chip type.
    expect(isEntryType('Question')).toBe(false);
    expect(isEntryType(undefined)).toBe(false);
  });

  // nt-guided-chip-bug: the visible chip must reach the guided (book-bearing)
  // reply. Both the canonical 'Grief Question' and the bare 'Question' alias
  // resolve to the same guided enum, so neither silently drops to a normal turn.
  it('routes both Question labels to the guided enum', () => {
    expect(entryTypeEnum('Grief Question')).toBe('grief_question');
    expect(entryTypeEnum('Question')).toBe('grief_question');
  });
});
