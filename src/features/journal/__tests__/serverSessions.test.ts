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
  useEntriesStore.setState({ serverSessions: [] });
});

describe('backend chat-session wiring', () => {
  it('refreshServerSessions is a no-op (clears) with no backend profile id', async () => {
    setSession({ backendProfileId: undefined });
    const list = jest.spyOn(services.chat, 'listSessions');

    await useEntriesStore.getState().refreshServerSessions();

    expect(list).not.toHaveBeenCalled();
    expect(useEntriesStore.getState().serverSessions).toEqual([]);
  });

  it('refreshServerSessions loads summaries for the persisted profile id', async () => {
    setSession({ backendProfileId: 7 });
    const summary = { id: 1, createdAt: 'now', entryType: 'journal', safetyTier: 'none' };
    const list = jest.spyOn(services.chat, 'listSessions').mockResolvedValue([summary]);

    await useEntriesStore.getState().refreshServerSessions();

    expect(list).toHaveBeenCalledWith(7);
    expect(useEntriesStore.getState().serverSessions).toEqual([summary]);
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
