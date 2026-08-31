/**
 * Consumer trial terms shown to the user BEFORE card entry (nt-billing-trial-fe).
 *
 * These MUST match the live Stripe product exactly. A wrong price or trial length
 * on a pre-charge disclosure is precisely the dark pattern this screen exists to
 * prevent, so this is the single source of truth — never duplicate it.
 *
 * TRIAL_DAYS: 14 — confirmed against Dwight's trial backend (#127,
 *   trial_period_days=14).
 * TRIAL_PRICE: human-confirmed authoritative display price. It MUST match the
 *   live Stripe price object — a mismatch means this screen lies to the user
 *   before they hand over a card. A price change is a one-line edit here, never
 *   a hunt across screens.
 */
export const TRIAL_DAYS = 14;
export const TRIAL_PRICE = '$0.99 / month';

/** Plain, urgency-free date the trial's first charge lands: TRIAL_DAYS from
 * `from` (default now). Same format as the Subscription screen's dates. */
export function firstChargeDate(from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}
