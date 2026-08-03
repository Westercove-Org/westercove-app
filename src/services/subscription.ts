import type { Entitlement } from '@/features/auth/types';

import { apiFetch } from './http';

export interface SubscriptionStatus {
  entitlement: Entitlement;
  /** Trial end date (plain), when on a trial. No countdown, no urgency. */
  trialEndsOn?: string;
  price: string;
}

export interface SubscriptionService {
  getStatus(entitlement: Entitlement): SubscriptionStatus;
  restore(): Promise<Entitlement>;
  /** Generate the full archive. Optionally exclude the protected Rage section. */
  exportArchive(opts: { includeRage: boolean }): Promise<{ ready: true }>;
  /** Schedule deletion with a 30-day reversible grace period. */
  scheduleDeletion(): Promise<{ deletesOn: string }>;
  cancelDeletion(): Promise<void>;
}

function plusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

/** Mock subscription — real impl uses RevenueCat (StoreKit / Play Billing) and
 * Stripe on web, with server-side receipt validation as the single source of truth. */
export class MockSubscriptionService implements SubscriptionService {
  getStatus(entitlement: Entitlement): SubscriptionStatus {
    return {
      entitlement,
      trialEndsOn: entitlement === 'trial_active' ? plusDays(9) : undefined,
      price: '$8.99 / month',
    };
  }

  async restore(): Promise<Entitlement> {
    return 'active_monthly';
  }

  async exportArchive(_opts: { includeRage: boolean }): Promise<{ ready: true }> {
    await new Promise((r) => setTimeout(r, 600));
    return { ready: true };
  }

  async scheduleDeletion(): Promise<{ deletesOn: string }> {
    return { deletesOn: plusDays(30) };
  }

  async cancelDeletion(): Promise<void> {}
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Real subscription against the QuietRoom backend (account endpoints).
 * getStatus + restore stay client-side: entitlement is the app's source of
 * truth (backend /account carries no plan), and restore is a RevenueCat/
 * StoreKit call that lands in a later pass — inherited from the mock.
 */
export class ApiSubscriptionService extends MockSubscriptionService {
  async exportArchive(_opts: { includeRage: boolean }): Promise<{ ready: true }> {
    // Backend export is whole-account; the app's "Rage section" exclusion has
    // no server concept yet, so includeRage is intentionally not sent.
    await apiFetch('/account/export', { method: 'POST' });
    return { ready: true };
  }

  async scheduleDeletion(): Promise<{ deletesOn: string }> {
    const { email } = await apiFetch<{ email: string }>('/account');
    const { deletion_scheduled_at } = await apiFetch<{ deletion_scheduled_at: string }>(
      '/account/deletion',
      { method: 'POST', body: { confirm_email: email } },
    );
    return { deletesOn: formatDate(deletion_scheduled_at) };
  }

  async cancelDeletion(): Promise<void> {
    await apiFetch('/account/deletion', { method: 'DELETE' });
  }
}
