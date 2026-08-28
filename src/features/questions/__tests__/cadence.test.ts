import {
  hasCheckin,
  MAX_STAGE,
  nextQuestion,
  PET_QUESTIONS,
  type CadenceState,
} from '@/features/questions/cadence';

const base = (over: Partial<CadenceState> = {}): CadenceState => ({
  module: 'pet',
  name: 'Biscuit',
  onboarded: true,
  journalStage: 0,
  answeredIds: [],
  sessionCount: 1,
  checkinSnoozeSession: 0,
  ...over,
});

const answeredExcept = (exclude: string[]) =>
  PET_QUESTIONS.filter((q) => !exclude.includes(q.id)).map((q) => q.id);

describe('cadence', () => {
  it('surfaces the first warm opener at stage 0 (pet)', () => {
    expect(nextQuestion(base())?.id).toBe('about');
  });

  it('suppresses the whole check-in when there is no name (Door-3 / pre-gate)', () => {
    // No loved-one name → no one to ask about → no fabricated/empty name.
    expect(nextQuestion(base({ name: '' }))).toBeNull();
    expect(nextQuestion(base({ name: '   ' }))).toBeNull();
    expect(hasCheckin(base({ name: '' }))).toBe(false);
  });

  it('prioritises safety questions once they unlock', () => {
    // At stage 2 the safety pair unlocks; safety outranks the still-unanswered warm openers.
    expect(nextQuestion(base({ journalStage: 2 }))?.tier).toBe('safety');
  });

  it('gates questions by stage (nothing above the current stage)', () => {
    const q = nextQuestion(base());
    expect(q?.thresholdStage).toBeLessThanOrEqual(0);
  });

  it('faith-tradition unlocks only after faith language is chosen', () => {
    const answered = answeredExcept(['faith-tradition']);
    expect(nextQuestion(base({ journalStage: MAX_STAGE, answeredIds: answered }))).toBeNull();
    expect(
      nextQuestion(
        base({
          journalStage: MAX_STAGE,
          answeredIds: answered,
          faithLanguage: 'Yes, I would like that',
        }),
      )?.id,
    ).toBe('faith-tradition');
  });

  it('hasCheckin is false when snoozed this session or not onboarded', () => {
    expect(hasCheckin(base({ checkinSnoozeSession: 1 }))).toBe(false);
    expect(hasCheckin(base({ onboarded: false }))).toBe(false);
    expect(hasCheckin(base())).toBe(true);
  });
});
