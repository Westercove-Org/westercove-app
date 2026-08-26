import { USE_FOUR_DOORS } from '@/constants/flags';
import { DayZeroGate } from '@/features/auth/DayZeroGate';
import { FourDoorsGate } from '@/features/auth/FourDoorsGate';

/** The onboarding gate. Nav is hidden for the duration (this route is outside the
 * tab shell). Behind USE_FOUR_DOORS: the new 4-Doors gate, else the flat day-zero
 * wizard (unchanged until the flag is flipped on in lockstep with the backend). */
export default function GateRoute() {
  return USE_FOUR_DOORS ? <FourDoorsGate /> : <DayZeroGate />;
}
