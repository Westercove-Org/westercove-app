import { apiClient } from '@/lib/http';

/**
 * Signup v2 (self-serve) over the shared `apiClient`. Same backend contract as
 * the retired QuietRoom SPA (QuietRoom/backend, unchanged):
 *  - POST /auth/signup/org-code        {email,password,code} → {status,email}
 *  - POST /auth/signup/payment/checkout {email,password}     → {pending_signup_id, checkout_url}
 *  - GET  /auth/signup/status/{id}                            → {status,email}
 *
 * Enumeration-safe: the entry endpoints return a generic 200 even when the
 * email already has an account (that user gets a "log in" email), so the UI
 * never reveals account existence — no 409 path, and a null checkout_url just
 * routes to a generic "check your email" screen.
 */

export interface OrgCodeSignupResult {
  /** e.g. "created_pending_verification" — user created, verify email sent. */
  status: string;
  email: string;
}

export interface PaymentCheckoutResult {
  pendingSignupId: string;
  /** Stripe Checkout URL to redirect to, OR null when the email already has an
   * account (enumeration-safe): show a generic check-email screen, no redirect. */
  checkoutUrl: string | null;
}

export interface SignupStatusResult {
  /** Poll while "awaiting_payment"; "expired" is terminal failure; any other
   * terminal value ("active", "created_pending_verification") = success. */
  status: string;
  /** Account email for the pending signup (sv2-bug7-be, PR #80). Non-null for a
   * real token; null for unknown/probed tokens (enumeration posture) or the rare
   * undecryptable row. Used to prefill + lock the email on the return screen and
   * to wire the resend button — never taken from the URL (PII). */
  email: string | null;
}

export interface OnboardingVerifyResult {
  /** Masked email to render on the set-password screen, e.g. "j••@example.com". */
  emailHint: string;
  /** ISO expiry of the single-use onboarding token. */
  expiresAt: string;
}

/** The two subscription plans, in fixed order (monthly first). */
export type PlanId = 'monthly' | 'yearly';

/** One selectable plan. `display` is a preformatted price string — render it
 * verbatim, never compute or format a price from `amount`. `amount`/`currency`/
 * `interval` are on the wire and typed honestly, but are metadata: nothing in
 * the UI renders them (that would be a computed price in disguise). */
export interface PlanOption {
  plan: PlanId;
  display: string;
  amount: number;
  currency: string;
  interval: string;
}

/** Trial pricing for the pre-card disclosure, from the Stripe-backed pre-auth
 * endpoint (no account exists yet). `plans` is monthly-first and always carries
 * BOTH plans on a 200 (a one-plan screen would misrepresent the choice, so the
 * server 503s if either is unavailable). `trialDays`/`firstChargeDate` are
 * plan-INDEPENDENT (the trial is set at checkout-session level) — render once,
 * never per-plan. `firstChargeDate` is server-computed (utcnow + trial), never
 * the device clock. On failure the endpoint 503s with no fallback by design —
 * the caller must then show no price and block card entry. */
export interface PricingResult {
  plans: PlanOption[];
  trialDays: number;
  firstChargeDate: string;
}

export interface SignupService {
  orgCode(input: { email: string; password: string; code: string }): Promise<OrgCodeSignupResult>;
  /** Trial pricing for the pre-card disclosure. Unauthenticated. Throws on 503
   * (no fallback price by design). */
  getPricing(): Promise<PricingResult>;
  /** Paid path: set the account password up front (Cognito) and start Stripe
   * checkout for the chosen plan. Mirrors org-code — the password is stored now;
   * the emailed link is verify-only. `checkout_url` null ⇒ email already
   * registered (enum-safe). The server maps `plan` to its own Stripe price id
   * (there is no price-id field) and defaults to monthly if omitted. */
  startPaymentCheckout(input: { email: string; password: string; plan: PlanId }): Promise<PaymentCheckoutResult>;
  getStatus(pendingSignupId: string): Promise<SignupStatusResult>;

