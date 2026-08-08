import { QUESTION_INTERVAL_MS } from '@/constants/questions';
import { nextHomeQuestion } from '@/features/questions/questionsStore';

// Default session mode is human (no session) → DAYS_HUMAN buckets.
describe('nextHomeQuestion (Home gentle-question gating)', () => {
  it('returns nothing before any talk-time is accumulated', () => {
    expect(nextHomeQuestion(0, {}, [])).toBeNull();
  });

  it('surfaces a text question once a Day is unlocked', () => {
    const q = nextHomeQuestion(QUESTION_INTERVAL_MS, {}, []);
    expect(q).not.toBeNull();
    expect(q?.kind).toBe('text');
  });

  it('advances past answered and skipped questions', () => {
    const first = nextHomeQuestion(QUESTION_INTERVAL_MS, {}, [])!;
    const afterAnswer = nextHomeQuestion(QUESTION_INTERVAL_MS, { [first.id]: 'x' }, []);
    // Still within Day 1 there may be another text question, but never the same one.
    expect(afterAnswer?.id).not.toBe(first.id);

    const afterSkip = nextHomeQuestion(QUESTION_INTERVAL_MS, {}, [first.id]);
    expect(afterSkip?.id).not.toBe(first.id);
  });
});
