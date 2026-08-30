jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { useEntriesStore } from '@/features/journal/entriesStore';
import { useSessionStore } from '@/features/auth/sessionStore';
import { services } from '@/services';
import type { Session } from '@/features/auth/types';

const baseSession: Session = {
  user: { email: 'a@b.co' },
  entryPath: 'consumer_trial',
  entitlement: 'trial_active',
  disclaimerAcked: true,
  gateComplete: true,
  gateAnswers: { mode: 'human', skipped: [] },
};

function setSession(patch: Partial<Session>) {
  useSessionStore.setState({ session: { ...baseSession, ...patch } });
}

afterEach(() => {
  jest.restoreAllMocks();
  useSessionStore.setState({ session: null });
  useEntriesStore.setState({ serverSessions: [], entries: [] });
});

describe('backend chat-session wiring', () => {
  it('refreshServerSessions is a no-op (clears sessions) with no backend profile id', async () => {
    setSession({ backendProfileId: undefined });
    const list = jest.spyOn(services.chat, 'listSessions');
    const jlist = jest.spyOn(services.journal, 'list');

    await useEntriesStore.getState().refreshServerSessions();

    expect(list).not.toHaveBeenCalled();
    expect(jlist).not.toHaveBeenCalled();
    expect(useEntriesStore.getState().serverSessions).toEqual([]);
  });

  it('loads server journal entries + session tiers, mapping a command entry to turns', async () => {
    setSession({ backendProfileId: 7 });
    const summary = {
      id: 10,
      createdAt: 'now',
      entryType: 'struggle',
      safetyTier: 'tier_2',
      journalEntryId: 1,
    };
    const list = jest.spyOn(services.chat, 'listSessions').mockResolvedValue([summary]);
    const jlist = jest.spyOn(services.journal, 'list').mockResolvedValue([
      {
        id: 1,
        date: '2026-08-30',
        time: '10:00:00',
        title: 'A hard morning',
        entry: 'I miss her.',
        reflection: 'It makes sense this morning felt heavy.',
        entryType: 'struggle',
        profileId: 7,
        createdAt: '2026-08-30T14:00:00Z',
      },
    ]);

    await useEntriesStore.getState().refreshServerSessions();

    expect(list).toHaveBeenCalledWith(7);
    expect(jlist).toHaveBeenCalledWith(7);
    expect(useEntriesStore.getState().serverSessions).toEqual([summary]);

    const [e] = useEntriesStore.getState().entries;
    expect(e.id).toBe('j1');
    expect(e.type).toBe('Struggle');
    expect(e.headline).toBe('A hard morning');
    expect(e.sessionId).toBe(10);
    // tier_2 (High = level 3) reconciled from the linked session.
    expect(e.safetyLevel).toBe(3);
    // command entry (reflection present) → user turn + companion turn.
    expect(e.turns.map((t) => [t.role, t.text])).toEqual([
      ['user', 'I miss her.'],
      ['companion', 'It makes sense this morning felt heavy.'],
    ]);
  });

  it('splits a session entry transcript (reflection null) back into turns', async () => {
    setSession({ backendProfileId: 7 });
    jest.spyOn(services.chat, 'listSessions').mockResolvedValue([]);
    jest.spyOn(services.journal, 'list').mockResolvedValue([
      {
        id: 2,
        date: '2026-08-30',
        time: '10:00:00',
        title: 'Session',
        entry: 'You: I miss her\n\nCompanion: I am here with you\n\nYou: thank you',
        reflection: null,
        entryType: 'journal',
        profileId: 7,
        createdAt: '2026-08-30T14:00:00Z',
      },
    ]);

    await useEntriesStore.getState().refreshServerSessions();

    const [e] = useEntriesStore.getState().entries;
    expect(e.turns.map((t) => [t.role, t.text])).toEqual([
      ['user', 'I miss her'],
      ['companion', 'I am here with you'],
      ['user', 'thank you'],
    ]);
    // No linked session → defaults to Normal.
    expect(e.safetyLevel).toBe(1);
  });

  it('falls back to a single user turn when a session entry has no transcript labels', async () => {
    setSession({ backendProfileId: 7 });
    jest.spyOn(services.chat, 'listSessions').mockResolvedValue([]);
    jest.spyOn(services.journal, 'list').mockResolvedValue([
      {
        id: 3,
        date: '2026-08-30',
        time: '10:00:00',
        title: 'Note',
        entry: 'just a plain note with no labels',
        reflection: null,
        entryType: 'journal',
        profileId: 7,
        createdAt: '2026-08-30T14:00:00Z',
      },
    ]);

    await useEntriesStore.getState().refreshServerSessions();

    const [e] = useEntriesStore.getState().entries;
    expect(e.turns.map((t) => [t.role, t.text])).toEqual([
      ['user', 'just a plain note with no labels'],
    ]);
  });

  it('completeGate stashes the backend profile id returned by submit', async () => {
    setSession({});
    jest
      .spyOn(services.survey, 'submitGate')
      .mockResolvedValue({ status: 'pending', profileId: 42 });

    useSessionStore.getState().completeGate({ mode: 'human', skipped: [], callName: 'Sam' });
    await Promise.resolve();
    await Promise.resolve();

    expect(useSessionStore.getState().session?.backendProfileId).toBe(42);
  });
});