  // Onboarding completion via single-use token from the emailed deep link
  // (Dwight's /auth/onboarding contract). Token is a URL path segment, never
  // typed by the user.
  /** Paid path: check the set-password token before rendering the form.
   * 410 if invalid/expired. */
  verifyOnboardingToken(token: string): Promise<OnboardingVerifyResult>;
  /** Paid path: set the Cognito password AND flip email_verified. 410
   * invalid/expired · 400 weak password · 409 already set up. */
  completeOnboarding(token: string, password: string): Promise<{ email: string }>;
  /** Org-code path: verify email only (user already has a password). 410
   * invalid/expired/consumed. */
  verifyEmailToken(token: string): Promise<{ email: string }>;
  /** Re-send the onboarding email (set-password or verify) for an email that
   * still needs setup. Enumeration-safe: always resolves (generic 200) whether
   * or not an account exists; the backend picks the right mail from Cognito
   * state. Rate-limited (429 via the shared onboarding limiter). */
  resendOnboardingEmail(email: string): Promise<void>;
}

/** Terminal-success test for a polled status. Defensive against the backend
 * status-name discrepancy: success = terminal and not "expired". Unknown tokens
 * return "expired" by design, so they fall through to the failure path. */
export function isSignupSuccessStatus(status: string): boolean {
  return status !== 'awaiting_payment' && status !== 'expired';
}

export class ApiSignupService implements SignupService {
  async orgCode(input: { email: string; password: string; code: string }): Promise<OrgCodeSignupResult> {
    const r = await apiClient.post<{ status: string; email: string }>('/auth/signup/org-code', {
      email: input.email,
      password: input.password,
      code: input.code,
    });
    return { status: r.status, email: r.email };
  }

  async startPaymentCheckout(input: { email: string; password: string; plan: PlanId }): Promise<PaymentCheckoutResult> {
    const r = await apiClient.post<{ pending_signup_id: string; checkout_url: string | null }>(
      '/auth/signup/payment/checkout',
      { email: input.email, password: input.password, plan: input.plan },
    );
    return { pendingSignupId: r.pending_signup_id, checkoutUrl: r.checkout_url };
  }

  async getStatus(pendingSignupId: string): Promise<SignupStatusResult> {
    const r = await apiClient.get<{ status: string; email?: string | null }>(
      `/auth/signup/status/${encodeURIComponent(pendingSignupId)}`,
    );
    // Tolerate the field being absent until PR #80 deploys to dev (missing == null).
    return { status: r.status, email: r.email ?? null };
  }

  async getPricing(): Promise<PricingResult> {
    const r = await apiClient.get<{
      plans?: { plan: string; display: string; amount: number; currency: string; interval: string }[];
      trial_days: number;
      first_charge_date: string;
    }>('/auth/signup/pricing');
    // Build against `plans` only. The response may temporarily also carry the old
    // flat top-level display/amount/... mirroring monthly (a compat shim for the
    // pre-selector app); it is being deleted, so it is ignored entirely here.
    const plans = (r.plans ?? []).filter(
      (p): p is PlanOption => p.plan === 'monthly' || p.plan === 'yearly',
    );
    // A 200 always carries both known plans. Anything less is malformed — block
    // the paid path (throw → caller shows no price), never render a partial
    // choice. Same posture as never guessing a fallback price.
    if (!plans.some((p) => p.plan === 'monthly') || !plans.some((p) => p.plan === 'yearly')) {
      throw new Error('pricing: expected both monthly and yearly plans');
    }
    return { plans, trialDays: r.trial_days, firstChargeDate: r.first_charge_date };
  }

  async verifyOnboardingToken(token: string): Promise<OnboardingVerifyResult> {
    const r = await apiClient.get<{ email_hint: string; expires_at: string }>(
      `/auth/onboarding/verify/${encodeURIComponent(token)}`,
    );
    return { emailHint: r.email_hint, expiresAt: r.expires_at };
  }

  async completeOnboarding(token: string, password: string): Promise<{ email: string }> {
    const r = await apiClient.post<{ email: string }>('/auth/onboarding/complete', {
      token,
      password,
    });
    return { email: r.email };
  }

  async verifyEmailToken(token: string): Promise<{ email: string }> {
    const r = await apiClient.post<{ email: string }>('/auth/onboarding/verify-email', { token });
    return { email: r.email };
  }

  async resendOnboardingEmail(email: string): Promise<void> {
    await apiClient.post('/auth/onboarding/resend', { email });
  }
}
