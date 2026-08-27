import { apiClient } from '@/lib/http';

/**
 * Signup v2 (self-serve) over the shared `apiClient`. Same backend contract as
 * the retired QuietRoom SPA (QuietRoom/backend, unchanged):
 *  - POST /auth/signup/org-code        {email,password,code} → {status,email}
 *  - POST /auth/signup/payment/checkout {email}              → {pending_signup_id, checkout_url}
 *  - GET  /auth/signup/status/{id}                            → {status}
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
}

export interface OnboardingVerifyResult {
  /** Masked email to render on the set-password screen, e.g. "j••@example.com". */
  emailHint: string;
  /** ISO expiry of the single-use onboarding token. */
  expiresAt: string;
}

export interface SignupService {
  orgCode(input: { email: string; password: string; code: string }): Promise<OrgCodeSignupResult>;
  startPaymentCheckout(email: string): Promise<PaymentCheckoutResult>;
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

  async startPaymentCheckout(email: string): Promise<PaymentCheckoutResult> {
    const r = await apiClient.post<{ pending_signup_id: string; checkout_url: string | null }>(
      '/auth/signup/payment/checkout',
      { email },
    );
    return { pendingSignupId: r.pending_signup_id, checkoutUrl: r.checkout_url };
  }

  async getStatus(pendingSignupId: string): Promise<SignupStatusResult> {
    const r = await apiClient.get<{ status: string }>(
      `/auth/signup/status/${encodeURIComponent(pendingSignupId)}`,
    );
    return { status: r.status };
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
}
