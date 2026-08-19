import { apiClient } from '@/lib/http';
import type { Entitlement } from '@/features/auth/types';

export interface SubscriptionStatus {
  entitlement: Entitlement;
  /** Trial end date (plain), when on a trial. No countdown, no urgency. */
  trialEndsOn?: string;
  price?: string;
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

/** Mock subscription — used offline / in tests. The real entitlement lives on
 * the backend (RevenueCat / Stripe receipts validated server-side). */
export class MockSubscriptionService implements SubscriptionService {
  async getStatus(): Promise<SubscriptionStatus> {
    return { entitlement: 'trial_active', trialEndsOn: plusDays(9), price: '$8.99 / month' };
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
}

/**
 * Real billing over the shared `apiClient`. Mirrors QuietRoom's billing routes
 * (all under `/account`):
 *  - GET  /account/subscription          → SubscriptionStatus
 *  - POST /account/subscription/restore  → { entitlement }
 *  - POST /account/license               → { entitlement, sponsor_organization? }
 *  - POST /account/deletion              → { deletion_scheduled_at }
 *  - DELETE /account/deletion
 */
export class ApiSubscriptionService implements SubscriptionService {
  async getStatus(): Promise<SubscriptionStatus> {
    const r = await apiClient.get<{
      entitlement: Entitlement;
      trial_ends_on?: string | null;
      price?: string | null;
    }>('/account/subscription');
    return {
      entitlement: r.entitlement,
      trialEndsOn: r.trial_ends_on ? formatDate(r.trial_ends_on) : undefined,
      price: r.price ?? undefined,
    };
  }

  async restore(): Promise<Entitlement> {
    const r = await apiClient.post<{ entitlement: Entitlement }>('/account/subscription/restore');
    return r.entitlement;
  }

  async redeemLicense(code: string): Promise<LicenseRedeemResult> {
    const r = await apiClient.post<{ entitlement: Entitlement; sponsor_organization?: string | null }>(
      '/account/license',
      { code },
    );
    return { entitlement: r.entitlement, sponsorOrganization: r.sponsor_organization ?? undefined };
  }

  async scheduleDeletion(confirmEmail: string): Promise<{ deletesOn: string }> {
    const r = await apiClient.post<{ deletion_scheduled_at: string }>('/account/deletion', {
      confirm_email: confirmEmail,
    });
    return { deletesOn: formatDate(r.deletion_scheduled_at) };
  }

  async cancelDeletion(): Promise<void> {
    await apiClient.delete('/account/deletion');
  }
}
