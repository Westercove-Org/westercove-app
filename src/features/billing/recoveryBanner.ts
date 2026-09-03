import { create } from 'zustand';

import type { Entitlement } from '@/features/auth/types';

/**
 * Session-only dismissal for the grace/recovery banner (R-11). Deliberately NOT
 * persisted: a fresh launch shows it again, which is correct — the payment is
 * still lapsed until they fix it. Cleared automatically on relaunch.
 */
interface RecoveryBannerState {
  dismissed: boolean;
  dismiss: () => void;
  reset: () => void;
}

export const useRecoveryBannerStore = create<RecoveryBannerState>()((set) => ({
  dismissed: false,
  dismiss: () => set({ dismissed: true }),
  reset: () => set({ dismissed: false }),
}));

/**
 * The recovery banner shows while a failed payment can still be fixed and the
 * member hasn't dismissed it this session. That is `grace` (the recovery window,
 * when the emails fire and the member can still pay) and `lapsed` (window ended,
 * but paying still brings them back). Everything else — trialing, active,
 * sponsored — sees nothing.
 */
export function shouldShowRecoveryBanner(
  entitlement: Entitlement | undefined,
  dismissed: boolean,
): boolean {
  return (entitlement === 'grace' || entitlement === 'lapsed') && !dismissed;
}
