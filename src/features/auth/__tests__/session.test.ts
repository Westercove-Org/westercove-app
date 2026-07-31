jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { sessionStatus, useSessionStore } from '@/features/auth/sessionStore';
import type { Session } from '@/features/auth/types';

const readySession: Session = {
  user: { email: 'a@b.com' },
  entryPath: 'consumer_trial',
  entitlement: 'trial_active',
  disclaimerAcked: true,
  gateComplete: true,
  gateAnswers: { mode: 'human', skipped: [] },
};

describe('sessionStatus', () => {
  it('is unauthenticated with no session', () => {
    expect(sessionStatus(null)).toBe('unauthenticated');
  });
  it('is needs-gate when the gate is incomplete', () => {
    expect(sessionStatus({ ...readySession, gateComplete: false })).toBe('needs-gate');
  });
  it('is ready when signed in and gate complete', () => {
    expect(sessionStatus(readySession)).toBe('ready');
  });
});

describe('session store', () => {
  beforeEach(() => useSessionStore.setState({ session: null }));

  it('startBlankSession seeds a person that still needs the gate', () => {
    useSessionStore.getState().startBlankSession({ email: 'a@b.com', firstName: 'Sam' });
    const s = useSessionStore.getState().session;
    expect(s).not.toBeNull();
    expect(s!.gateComplete).toBe(false);
    expect(sessionStatus(s)).toBe('needs-gate');
  });

  it('completeGate marks the session ready', () => {
    useSessionStore.getState().startBlankSession({ email: 'a@b.com' });
    useSessionStore.getState().completeGate({ mode: 'human', skipped: [], callName: 'Sam' });
    expect(sessionStatus(useSessionStore.getState().session)).toBe('ready');
  });

  it('resetSession clears the person back to unauthenticated', () => {
    useSessionStore.getState().startBlankSession({ email: 'a@b.com' });
    useSessionStore.getState().resetSession();
    expect(sessionStatus(useSessionStore.getState().session)).toBe('unauthenticated');
  });
});
