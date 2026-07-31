import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useProfilesStore } from '@/features/profiles/profilesStore';
import { sessionStatus, useSessionStore } from './sessionStore';

/** Route groups that must remain reachable in every session state (crisis is
 * never gated by auth or subscription). */
const ALWAYS_ALLOWED = new Set(['crisis', 'support-mode']);

/**
 * Redirects based on session status: not signed in → the arrival flow,
 * signed-in-but-gate-incomplete → the day-zero gate, ready → the tab shell.
 * Sign-in is browser-level (profilesStore); the active profile carries its own
 * gate state (sessionStore). Crisis surfaces are exempt.
 */
export function useAuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const hydrated = useProfilesStore((s) => s.hydrated);
  const signedIn = useProfilesStore((s) => s.signedIn);
  const activeId = useProfilesStore((s) => s.activeId);
  const session = useSessionStore((s) => s.session);

  useEffect(() => {
    if (!hydrated) return;
    const group = segments[0] ?? '';
    if (ALWAYS_ALLOWED.has(group)) return;

    const status =
      !signedIn || !activeId ? 'unauthenticated' : sessionStatus(session);
    const inAuth = group === '(auth)';
    const inGate = group === 'gate';

    if (status === 'unauthenticated' && !inAuth) {
      router.replace('/launch');
    } else if (status === 'needs-gate' && !inGate) {
      router.replace('/gate');
    } else if (status === 'ready' && (inAuth || inGate)) {
      router.replace('/');
    }
  }, [hydrated, signedIn, activeId, session, segments, router]);
}
