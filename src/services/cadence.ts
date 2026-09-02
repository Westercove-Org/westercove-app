import { apiClient } from '@/lib/http';

/**
 * 4-Doors cadence service (BE-4). The **server** owns all stage/cadence math
 * (design doc §2/§5): the client reports raw signals and treats the returned
 * state as the source of truth. All routes are behind the backend USE_FOUR_DOORS
 * flag; the client only calls them when its own USE_FOUR_DOORS flag is on.
 */

/** A cadence session signal (`POST /profiles/{id}/cadence:session-event`). */
export type CadenceEvent = 'app_open' | 'journaling_tick' | 'user_spoke' | 'heavy_entry';

export interface SessionEventInput {
  event: CadenceEvent;
  /** Foreground writing seconds since the last tick (journaling_tick only). */
  journalingSecondsDelta?: number;
  clientTimezone?: string;
  /** ISO8601; accepted for forward-compat idempotency (server clock is authoritative). */
  clientNow?: string;
}

/** The profile's cadence/stage state (QuietRoom `CadenceStateResponse`). */
export interface CadenceState {
  profileId: number;
  currentStage: number;
  stagesToday: number;
  isFirstSessionConsumed: boolean;
  stageAdvancedThisSession: boolean;
  userSpokeThisSession: boolean;
  heavyEntryThisSession: boolean;
  sessionJournalingSeconds: number;
  pendingQuestionIds: string[];
  answeredQuestionIds: string[];
  skippedQuestionIds: string[];
  deferredQuestionIds: string[];
  askedThisSessionIds: string[];
  responsesSinceLibraryReference: number;
  clientTimezone: string | null;
}

/** The engine's authoritative next question, with its FULLY-RESOLVED prompt
 * (server substitutes the loved-one name and the cause-of-death wording). Its
 * `id` is the catalog id, the same space as `pendingQuestionIds` (normally
 * pendingQuestionIds[0]). Null when there is nothing to ask. */
export interface NextQuestion {
  id: string;
  stage: number;
  qtype: 'core' | 'optional';
  /** Ready to render as-is; never a template. */
  prompt: string;
  options: string[];
  safety: boolean;
  freeText: boolean;
}

export interface CadenceService {
  /** Launch reconciliation: the authoritative state for this profile. */
  getState(profileId: number): Promise<CadenceState>;
  /** The next question with its server-resolved prompt, or null when none.
   * 404s (flag off / profile not the caller's) surface as a thrown error — the
   * caller falls back to the local catalog prompt. */
  getNextQuestion(profileId: number): Promise<NextQuestion | null>;
  /** Report a raw session signal; returns the server-recomputed state. */
  reportEvent(profileId: number, input: SessionEventInput): Promise<CadenceState>;
  /** "Not now": re-surface the question in a later session. */
  deferQuestion(profileId: number, questionId: string): Promise<CadenceState>;
  /** "Skip this one": never re-ask. */
  skipQuestion(profileId: number, questionId: string): Promise<CadenceState>;
}

interface CadenceStateWire {
  profile_id: number;
  current_stage: number;
  stages_today: number;
  is_first_session_consumed: boolean;
  stage_advanced_this_session: boolean;
  user_spoke_this_session: boolean;
  heavy_entry_this_session: boolean;
  session_journaling_seconds: number;
  pending_question_ids: string[];
  answered_question_ids: string[];
  skipped_question_ids: string[];
  deferred_question_ids: string[];
  asked_this_session_ids: string[];
  responses_since_library_reference: number;
  client_timezone: string | null;
}

function toState(r: CadenceStateWire): CadenceState {
  return {
    profileId: r.profile_id,
    currentStage: r.current_stage,
    stagesToday: r.stages_today,
    isFirstSessionConsumed: r.is_first_session_consumed,
    stageAdvancedThisSession: r.stage_advanced_this_session,
    userSpokeThisSession: r.user_spoke_this_session,
    heavyEntryThisSession: r.heavy_entry_this_session,
    sessionJournalingSeconds: r.session_journaling_seconds,
    pendingQuestionIds: r.pending_question_ids,
    answeredQuestionIds: r.answered_question_ids,
    skippedQuestionIds: r.skipped_question_ids,
    deferredQuestionIds: r.deferred_question_ids,
    askedThisSessionIds: r.asked_this_session_ids,
    responsesSinceLibraryReference: r.responses_since_library_reference,
    clientTimezone: r.client_timezone,
  };
}

export class ApiCadenceService implements CadenceService {
  async getState(profileId: number): Promise<CadenceState> {
    return toState(await apiClient.get(`/profiles/${profileId}/cadence`));
  }

  async getNextQuestion(profileId: number): Promise<NextQuestion | null> {
    const r = await apiClient.get<{
      question: null | {
        id: string;
        stage: number;
        qtype: string;
        prompt: string;
        options: string[];
        safety: boolean;
        free_text: boolean;
      };
    }>(`/profiles/${profileId}/next-question`);
    const q = r.question;
    return q
      ? {
          id: q.id,
          stage: q.stage,
          qtype: q.qtype === 'optional' ? 'optional' : 'core',
          prompt: q.prompt,
          options: q.options,
          safety: q.safety,
          freeText: q.free_text,
        }
      : null;
  }

  async reportEvent(profileId: number, input: SessionEventInput): Promise<CadenceState> {
    return toState(
      await apiClient.post(`/profiles/${profileId}/cadence:session-event`, {
        event: input.event,
        journaling_seconds_delta: input.journalingSecondsDelta ?? 0,
        client_timezone: input.clientTimezone,
        client_now: input.clientNow,
      }),
    );
  }

  async deferQuestion(profileId: number, questionId: string): Promise<CadenceState> {
    return toState(await apiClient.post(`/profiles/${profileId}/questions/${questionId}:defer`));
  }

  async skipQuestion(profileId: number, questionId: string): Promise<CadenceState> {
    return toState(await apiClient.post(`/profiles/${profileId}/questions/${questionId}:skip`));
  }
}
