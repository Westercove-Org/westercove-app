/** How the account was created (drives entitlement + onboarding emails). */
export type EntryPath = 'consumer_trial' | 'partner_license';

/** The single entitlement source of truth. Crisis works in every state. */
export type Entitlement =
  | 'trial_active'
  | 'active_monthly'
  | 'active_annual'
  | 'license_active'
  | 'lapsed';

export type GateMode = 'human' | 'pet';

/** The five day-zero gate answers. Everything is optional — any question can be
 * skipped, and the gate can be left for later. */
export interface GateAnswers {
  callName?: string;
  lovedOneName?: string;
  relationship?: string;
  mode: GateMode;
  species?: string;
  tone?: string;
  /** Question ids the user skipped (they retire to the What I Know page). */
  skipped: string[];
}

export interface AuthUser {
  email: string;
  firstName?: string;
  /** Stable per-account id used to key that account's persisted content
   * (journal, question progress). Falls back to the email when unset. */
  id?: string;
}

export interface Session {
  user: AuthUser;
  entryPath: EntryPath;
  entitlement: Entitlement;
  sponsorOrganization?: string;
  disclaimerAcked: boolean;
  gateComplete: boolean;
  gateAnswers: GateAnswers;
}
