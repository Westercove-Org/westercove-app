import { apiClient } from '@/lib/http';
import type { Entitlement } from '@/features/auth/types';

export interface SubscriptionStatus {
  entitlement: Entitlement;
  /** Trial end date (plain), when on a trial. No countdown, no urgency. */
  trialEndsOn?: string;
  price?: string;
  /** Whole days left on the Stripe trial, when `stripe.status === 'trialing'`.
   * Stated plainly ("N days left"), never as an urgent countdown. */
  trialDaysRemaining?: number;
  /** The Stripe trial's end date (plain), for the same trialing state. */
  stripeTrialEndsOn?: string;
  /** Raw Stripe subscription status (trialing|active|past_due|canceled|…), when
   * the user has a Stripe subscription. Absent for org-code/license users. */
  stripeStatus?: string;
  /** The current period end (plain date), i.e. the next renewal — or, on a
   * subscription set to cancel, the date access ends. */
  renewsOn?: string;
  /** True when the subscription is set to end at the period end (cancel pending). */
  cancelAtPeriodEnd?: boolean;
}

export interface LicenseRedeemResult {
  entitlement: Entitlement;
  sponsorOrganization?: string;
}

export interface SubscriptionService {
  /** Current entitlement + trial/price, from the backend (source of truth). */
  getStatus(): Promise<SubscriptionStatus>;
  restore(): Promise<Entitlement>;
  /** Redeem a sponsor license code → the entitlement it grants. */
  redeemLicense(code: string): Promise<LicenseRedeemResult>;
  /** Schedule deletion with a 30-day reversible grace period. */
  scheduleDeletion(confirmEmail: string): Promise<{ deletesOn: string }>;
  cancelDeletion(): Promise<void>;
  /** Mint a Stripe Customer Portal session and return its URL. The app opens it
   * so update-card / cancel / invoices happen on Stripe's hosted page — card
   * data never touches the app. Throws when the portal is unavailable (no Stripe
   * customer, or the portal is not configured — it's TEST-mode only for now). */
  createPortalSession(): Promise<{ url: string }>;
}

/** Format an ISO datetime (or day offset) as a plain, urgency-free date. */
function formatDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function plusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return formatDate(d.toISOString());
}

/** Parse a datetime AS UTC. The server sends `stripe.trial_end` as a naive-UTC
 * ISO string with no 'Z'/offset (e.g. "2026-09-15T00:00:00"); reading it in the
 * device's local time would shift the day and the remaining-days count by the
 * user's timezone offset (same class of bug as #74). Append 'Z' when absent. */
function parseUtc(iso: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`);
}

/** Whole days from now until `iso` (parsed as UTC), floored at 0. Rounds up so a
 * partial day still reads as a day left, until the trial actually ends. */
function daysRemainingUtc(iso: string): number {
  const ms = parseUtc(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** Format a naive-UTC datetime as a plain date, in UTC (not the device zone), so
 * the day cannot shift by the user's timezone (#74 rule). */
function formatUtcDate(iso: string): string {
  return parseUtc(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Mock subscription — used offline / in tests. The real entitlement lives on
 * the backend (RevenueCat / Stripe receipts validated server-side). */
export class MockSubscriptionService implements SubscriptionService {
  async getStatus(): Promise<SubscriptionStatus> {
    return {
      entitlement: 'trial_active',
      trialEndsOn: plusDays(9),
      price: '$8.99 / month',
      trialDaysRemaining: 9,
      stripeTrialEndsOn: plusDays(9),
    };
  }

  async restore(): Promise<Entitlement> {
    return 'active_monthly';
  }

  async redeemLicense(_code: string): Promise<LicenseRedeemResult> {
    return { entitlement: 'license_active', sponsorOrganization: 'Westercove Care' };
  }

  async scheduleDeletion(_confirmEmail: string): Promise<{ deletesOn: string }> {
    return { deletesOn: plusDays(30) };
  }

  async cancelDeletion(): Promise<void> {}

  async createPortalSession(): Promise<{ url: string }> {
    return { url: 'https://billing.stripe.com/p/session/test_mock' };
  }
}

/**
 * Real billing over the shared `apiClient`. Mirrors QuietRoom's billing routes
 * (all under `/api/account` — namespaced so the bare /account SPA route isn't
 * captured by the backend on a hard refresh, BUG-C):
 *  - GET  /api/account/subscription          → SubscriptionStatus
 *  - POST /api/account/subscription/restore  → { entitlement }
 *  - POST /api/account/license               → { entitlement, sponsor_organization? }
 *  - POST /api/account/deletion              → { deletion_scheduled_at }
 *  - DELETE /api/account/deletion
 */
export class ApiSubscriptionService implements SubscriptionService {
  async getStatus(): Promise<SubscriptionStatus> {
    const r = await apiClient.get<{
      entitlement: Entitlement;
      trial_ends_on?: string | null;
      price?: string | null;
      // Nested Stripe billing state (#126). Null when the user has no Stripe
      // customer (org-code/legacy) or Stripe is unreachable. `trial_end` is a
      // naive-UTC ISO string.
      stripe?: {
        status?: string;
        trial_end?: string | null;
        current_period_end?: string | null;
        cancel_at_period_end?: boolean;
      } | null;
    }>('/api/account/subscription');
    const s = r.stripe;
    const trialEnd = s?.status === 'trialing' && s.trial_end ? s.trial_end : undefined;
    return {
      entitlement: r.entitlement,
      trialEndsOn: r.trial_ends_on ? formatDate(r.trial_ends_on) : undefined,
      price: r.price ?? undefined,
      trialDaysRemaining: trialEnd ? daysRemainingUtc(trialEnd) : undefined,
      stripeTrialEndsOn: trialEnd ? formatUtcDate(trialEnd) : undefined,
      stripeStatus: s?.status,
      renewsOn: s?.current_period_end ? formatUtcDate(s.current_period_end) : undefined,
      cancelAtPeriodEnd: s?.cancel_at_period_end,
    };
  }

  async createPortalSession(): Promise<{ url: string }> {
    // Route confirmed against the merged endpoint (Stanley #126, account.py:249):
    // POST /api/account/billing-portal, no body (return_url is server-side),
    // response { url }. 404 (no billing profile) / 503 (payments off) / 502
    // (Stripe error / portal not configured) all surface as "portal unavailable".
    const r = await apiClient.post<{ url?: string }>('/api/account/billing-portal');
    if (!r.url) throw new Error('No portal URL returned');
    return { url: r.url };
  }

  async restore(): Promise<Entitlement> {
    const r = await apiClient.post<{ entitlement: Entitlement }>('/api/account/subscription/restore');
    return r.entitlement;
  }

  async redeemLicense(code: string): Promise<LicenseRedeemResult> {
    const r = await apiClient.post<{ entitlement: Entitlement; sponsor_organization?: string | null }>(
      '/api/account/license',
      { code },
    );
    return { entitlement: r.entitlement, sponsorOrganization: r.sponsor_organization ?? undefined };
  }

  async scheduleDeletion(confirmEmail: string): Promise<{ deletesOn: string }> {
    const r = await apiClient.post<{ deletion_scheduled_at: string }>('/api/account/deletion', {
      confirm_email: confirmEmail,
    });
    return { deletesOn: formatDate(r.deletion_scheduled_at) };
  }

  async cancelDeletion(): Promise<void> {
    await apiClient.delete('/api/account/deletion');
  }
}
