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

/** A profile's stored survey answers (QuietRoom `ProfileSurveyDataResponse`).
 * `answers` is keyed by survey question id (e.g. `user_name`, `relationship`). */
export interface ProfileSurveyData {
  id: number;
  displayName?: string;
  answers: Record<string, string>;
  generatedPrompt?: string;
  promptStatus: 'pending' | 'ready' | 'failed';
  promptError?: string;
}

/** One row of `GET /survey/profiles` (QuietRoom `ProfileSummary`). */
export interface ProfileSummary {
  id: number;
  name: string;
  promptStatus: 'pending' | 'ready' | 'failed';
}

export interface SurveyService {
  /** Submit the day-zero gate answers (partial allowed). */
  submitGate(answers: GateAnswers): Promise<SurveySubmitResult>;
  /** List the signed-in user's saved survey profiles (empty when none yet). */
  listProfiles(): Promise<ProfileSummary[]>;
  /** Read a profile's stored survey answers (backs the What I Know page). */
  getProfileAnswers(profileId: number): Promise<ProfileSurveyData>;
  /** Merge answer edits into a profile; omitted keys are kept server-side. */
  updateProfileAnswers(
    profileId: number,
    answers: Record<string, string>,
  ): Promise<ProfileSurveyData>;
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

  async listProfiles(): Promise<ProfileSummary[]> {
    const rows = await apiClient.get<
      Array<{ id: number; name: string; prompt_status?: ProfileSummary['promptStatus'] }>
    >('/survey/profiles');
    return rows.map((r) => ({ id: r.id, name: r.name, promptStatus: r.prompt_status ?? 'ready' }));
  }

  async getProfileAnswers(profileId: number): Promise<ProfileSurveyData> {
    return toProfileData(await apiClient.get(`/survey/profiles/${profileId}`));
  }

  async updateProfileAnswers(
    profileId: number,
    answers: Record<string, string>,
  ): Promise<ProfileSurveyData> {
    return toProfileData(
      await apiClient.patch(`/survey/profiles/${profileId}/answers`, { answers }),
    );
  }
}

/** Map the backend `ProfileSurveyDataResponse` (snake_case) onto camelCase. */
function toProfileData(r: {
  id: number;
  display_name?: string | null;
  answers: Record<string, string>;
  generated_prompt?: string | null;
  prompt_status?: ProfileSurveyData['promptStatus'];
  prompt_error?: string | null;
}): ProfileSurveyData {
  return {
    id: r.id,
    displayName: r.display_name ?? undefined,
    answers: r.answers ?? {},
    generatedPrompt: r.generated_prompt ?? undefined,
    promptStatus: r.prompt_status ?? 'ready',
    promptError: r.prompt_error ?? undefined,
  };
}
