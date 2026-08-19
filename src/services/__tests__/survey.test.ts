const mockGet = jest.fn();
const mockPatch = jest.fn();
jest.mock('@/lib/http', () => ({
  apiClient: { get: (...a: unknown[]) => mockGet(...a), patch: (...a: unknown[]) => mockPatch(...a), post: jest.fn() },
}));

import { ApiSurveyService, gateAnswersToSurvey } from '@/services/survey';
import type { GateAnswers } from '@/features/auth/types';

describe('ApiSurveyService profile answers', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPatch.mockReset();
  });

  it('reads a profile, mapping snake_case → camelCase with defaults', async () => {
    mockGet.mockResolvedValue({ id: 3, display_name: 'Alex', answers: { user_name: 'Sam' } });
    const res = await new ApiSurveyService().getProfileAnswers(3);

    expect(mockGet).toHaveBeenCalledWith('/survey/profiles/3');
    expect(res).toEqual({
      id: 3,
      displayName: 'Alex',
      answers: { user_name: 'Sam' },
      generatedPrompt: undefined,
      promptStatus: 'ready',
      promptError: undefined,
    });
  });

  it('patches profile answers (merge) and returns the mapped result', async () => {
    mockPatch.mockResolvedValue({ id: 3, answers: { user_name: 'Samuel' }, prompt_status: 'pending' });
    const res = await new ApiSurveyService().updateProfileAnswers(3, { user_name: 'Samuel' });

    expect(mockPatch).toHaveBeenCalledWith('/survey/profiles/3/answers', { answers: { user_name: 'Samuel' } });
    expect(res.answers).toEqual({ user_name: 'Samuel' });
    expect(res.promptStatus).toBe('pending');
  });
});

describe('gateAnswersToSurvey', () => {
  it('maps a full human gate to backend question ids', () => {
    const answers: GateAnswers = {
      mode: 'human',
      callName: 'Sam',
      lovedOneName: 'Lily',
      relationship: 'My sibling',
      tone: 'Gentle and warm',
      skipped: [],
    };

    expect(gateAnswersToSurvey(answers)).toEqual({
      user_name: 'Sam',
      full_name: 'Lily',
      relationship: 'sibling', // leading "My " stripped
    });
  });

  it('maps the pet branch, sending the pet relationship value + pet ids', () => {
    const answers: GateAnswers = {
      mode: 'pet',
      callName: 'Sam',
      lovedOneName: 'Rex',
      relationship: 'My pet or animal companion',
      species: 'Dog',
      breed: 'Labrador',
      skipped: [],
    };

    expect(gateAnswersToSurvey(answers)).toEqual({
      user_name: 'Sam',
      pet_name: 'Rex',
      relationship: 'pet or animal companion',
      pet_species: 'Dog',
      pet_breed: 'Labrador',
    });
  });

  it('omits skipped steps and empty/whitespace answers (partial submit)', () => {
    const answers: GateAnswers = {
      mode: 'human',
      callName: 'Sam',
      lovedOneName: '   ',
      relationship: 'My friend',
      skipped: ['relationship'],
    };

    // lovedOneName is whitespace-only → dropped; relationship skipped → dropped.
    expect(gateAnswersToSurvey(answers)).toEqual({ user_name: 'Sam' });
  });

  it('drops pet-only fields when in human mode', () => {
    const answers: GateAnswers = {
      mode: 'human',
      callName: 'Sam',
      species: 'Dog',
      breed: 'Labrador',
      skipped: [],
    };

    expect(gateAnswersToSurvey(answers)).toEqual({ user_name: 'Sam' });
  });
});
