import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { sessionStatus, useSessionStore } from '@/features/auth/sessionStore';
import { getDeviceId } from '@/lib/deviceId';
import { services } from '@/services';

import { legalGateHandled, markLegalGateHandled } from './legalGate';

/**
 * The legal-disclaimer launch gate (R-36). On an authenticated launch, if the
 * server says the current disclaimer version still needs acknowledgement, it
 * presents /legal-disclaimer once. It is a pushed screen, not a blocker: crisis
 * surfaces and sign-out stay reachable, and Save-and-read-later just leaves —
 * the session guard keeps it from re-surfacing until the next session. Mounted
 * in the authenticated tab shell.
 */
export function useLegalGate(): void {
  const router = useRouter();
  const ready = useSessionStore((s) => sessionStatus(s.session) === 'ready');

  useEffect(() => {
    if (!ready || legalGateHandled()) return;
    // Mark before the async resolves so the check fires exactly once per session,
    // even if getStatus fails (we then simply retry next session, never nag).
    markLegalGateHandled();
    let alive = true;
    void getDeviceId()
      .then((id) => services.legal.getStatus(id))
      .then((s) => {
        if (alive && s.required) router.push('/legal-disclaimer');
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ready, router]);
}
