/**
 * Inbound deep-link target preserved across sign-in (R-62). A billing email is
 * usually opened on a signed-out phone; without this the auth guard bounces the
 * user to /launch and, after sign-in, lands them on Home instead of the screen
 * the email pointed at — the one moment giving up costs the account.
 *
 * The fixed GHL custom values are `westercoveapp://<path>`:
 *   app_url         -> westercoveapp://              (Home; no target needed)
 *   membership_url  -> westercoveapp://subscription
 *   update_card_url -> westercoveapp://update-card   (R-10/R-61: auto-mints a
 *                       portal session on the card form; distinct path so the
 *                       app can tell it apart from membership_url)
 *
 * Only these registered targets are carried; anything else fails soft to Home.
 * ponytail: allowlist, not a router introspection — the deep-linkable set is
 * tiny and fixed. Params aren't preserved (these targets take none); add if a
 * future deep link needs them.
 */
export const DEEP_LINK_TARGETS = new Set(['/subscription', '/update-card']);

let pending: string | null = null;

/** Remember where an unauthenticated visitor was headed, if it's a registered
 * deep-link target. A non-target (e.g. Home) clears any stale pending target. */
export function rememberTarget(path: string): void {
  pending = DEEP_LINK_TARGETS.has(path) ? path : null;
}

/** Consume the pending target once, after sign-in. Null → caller sends Home. */
export function takeTarget(): string | null {
  const t = pending;
  pending = null;
  return t;
}
