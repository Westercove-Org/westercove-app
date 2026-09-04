import { secureStorage } from '@/lib/secureStorage';

const KEY = 'welcome_acceptance';

export interface WelcomeAcceptance {
  version: string;
  acceptedAt: string;
}

/**
 * The S0 welcome-notice acceptance (18+ tick). Browser/secure storage is
 * beta-sufficient per spec; production records it server-side against the
 * account at signup.
 *
 * ponytail: this is the FE seam for Stanley's qs7-be-welcome-notice-consent.
 * When his PR lands, the stored `version` is threaded into the signup finalize
 * call (his optional `accepted_notice_version` field) so the server writes the
 * durable acceptance row. Re-ask is driven by GET /legal/status (version bump).
 */
export async function recordWelcomeAcceptance(version: string): Promise<void> {
  const record: WelcomeAcceptance = { version, acceptedAt: new Date().toISOString() };
  await secureStorage.setItem(KEY, JSON.stringify(record));
}

/** The stored acceptance, or null if never accepted. */
export async function getWelcomeAcceptance(): Promise<WelcomeAcceptance | null> {
  const raw = await secureStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WelcomeAcceptance;
  } catch {
    return null;
  }
}

/** True when the current notice version has been accepted (else the gate re-asks). */
export async function hasAcceptedWelcome(version: string): Promise<boolean> {
  const stored = await getWelcomeAcceptance();
  return stored?.version === version;
}
