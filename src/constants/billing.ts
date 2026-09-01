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

/** Format the server's first_charge_date for display. The value is a calendar
 * DATE; any time/zone on it is noise. We pull the leading YYYY-MM-DD — identical
 * across every shape the server may send ('2026-09-15', '2026-09-15T00:00:00',
 * '2026-09-15T00:00:00Z') — and format it in UTC, so the device timezone can
 * never shift it to the previous/next day. (Formatting the raw value in local
 * time renders the day before for users west of UTC on a bare or Z-suffixed
 * date — an off-by-one charge date.) This is the same parse-as-UTC rule the
 * Settings `trial_end` handling follows. A non-date display string is rendered
 * as-is; we never invent a date. */
export function formatFirstChargeDate(serverValue: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(serverValue);
  if (!m) return serverValue;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
