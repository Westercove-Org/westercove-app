/**
 * Consumer trial parameters (nt-billing-trial-fe).
 *
 * PRICE and the FIRST-CHARGE DATE are server-owned and fetched live from the
 * pre-auth pricing endpoint (GET /auth/signup/pricing, services.signup.getPricing).
 * Never hardcode a price (Stripe test vs live differ) or compute the charge date
 * from the device clock (a wrong/mis-timezoned clock would misstate when money
 * leaves). This module holds only stable, non-money copy constants + a formatter.
 *
 * TRIAL_DAYS: 14 — confirmed against the trial backend (#127). Used only as a
 * last-resort length for copy when the pricing endpoint is unavailable; the
 * endpoint's `trialDays` wins whenever we have it.
 */
export const TRIAL_DAYS = 14;

/** Format the server's first_charge_date for display. If it is an ISO datetime,
 * render it as a plain date; if the server already sent a display string, render
 * it as-is. Never invents a date — only formats what the server returned. */
export function formatFirstChargeDate(serverValue: string): string {
  const d = new Date(serverValue);
  return isNaN(d.getTime())
    ? serverValue
    : d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}
