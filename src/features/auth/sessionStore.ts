import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { defaultSeedEntries } from '@/features/journal/entriesStore';
import { secureStorage } from '@/lib/secureStorage';
import { services } from '@/services';
import type { CreateAccountInput } from '@/services/auth';
import { getPersonaById } from './demoPersonas';
import type { Entitlement, GateAnswers, Session } from './types';
import { activateUserStores, deactivateUserStores } from './userScope';

export type SessionStatus = 'unauthenticated' | 'needs-gate' | 'ready';

interface SessionState {
  hydrated: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  /** One-tap sign-in as a named demo persona (id from demoPersonas). */
  signInDemo: (personaId: string) => void;
  beginAccount: (input: CreateAccountInput) => Promise<void>;
  completeGate: (answers: GateAnswers) => void;
  setEntitlement: (entitlement: Entitlement) => void;
  signOut: () => void;
}

const emptyGate: GateAnswers = { mode: 'human', skipped: [] };

/** The stable per-account id used to key persisted content. */
export function userIdOf(session: Session): string {
  return session.user.id ?? session.user.email.trim().toLowerCase();
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      session: null,

      async signIn(email, password) {
        const result = await services.auth.signIn(email, password);
        const userId = email.trim().toLowerCase();
        // A returning user is already past the day-zero gate.
        set({
          session: {
            user: { ...result.user, id: userId },
            entryPath: result.entryPath,
            entitlement: result.entitlement,
            sponsorOrganization: result.sponsorOrganization,
            disclaimerAcked: true,
            gateComplete: true,
            gateAnswers: emptyGate,
          },
        });
        // Load this account's journal (seeding sample entries the first time).
        activateUserStores(userId, defaultSeedEntries());
      },

      signInDemo(personaId) {
        const persona = getPersonaById(personaId);
        if (!persona) return;
        set({
          session: {
            user: { email: persona.email, firstName: persona.firstName, id: persona.id },
            entryPath: persona.entryPath,
            entitlement: persona.entitlement,
            disclaimerAcked: true,
            gateComplete: true,
            gateAnswers: persona.gateAnswers,
          },
        });
        // The persona's own journal loads from its fixture (or from what was
        // saved under it on a previous visit).
        activateUserStores(persona.id);
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
        const userId = result.user.email.trim().toLowerCase();
        set({
          session: {
            user: { ...result.user, id: userId },
            entryPath: result.entryPath,
            entitlement: result.entitlement,
            sponsorOrganization: result.sponsorOrganization,
            disclaimerAcked: true,
            gateComplete: false,
            gateAnswers: emptyGate,
          },
        });
        // A fresh account starts with the sample journal until it has its own.
        activateUserStores(userId, defaultSeedEntries());
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
        deactivateUserStores();
      },
    }),
    {
      name: 'westercove.session',
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ session: s.session }),
      onRehydrateStorage: () => (state) => {
        // Reload the signed-in account's per-user content before the router
        // guard acts, so a returning user lands on their own journal.
        if (state?.session) {
          activateUserStores(userIdOf(state.session));
        }
        // Mark hydration complete so the router guard can act.
        useSessionStore.setState({ hydrated: true });
      },
    },
  ),
);

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
