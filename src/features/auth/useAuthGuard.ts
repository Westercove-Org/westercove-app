import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { sessionStatus, useSessionStore } from './sessionStore';

/** Routes that must remain reachable in every session state: crisis surfaces
 * (never gated by auth or subscription), and the branded 404 — otherwise the
 * guard redirects a genuinely-unknown route to /launch (or /gate) before
 * +not-found can render. */
const ALWAYS_ALLOWED = new Set(['crisis', 'support-mode', '+not-found']);

/**
 * Redirects based on session status: unauthenticated → the arrival flow,
 * authenticated-but-gate-incomplete → the day-zero gate, ready → the tab shell.
 * Crisis surfaces are exempt so they are reachable from anywhere.
 */
export function useAuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const hydrated = useSessionStore((s) => s.hydrated);
  const session = useSessionStore((s) => s.session);

  useEffect(() => {
    if (!hydrated) return;
    const group = segments[0] ?? '';
    if (ALWAYS_ALLOWED.has(group)) return;

    const status = sessionStatus(session);
    const inAuth = group === '(auth)';
    const inGate = group === 'gate';

    if (status === 'unauthenticated' && !inAuth) {
      router.replace('/launch');
    } else if (status === 'needs-gate' && !inGate) {
      router.replace('/gate');
    } else if (status === 'ready' && (inAuth || inGate)) {
      router.replace('/');
    }
  }, [hydrated, session, segments, router]);
}
