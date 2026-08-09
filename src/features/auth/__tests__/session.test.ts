jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

import { sessionStatus, useSessionStore } from '@/features/auth/sessionStore';
import type { Session } from '@/features/auth/types';
import { services } from '@/services';
import { MockCrmService } from '@/services/crm';

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

  it('beginAccount creates a session that still needs the gate, and writes one CRM contact', async () => {
    const crm = services.crm as MockCrmService;
    const before = crm.contacts.length;

    await useSessionStore.getState().beginAccount({ entryPath: 'consumer_trial' });

    const s = useSessionStore.getState().session;
    expect(s).not.toBeNull();
    expect(s!.gateComplete).toBe(false);
    expect(sessionStatus(s)).toBe('needs-gate');
    expect(crm.contacts.length).toBe(before + 1);
  });

  it('partner_license account gets a license entitlement', async () => {
    await useSessionStore
      .getState()
      .beginAccount({ entryPath: 'partner_license', licenseCode: 'ABC' });
    expect(useSessionStore.getState().session!.entitlement).toBe('license_active');
  });

  it('completeGate marks the session ready', async () => {
    await useSessionStore.getState().beginAccount({ entryPath: 'consumer_trial' });
    useSessionStore.getState().completeGate({ mode: 'human', skipped: [], callName: 'Sam' });
    expect(sessionStatus(useSessionStore.getState().session)).toBe('ready');
  });

  it('signIn routes into onboarding (needs-gate), matching the demo', async () => {
    await useSessionStore.getState().signIn('a@b.com', 'pw');
    expect(sessionStatus(useSessionStore.getState().session)).toBe('needs-gate');
  });
});
