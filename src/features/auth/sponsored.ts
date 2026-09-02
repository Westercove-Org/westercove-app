import type { Entitlement, EntryPath } from '@/features/auth/types';

/**
 * Whether the account is org-sponsored (a partner license), which drives the
 * sponsored membership variant (R-60): it shows only the org and coverage end
 * date and NEVER a price, plan grid, card, or cancel — one of the spec's
 * must-never-happen tests.
 *
 * Sponsorship is structural — how the account was created — so we key off the
 * partner entry path and the `license_active` entitlement the org-code signup
 * (Stanley #162) sets, not a transient billing state.
 */
export function isSponsoredAccount(entitlement: Entitlement, entryPath?: EntryPath): boolean {
  return entitlement === 'license_active' || entryPath === 'partner_license';
}
