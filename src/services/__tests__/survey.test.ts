import { gateAnswersToSurvey } from '@/services/survey';
import type { GateAnswers } from '@/features/auth/types';

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
