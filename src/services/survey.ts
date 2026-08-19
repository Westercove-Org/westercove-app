import { apiClient } from '@/lib/http';
import type { GateAnswers } from '@/features/auth/types';

/** Backend value that selects the pet branch of the survey (see QuietRoom
 * `_PET_RELATIONSHIP`). The gate's `mode` maps onto this relationship answer. */
const PET_RELATIONSHIP = 'pet or animal companion';

/** Response from `POST /survey/submit` (202 Accepted). The prompt is generated
 * asynchronously; callers poll `/survey/profiles/{id}/prompt-status` later. */
export interface SurveySubmitResult {
  status: 'pending' | 'ready' | 'failed';
  profileId: number;
}

export interface SurveyService {
  /** Submit the day-zero gate answers (partial allowed). */
  submitGate(answers: GateAnswers): Promise<SurveySubmitResult>;
}

/**
 * Map the app's day-zero `GateAnswers` onto the backend survey question ids
 * (QuietRoom `SURVEY_STEPS`). Partial by design: a field that is empty, or whose
 * gate step the user skipped, is omitted so the backend keeps its default.
 *
 * - `callName`     → `user_name`
 * - `mode`/`relationship` → `relationship` (pet mode sends the pet value)
 * - `lovedOneName` → `full_name` (human) / `pet_name` (pet)
 * - `species`      → `pet_species`
 * - `breed`        → `pet_breed`
 */
export function gateAnswersToSurvey(answers: GateAnswers): Record<string, string> {
  const isPet = answers.mode === 'pet';
  const skipped = new Set(answers.skipped);
  const out: Record<string, string> = {};

  const put = (step: string, id: string, value: string | undefined) => {
    const v = value?.trim();
    if (v && !skipped.has(step)) out[id] = v;
  };

  put('callName', 'user_name', answers.callName);
  put('lovedOneName', isPet ? 'pet_name' : 'full_name', answers.lovedOneName);

  // Relationship is required by the backend and drives the human/pet branch.
  // Pet mode always sends the pet value; otherwise send the chosen relationship,
  // stripped of the leading "My "/"A " the labels carry for display.
  if (!skipped.has('relationship')) {
    if (isPet) {
      out.relationship = PET_RELATIONSHIP;
    } else {
      const rel = answers.relationship?.trim().replace(/^(my|a|an)\s+/i, '');
      if (rel) out.relationship = rel;
    }
  }

  put('species', 'pet_species', isPet ? answers.species : undefined);
  put('breed', 'pet_breed', isPet ? answers.breed : undefined);

  return out;
}

/**
 * Real survey submission over the app HTTP client (`apiClient`), which attaches
 * the bearer token and routes 401s centrally. `profile_name` labels the saved
 * companion with the loved one's name.
 */
export class ApiSurveyService implements SurveyService {
  async submitGate(answers: GateAnswers): Promise<SurveySubmitResult> {
    const res = await apiClient.post<{
      status: SurveySubmitResult['status'];
      profile_id: number;
    }>('/survey/submit', {
      answers: gateAnswersToSurvey(answers),
      profile_name: answers.lovedOneName?.trim() || undefined,
    });
    return { status: res.status, profileId: res.profile_id };
  }
}
