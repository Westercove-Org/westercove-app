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
    expect(isEntryType('Question')).toBe(false);
    expect(isEntryType(undefined)).toBe(false);
  });

  /**
   * v16 root-cause lock (v16-entry-button-ids-and-mapping). The wire value sent
   * to the companion as `entry_type` is ALWAYS `entryTypeEnum(label)` — a stable
   * id, never the on-screen label (see entriesStore `companionReply`). So a
   * button's text can change without ever changing what the companion is told.
   *
   * The beta's defect was a 'Question' button producing 'Question', which missed
   * the guided list and dumped the whole catalog with no instruction. Here the
   * button is 'Grief Question' → 'grief_question', and every guided-eligible
   * button maps to an enum the backend actually tests against. This test freezes
   * that agreement so a rename can never silently break the guided/book path.
   *
   * BACKEND_GUIDED_ENUMS mirrors QuietRoom `_GUIDED_ENTRY_TYPES`
   * (backend/app/application/services/chat_service.py). If the backend set
   * changes, this must change with it — on purpose, in review.
   */
  it('every guided-eligible button sends the exact backend guided enum', () => {
    const BACKEND_GUIDED_ENUMS = new Set([
      'grief_question',
      'forgive',
      'struggle',
      'practice',
      'emotions',
    ]);
    const guidedButtons = ['Grief Question', 'Forgiveness', 'Struggle', 'Practice', 'Emotions'];
    for (const label of guidedButtons) {
      const wire = entryTypeEnum(label);
      expect(wire).toBeDefined();
      expect(BACKEND_GUIDED_ENUMS.has(wire!)).toBe(true);
    }
    // The beta's failing label must never resolve to a wire value or be a button.
    expect(entryTypeEnum('Question')).toBeUndefined();
    expect(isEntryType('Question')).toBe(false);
  });
});
