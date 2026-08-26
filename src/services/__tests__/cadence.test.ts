const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('@/lib/http', () => ({
  apiClient: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
  },
}));

import { ApiCadenceService } from '@/services/cadence';

const wire = {
  profile_id: 7,
  current_stage: 2,
  stages_today: 1,
  is_first_session_consumed: true,
  stage_advanced_this_session: false,
  user_spoke_this_session: true,
  heavy_entry_this_session: false,
  session_journaling_seconds: 90,
  pending_question_ids: ['h-steady'],
  answered_question_ids: ['h-about', 'h-relationship'],
  skipped_question_ids: [],
  deferred_question_ids: ['h-photos'],
  asked_this_session_ids: ['h-steady'],
  responses_since_library_reference: 1,
  client_timezone: 'America/New_York',
};

describe('ApiCadenceService', () => {
  const svc = new ApiCadenceService();
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it('getState maps snake_case → camelCase', async () => {
    mockGet.mockResolvedValue(wire);
    const s = await svc.getState(7);
    expect(mockGet).toHaveBeenCalledWith('/profiles/7/cadence');
    expect(s.profileId).toBe(7);
    expect(s.currentStage).toBe(2);
    expect(s.userSpokeThisSession).toBe(true);
    expect(s.sessionJournalingSeconds).toBe(90);
    expect(s.pendingQuestionIds).toEqual(['h-steady']);
    expect(s.deferredQuestionIds).toEqual(['h-photos']);
    expect(s.responsesSinceLibraryReference).toBe(1);
    expect(s.clientTimezone).toBe('America/New_York');
  });

  it('reportEvent posts the event with a defaulted delta', async () => {
    mockPost.mockResolvedValue(wire);
    await svc.reportEvent(7, { event: 'user_spoke', clientTimezone: 'UTC', clientNow: 'now' });
    expect(mockPost).toHaveBeenCalledWith('/profiles/7/cadence:session-event', {
      event: 'user_spoke',
      journaling_seconds_delta: 0,
      client_timezone: 'UTC',
      client_now: 'now',
    });
  });

  it('journaling_tick carries the seconds delta', async () => {
    mockPost.mockResolvedValue(wire);
    await svc.reportEvent(7, { event: 'journaling_tick', journalingSecondsDelta: 60 });
    expect(mockPost.mock.calls[0][1]).toMatchObject({
      event: 'journaling_tick',
      journaling_seconds_delta: 60,
    });
  });

  it('defer/skip hit the colon action routes', async () => {
    mockPost.mockResolvedValue(wire);
    await svc.deferQuestion(7, 'h-photos');
    expect(mockPost).toHaveBeenCalledWith('/profiles/7/questions/h-photos:defer');
    await svc.skipQuestion(7, 'h-avoid');
    expect(mockPost).toHaveBeenCalledWith('/profiles/7/questions/h-avoid:skip');
  });
});
