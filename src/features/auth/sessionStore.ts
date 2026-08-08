import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '@/lib/secureStorage';
import { services } from '@/services';
import type { CreateAccountInput } from '@/services/auth';
import type { Entitlement, GateAnswers, Session } from './types';

export type SessionStatus = 'unauthenticated' | 'needs-gate' | 'ready';

interface SessionState {
  hydrated: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  beginAccount: (input: CreateAccountInput) => Promise<void>;
  completeGate: (answers: GateAnswers) => void;
  setEntitlement: (entitlement: Entitlement) => void;
  signOut: () => void;
}

const emptyGate: GateAnswers = { mode: 'human', skipped: [] };

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      session: null,

      async signIn(email, password) {
        const result = await services.auth.signIn(email, password);
        // A returning user is already past the day-zero gate.
        set({
          session: {
            user: result.user,
            entryPath: result.entryPath,
            entitlement: result.entitlement,
            sponsorOrganization: result.sponsorOrganization,
            disclaimerAcked: true,
            gateComplete: true,
            gateAnswers: emptyGate,
          },
        });
      },

      async beginAccount(input) {
        const result = await services.auth.createAccount(input);
        // Signup writes a single CRM contact carrying lifecycle facts only.
        await services.crm.createContact({
          email: result.user.email,
          firstName: result.user.firstName,
          entryPath: result.entryPath,
          entitlement: result.entitlement,
          sponsorOrganization: result.sponsorOrganization,
        });
        set({
          session: {
            user: result.user,
            entryPath: result.entryPath,
            entitlement: result.entitlement,
            sponsorOrganization: result.sponsorOrganization,
            disclaimerAcked: true,
            gateComplete: false,
            gateAnswers: emptyGate,
          },
        });
      },

      completeGate(answers) {
        const s = get().session;
        if (!s) return;
        set({ session: { ...s, gateComplete: true, gateAnswers: answers } });
      },

      setEntitlement(entitlement) {
        const s = get().session;
        if (!s) return;
        set({ session: { ...s, entitlement } });
        void services.crm.updateEntitlement(s.user.email, entitlement);
      },

      signOut() {
        set({ session: null });
      },
    }),
    {
      name: 'westercove.session',
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ session: s.session }),
      onRehydrateStorage: () => (state) => {
        // Mark hydration complete so the router guard can act.
        useSessionStore.setState({ hydrated: true });
        void state;
      },
    },
  ),
);

/**
 * The loved one's name for compose/questions ("For Lily", "[name]" tokens).
 * Falls back to a seeded default so the flow reads naturally before the gate
 * has captured a real name.
 */
export function lovedOneName(): string {
  return (
    useSessionStore.getState().session?.gateAnswers.lovedOneName?.trim() || 'Lily'
  );
}

/** Derived routing status from the session. */
export function sessionStatus(session: Session | null): SessionStatus {
  if (!session) return 'unauthenticated';
  if (!session.gateComplete) return 'needs-gate';
  return 'ready';
}

/** True in every state where crisis resources must work — i.e. always. */
export function crisisAlwaysAvailable(): boolean {
  return true;
}
