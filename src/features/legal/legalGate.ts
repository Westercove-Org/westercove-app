/**
 * Session-scoped guard for the legal-disclaimer launch gate (R-36). The gate
 * presents the disclaimer at most once per authenticated session: once handled
 * (presented, or the check ran), it does not re-surface until the next session.
 * Save-and-read-later therefore dismisses it for the session for free. Reset on
 * sign-out so the next member is checked afresh.
 */
let handled = false;

/** Mark the gate handled for this session (called before it presents, so it
 * fires exactly once even across re-renders). */
export function markLegalGateHandled(): void {
  handled = true;
}

export function legalGateHandled(): boolean {
  return handled;
}

/** Clear the session guard (on sign-out) so the next session re-checks. */
export function resetLegalGate(): void {
  handled = false;
}
