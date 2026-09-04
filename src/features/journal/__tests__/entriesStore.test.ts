jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { useEntriesStore } from '@/features/journal/entriesStore';
import { services } from '@/services';
import { setSafetyOverride, SafetyLevel } from '@/services/safety';

describe('entriesStore', () => {
  afterEach(() => {
    setSafetyOverride(null);
    jest.restoreAllMocks();
  });

  it('addEntry (normal grief) creates an entry with a user turn and a companion response', async () => {
    const { addEntry } = useEntriesStore.getState();
    const { id, level } = await addEntry({ type: 'Memory', text: 'A gentle memory today' });
    expect(level).toBe(SafetyLevel.Normal);

    const entry = useEntriesStore.getState().getEntry(id);
    expect(entry).toBeDefined();
    expect(entry!.turns.filter((t) => t.role === 'user')).toHaveLength(1);
    expect(entry!.turns.filter((t) => t.role === 'companion')).toHaveLength(1);
    expect(entry!.headline.length).toBeGreaterThan(0);
    // Newest entry is first.
    expect(useEntriesStore.getState().entries[0].id).toBe(id);
  });

  it('v16 P0: a save whose companion reply throws still persists the entry with the user words', async () => {
    // Headline (justHeard:true) still succeeds — it is written before persist —
    // but the reply-generation call (justHeard omitted) blows up. The entry must
    // survive: in the Journal, on Profile, in the download, not vanish.
    jest.spyOn(services.companion, 'respond').mockImplementation(async (req) => {
      if (req.justHeard) return { response: '', headline: 'Kept even so' };
      throw new Error('companion unreachable');
    });

    const { addEntry } = useEntriesStore.getState();
    const { id } = await addEntry({ type: 'Gratitude', text: 'a small goodness today' });

    const entry = useEntriesStore.getState().getEntry(id);
    expect(entry).toBeDefined();
    expect(entry!.turns.filter((t) => t.role === 'user')).toHaveLength(1);
    expect(entry!.turns[0].text).toBe('a small goodness today');
    // No companion turn (the reply failed) — the entry stands regardless.
    expect(entry!.turns.filter((t) => t.role === 'companion')).toHaveLength(0);
    expect(useEntriesStore.getState().entries[0].id).toBe(id);
  });

  it('suspends the companion response at Level 4 (safety governs)', async () => {
    setSafetyOverride(SafetyLevel.Critical);
    const { addEntry } = useEntriesStore.getState();
    const { id, level } = await addEntry({ type: 'Journal', text: 'anything' });
    expect(level).toBe(SafetyLevel.Critical);

    const entry = useEntriesStore.getState().getEntry(id)!;
    expect(entry.turns.filter((t) => t.role === 'companion')).toHaveLength(0);
    expect(entry.safetyLevel).toBe(SafetyLevel.Critical);
  });

  it('continueEntry appends a user turn and a companion turn for normal grief', async () => {
    const { addEntry, continueEntry } = useEntriesStore.getState();
    const { id } = await addEntry({ type: 'Journal', text: 'first thought' });
    const before = useEntriesStore.getState().getEntry(id)!.turns.length;

    await continueEntry(id, 'a second thought');
    const after = useEntriesStore.getState().getEntry(id)!.turns.length;
    expect(after).toBe(before + 2);
  });
});
