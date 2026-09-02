import { reloadDraftForActiveProfile, useDraftStore } from '@/features/journal/draftStore';
import { setActiveId } from '@/features/profile/activeProfile';

const reset = () => useDraftStore.setState({ text: '', type: 'Journal' });

describe('entry draft (R-30)', () => {
  beforeEach(reset);

  it('autosaves the words and their category as the writer composes', () => {
    useDraftStore.getState().setDraft({ text: 'Dear Mum,', type: 'Letter' });
    expect(useDraftStore.getState().text).toBe('Dear Mum,');
    expect(useDraftStore.getState().type).toBe('Letter');
  });

  it('keeps the type when only the text changes, and vice versa', () => {
    useDraftStore.getState().setDraft({ text: 'a', type: 'Memory' });
    useDraftStore.getState().setDraft({ text: 'a longer memory' });
    expect(useDraftStore.getState().type).toBe('Memory');
    expect(useDraftStore.getState().text).toBe('a longer memory');
  });

  it('clears once the entry is saved', () => {
    useDraftStore.getState().setDraft({ text: 'a memory', type: 'Memory' });
    useDraftStore.getState().clear();
    expect(useDraftStore.getState().text).toBe('');
    expect(useDraftStore.getState().type).toBe('Journal');
  });

  it('does not leak the draft across a profile switch (R-30 / Pam send-back)', async () => {
    setActiveId('A');
    useDraftStore.setState({ text: "A's words", type: 'Letter' });
    // Switch to a profile with no stored draft: the singleton must not carry
    // A's words into B's compose field.
    setActiveId('B');
    await reloadDraftForActiveProfile();
    expect(useDraftStore.getState().text).toBe('');
    expect(useDraftStore.getState().type).toBe('Journal');
    setActiveId('p-1');
  });
});
