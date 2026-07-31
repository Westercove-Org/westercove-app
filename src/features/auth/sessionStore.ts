import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { secureStorage } from '@/lib/secureStorage';
import { services } from '@/services';
import { SESSION_BASE, profileKey } from '@/features/profiles/profileKeys';
import type { AuthUser, Entitlement, GateAnswers, Session } from './types';

export type SessionStatus = 'unauthenticated' | 'needs-gate' | 'ready';

interface SessionState {
  /** The active profile's session (person + gate answers). Per-profile. */
  session: Session | null;
  startBlankSession: (user: AuthUser) => void;
  completeGate: (answers: GateAnswers) => void;
  setEntitlement: (entitlement: Entitlement) => void;
  resetSession: () => void;
}

const emptyGate: GateAnswers = { mode: 'human', skipped: [] };

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,

      // Seed a blank person for a freshly created test profile. Sign-in is
      // browser-level (profilesStore); each profile carries its own gate state.
      startBlankSession(user) {
        set({
          session: {
            user,
            entryPath: 'consumer_trial',
            entitlement: 'trial_active',
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

      resetSession() {
        set({ session: null });
      },
    }),
    {
      // Dynamic per-profile key: bindProfileStores rebinds this before hydrating.
      name: profileKey(SESSION_BASE, 'unbound'),
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ session: s.session }),
      // The profiles store owns hydration timing and rebinds the key first.
      skipHydration: true,
    },
  ),
);

/** Reset the session store to blank (used when switching/creating profiles). */
export function resetSession() {
  useSessionStore.getState().resetSession();
}

/** Seed a blank session for a new profile. */
export function startBlankSession(user: AuthUser) {
  useSessionStore.getState().startBlankSession(user);
}

/** Derived routing status from the session. */
export function sessionStatus(session: Session | null): SessionStatus {
  if (!session) return 'unauthenticated';
  if (!session.gateComplete) return 'needs-gate';
  return 'ready';
}
