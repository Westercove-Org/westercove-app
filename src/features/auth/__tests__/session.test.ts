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

  // nt-four-doors-audit gap #1: the gate answers must reach the SESSION, not just
  // the server — otherwise the companion and journal export lose the person's name.
  it('completeFourDoorsGate copies the gate answers into the session', async () => {
    jest.spyOn(services.auth, 'signIn').mockResolvedValue(authResult);
    await useSessionStore.getState().signIn('a@b.com', 'pw');
    useSessionStore.getState().completeFourDoorsGate(7, {
      userName: '  Rae  ',
      door: 1,
      lovedOneName: '  Mara  ',
      relationship: ' my mother ',
      toneLabel: 'Direct and tactful',
    });
    const g = useSessionStore.getState().session?.gateAnswers;
    // lovedOneName survives the gate → reaches companion + journal export (both read this field).
    expect(g?.lovedOneName).toBe('Mara');
    expect(g?.callName).toBe('Rae');
    // tone reaches the profile instead of defaulting.
    expect(g?.tone).toBe('Direct and tactful');
    // door is canonical; mode derived from it (door 1 → human).
    expect(g?.door).toBe(1);
    expect(g?.mode).toBe('human');
    expect(sessionStatus(useSessionStore.getState().session)).toBe('ready');
  });

  it('completeFourDoorsGate derives module pet for a Door-4 (pet) user', async () => {
    jest.spyOn(services.auth, 'signIn').mockResolvedValue(authResult);
    await useSessionStore.getState().signIn('a@b.com', 'pw');
    useSessionStore.getState().completeFourDoorsGate(9, {
      userName: 'Rae',
      door: 4,
      lovedOneName: 'Biscuit',
      species: 'Dog',
      toneLabel: 'Gentle and warm',
    });
    const g = useSessionStore.getState().session?.gateAnswers;
    expect(g?.mode).toBe('pet');
    expect(g?.door).toBe(4);
    expect(g?.species).toBe('Dog');
  });
});
