/**
 * Consumer trial terms shown to the user (nt-billing-trial-fe).
 *
 * NOTE ON PRICE: the trial PRICE is deliberately NOT here. It must be fetched
 * live from the Stripe-backed pre-auth pricing endpoint (Stanley), because
 * Stripe test vs live mode hold different price objects — a hardcoded number
 * would state one price while a real customer is charged another, on the exact
 * screen built to prevent that. Never add a price constant here.
 *
 * TRIAL_DAYS: 14 — confirmed against Dwight's trial backend (#127,
 *   trial_period_days=14). The pricing endpoint will also return trial days from
 *   the same knob; wire this to it when the pre-card disclosure lands.
 */
export const TRIAL_DAYS = 14;

/** Plain, urgency-free date the trial's first charge lands: TRIAL_DAYS from
 * `from` (default now). Same format as the Subscription screen's dates. */
export function firstChargeDate(from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + TRIAL_DAYS);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}
