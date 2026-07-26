import { DayZeroGate } from '@/features/auth/DayZeroGate';

/** The day-zero gate. Nav is hidden for the duration (this route is outside the tab shell). */
export default function GateRoute() {
  return <DayZeroGate />;
}
