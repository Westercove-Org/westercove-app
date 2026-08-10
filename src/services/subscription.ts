import type { Entitlement } from '@/features/auth/types';

export interface SubscriptionStatus {
  entitlement: Entitlement;
  /** Trial end date (plain), when on a trial. No countdown, no urgency. */
  trialEndsOn?: string;
  price: string;
}

export interface SubscriptionService {
  getStatus(entitlement: Entitlement): SubscriptionStatus;
  restore(): Promise<Entitlement>;
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

  async scheduleDeletion(): Promise<{ deletesOn: string }> {
    return { deletesOn: plusDays(30) };
  }

  async cancelDeletion(): Promise<void> {}
}
