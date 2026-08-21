jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { sessionStatus, useSessionStore } from '@/features/auth/sessionStore';
import type { Session } from '@/features/auth/types';
import { services } from '@/services';
import type { AuthResult } from '@/services/auth';

const readySession: Session = {
  user: { email: 'a@b.com' },
  entryPath: 'consumer_trial',
  entitlement: 'trial_active',
  disclaimerAcked: true,
  gateComplete: true,
  gateAnswers: { mode: 'human', skipped: [] },
};

const authResult: AuthResult = {
  user: { email: 'a@b.com' },
  entitlement: 'trial_active',
  entryPath: 'consumer_trial',
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
  afterEach(() => jest.restoreAllMocks());

  it('signIn routes an invited user into onboarding (needs-gate)', async () => {
    jest.spyOn(services.auth, 'signIn').mockResolvedValue(authResult);
    await useSessionStore.getState().signIn('a@b.com', 'pw');
    expect(sessionStatus(useSessionStore.getState().session)).toBe('needs-gate');
  });

  it('completeNewPassword (first login) also lands in the gate', async () => {
    jest.spyOn(services.auth, 'completeNewPassword').mockResolvedValue(authResult);
    await useSessionStore.getState().completeNewPassword('a@b.com', 'New#Passw0rd!');
    expect(sessionStatus(useSessionStore.getState().session)).toBe('needs-gate');
  });

  it('completeGate marks the session ready', async () => {
    jest.spyOn(services.auth, 'signIn').mockResolvedValue(authResult);
    await useSessionStore.getState().signIn('a@b.com', 'pw');
    useSessionStore.getState().completeGate({ mode: 'human', skipped: [], callName: 'Sam' });
    expect(sessionStatus(useSessionStore.getState().session)).toBe('ready');
  });
});
