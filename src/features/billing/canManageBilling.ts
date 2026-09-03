import type { Entitlement } from '@/features/auth/types';

/**
 * Who sees "Manage billing": any Stripe subscriber, PLUS anyone paying by
 * entitlement even without a stored Stripe status — members provisioned before
 * #124 pay but have no customer id, and must still be able to fix a card (they
 * hit the graceful portal-unavailable path). Hidden only for trial / org-code /
 * license users, who have no personal billing to manage.
 *
 * `grace` is included precisely for the no-stripeStatus member: a failed charge
 * puts them in grace, the recovery banner sends them here to fix their card, and
 * without this the card-fix path would be hidden — the banner would send them
 * somewhere that cannot help them.
 */
export function canManageBilling(
  entitlement: Entitlement | undefined,
  hasStripeStatus: boolean,
): boolean {
  return (
    hasStripeStatus ||
    entitlement === 'active_monthly' ||
    entitlement === 'active_annual' ||
    entitlement === 'grace' ||
    entitlement === 'lapsed'
  );
}
