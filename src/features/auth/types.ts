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
  /** Free-text animal kind (pet path), e.g. "Dog". */
  species?: string;
  /** Optional breed/mix (pet path). */
  breed?: string;
  tone?: string;
  /** Question ids the user skipped (they retire to the What I Know page). */
  skipped: string[];
}

export interface AuthUser {
  email: string;
  firstName?: string;
}

export interface Session {
  user: AuthUser;
  entryPath: EntryPath;
  entitlement: Entitlement;
  sponsorOrganization?: string;
  disclaimerAcked: boolean;
  gateComplete: boolean;
  gateAnswers: GateAnswers;
  /** Full name as it should appear on the downloaded journal (Profile). */
  fullName?: string;
  /** Backend survey profile id, returned by `POST /survey/submit` and used to
   * scope chat-session calls (create/list) to this companion. */
  backendProfileId?: number;
}
