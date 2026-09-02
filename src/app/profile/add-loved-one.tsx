import { useRouter } from 'expo-router';
import { useState } from 'react';

import { StackScreen } from '@/components/StackScreen';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { FourDoorsGate } from '@/features/auth/FourDoorsGate';
import type { GateState } from '@/features/auth/fourDoorsModel';
import { useSessionStore } from '@/features/auth/sessionStore';
import type { PlanLimit } from '@/features/billing/planLimit';
import { useProfilesStore } from '@/features/profile/profilesStore';

/**
 * Add a second loved-one profile (sv7-premium-second-profile). Reuses the
 * onboarding 4-Doors intake in add mode: on success it creates + switches to
 * the new profile; on a plan cap (402) it renders the upgrade card — the surface
 * for `profile_limit_reached` (Standard = 1 profile, so a Standard member sees
 * the card here; Premium = 2). The server enforces the cap by tier.
 */
export default function AddLovedOneScreen() {
  const router = useRouter();
  const completeFourDoorsGate = useSessionStore((s) => s.completeFourDoorsGate);
  const [limit, setLimit] = useState<PlanLimit | null>(null);

  const onCreated = (profileId: number, answers: GateState) => {
    // Point the per-profile data stores at a fresh namespace + add the roster
    // entry; the current in-memory session stays as the account base so
    // completeFourDoorsGate inherits email/entitlement/entry-path, then writes
    // the new profile's session (with its own backend id + gate answers).
    useProfilesStore.getState().addProfile(answers.lovedOneName?.trim() ?? '');
    completeFourDoorsGate(profileId, answers);
    router.replace('/');
  };

  if (limit) {
    return (
      <StackScreen title="Add a loved one">
        <UpgradePrompt
          limit={limit}
          onSeePlans={() => router.push('/subscription')}
          onDismiss={() => router.back()}
        />
      </StackScreen>
    );
  }

  return <FourDoorsGate onCreated={onCreated} onPlanLimit={setLimit} />;
}
