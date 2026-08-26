import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { scopedStorage } from '@/features/profile/activeProfile';
import { services } from '@/services';
import type { AuthResult } from '@/services/auth';
import type { Entitlement, GateAnswers, Session } from './types';

export type SessionStatus = 'unauthenticated' | 'needs-gate' | 'ready';

interface SessionState {
  hydrated: boolean;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  /** Finish an invited user's first login by setting a permanent password. */
  completeNewPassword: (email: string, newPassword: string) => Promise<void>;
  completeGate: (answers: GateAnswers) => void;
  /** Finish the 4-Doors gate: the profile already exists server-side (POST
   * /survey/gate returned its id), so mark the gate done, adopt the profile id,
   * and carry the call name for the Home greeting. */
  completeFourDoorsGate: (profileId: number, userName: string) => void;
  setEntitlement: (entitlement: Entitlement, sponsorOrganization?: string) => void;
  setFullName: (fullName: string) => void;
  updateGate: (partial: Partial<GateAnswers>) => void;
  signOut: () => void;
  /** Reset to a fresh (unonboarded) session for a new test profile. */
  resetForProfile: () => void;
  /** Start a signed-in-but-not-onboarded session (new test profile → onboarding). */
  beginOnboardingSession: () => void;
}

const emptyGate: GateAnswers = { mode: 'human', skipped: [] };

/** A fresh, signed-in-but-not-yet-onboarded session from an auth result. */
function sessionFrom(result: AuthResult): Session {
  return {
    user: result.user,
    entryPath: result.entryPath,
    entitlement: result.entitlement,
    sponsorOrganization: result.sponsorOrganization,
    disclaimerAcked: true,
    gateComplete: false,
    gateAnswers: emptyGate,
  };
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      session: null,

      async signIn(email, password) {
        // Throws NewPasswordRequiredError on a first login; the sign-in screen
        // catches it and collects a permanent password, then calls
        // completeNewPassword below.
        set({ session: sessionFrom(await services.auth.signIn(email, password)) });
        // Reconcile the freshly re-gated session with the server: a returning
        // user who already has a survey profile finished the day-zero gate on a
        // prior device/session, so skip re-asking it and scope backend calls to
        // that profile. Best-effort — a failure just leaves the gate to be
        // re-confirmed rather than stranding the user.
        try {
          const profiles = await services.survey.listProfiles();
          if (profiles.length > 0) {
            const s = get().session;
            if (s) set({ session: { ...s, gateComplete: true, backendProfileId: profiles[0].id } });
          }
        } catch {
          // offline / transient — keep the local gate as the fallback
        }
      },

      async completeNewPassword(email, newPassword) {
        set({ session: sessionFrom(await services.auth.completeNewPassword(email, newPassword)) });
      },

      completeGate(answers) {
        const s = get().session;
        if (!s) return;
        set({ session: { ...s, gateComplete: true, gateAnswers: answers } });
        // Persist the (possibly partial) gate answers to the backend so the
        // companion prompt can be generated. Fire-and-forget: onboarding never
        // blocks on the network, and a failure here must not strand the user.
        // Stash the returned backend profile id so chat-session calls can scope
        // to this companion (patch onto the current session if it's still live).
        void services.survey
          .submitGate(answers)
          .then(({ profileId }) => {
            const cur = get().session;
            if (cur) set({ session: { ...cur, backendProfileId: profileId } });
          })
          .catch(() => {});
      },

      completeFourDoorsGate(profileId, userName) {
        const s = get().session;
        if (!s) return;
        set({
          session: {
            ...s,
            gateComplete: true,
            backendProfileId: profileId,
            gateAnswers: { ...s.gateAnswers, callName: userName.trim() },
          },
        });
      },

      setEntitlement(entitlement, sponsorOrganization) {
        const s = get().session;
        if (!s) return;
        set({
          session: {
            ...s,
            entitlement,
            ...(sponsorOrganization !== undefined ? { sponsorOrganization } : {}),
          },
        });
        // CRM sync is fire-and-forget; synced:false is not an error.
        void services.crm.updateEntitlement(s.user.email, entitlement).catch(() => {});
      },

      setFullName(fullName) {
        const s = get().session;
        if (!s) return;
        set({ session: { ...s, fullName } });
      },

      updateGate(partial) {
        const s = get().session;
        if (!s) return;
        set({ session: { ...s, gateAnswers: { ...s.gateAnswers, ...partial } } });
      },

      signOut() {
        // Clear the Cognito tokens (access + refresh) too; fire-and-forget so
        // sign-out is instant and never blocked on storage.
        void services.auth.signOut().catch(() => {});
        set({ session: null });
      },

      resetForProfile() {
        set({ session: null });
      },

      beginOnboardingSession() {
        set({
          session: {
            user: { email: '' },
            entryPath: 'consumer_trial',
            entitlement: 'trial_active',
            disclaimerAcked: true,
            gateComplete: false,
            gateAnswers: emptyGate,
          },
        });
      },
    }),
    {
      name: 'westercove.session',
      storage: createJSONStorage(() => scopedStorage('session')),
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
