import { useRouter } from 'expo-router';

import { SafetyLevel, type SafetyAssessment } from '@/services/safety';

/**
 * Routes a safety assessment to the right surface: Level 4 → the full-screen
 * crisis interface, Level 3 → Support Mode. Level 2 is handled inline by the
 * caller (an appended resource card), and Level 1 does nothing. Used by the
 * compose flow in Phase 3.
 */
export function useSafetyRouter() {
  const router = useRouter();
  return (assessment: SafetyAssessment) => {
    if (assessment.level === SafetyLevel.Critical) router.push('/crisis');
    else if (assessment.level === SafetyLevel.High) router.push('/support-mode');
  };
}
