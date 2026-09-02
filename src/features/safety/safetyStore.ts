import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { scopedStorage } from '@/features/profile/activeProfile';
import type { CompanionSafety, SafetyResources, SafetyTier } from '@/services/chat';

/**
 * The crisis context the backend last reported for this profile — the ratcheted
 * tier and the resource card it built. The global crisis surfaces (Support Mode,
 * Crisis interface) and the inline resource card read it, so the user sees the
 * backend's actual 988/professional resources rather than only static copy.
 *
 * Persisted per-profile so a reload keeps the crisis context (and its support
 * surfaces) rather than resetting to `none`.
 *
 * ponytail: one profile-wide "latest crisis context", not per-session — the
 * crisis surfaces are global routes, so the latest is what they render.
 */
interface SafetyContextState {
  tier: SafetyTier;
  resources?: SafetyResources;
  /** Record server safety from a chat turn. Ignores an absent/`none` turn so it
   * never clears a standing crisis context (fail-safe toward showing help). */
  setFromServer: (safety?: CompanionSafety) => void;
  clear: () => void;
}

export const useSafetyStore = create<SafetyContextState>()(
  persist(
    (set) => ({
      tier: 'none',
      resources: undefined,
      setFromServer(safety) {
        if (!safety || safety.tier === 'none') return;
        set({ tier: safety.tier, resources: safety.resources ?? undefined });
      },
      clear() {
        set({ tier: 'none', resources: undefined });
      },
    }),
    {
      name: 'westercove.safety',
      storage: createJSONStorage(() => scopedStorage('safety')),
      partialize: (s) => ({ tier: s.tier, resources: s.resources }),
    },
  ),
);

/**
 * Re-point the crisis context to the active profile after a profile switch — a
 * cross-profile leak here is worse than #91's draft leak (one account's crisis
 * bleeding onto a different loved one). Like the journal draft, persist
 * .rehydrate() alone can't clear it: on a profile with no stored safety it reads
 * null and leaves the previous profile's tier/resources in place. So read the
 * (already re-pointed) scoped key first — reset to empty when absent, else
 * rehydrate the stored context.
 */
export async function reloadSafetyForActiveProfile(): Promise<void> {
  const raw = await scopedStorage('safety').getItem('safety');
  if (raw == null) {
    useSafetyStore.getState().clear();
  } else {
    await useSafetyStore.persist.rehydrate();
  }
}
