/**
 * Consumer trial terms shown to the user BEFORE card entry (nt-billing-trial-fe).
 *
 * These MUST match the live Stripe product exactly. A wrong price or trial length
 * on a pre-charge disclosure is precisely the dark pattern this screen exists to
 * prevent, so this is the single source of truth — never duplicate it.
 *
 * TRIAL_DAYS: 14 — confirmed against Dwight's trial backend (#127,
 *   trial_period_days=14).
 * TRIAL_PRICE: ⚠️ UNVERIFIED display string. Confirm the exact amount + interval
 *   against the Stripe product with Dwight/Stanley BEFORE this merges. (Currently
 *   the value MockSubscriptionService has shown; not authoritative.)
 */
export const TRIAL_DAYS = 14;
export const TRIAL_PRICE = '$8.99 / month';

/** Plain, urgency-free date the trial's first charge lands: TRIAL_DAYS from
 * `from` (default now). Same format as the Subscription screen's dates. */
export function firstChargeDate(from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}
