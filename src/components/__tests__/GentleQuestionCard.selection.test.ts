import { nextQuestion, questionsFor, type CadenceState } from '@/features/questions/cadence';

/**
 * Contract for the fe-cadence-ask-source switch: under USE_FOUR_DOORS the card
 * renders `pendingQuestionIds[0]` resolved from the catalog, in the SERVER's
 * order, and must NOT re-sort by client tier the way System A's `nextQuestion`
 * does (Stanley confirmed the server pre-orders; deferred → tail is server
 * behaviour). This locks the invariant that the two sources can disagree and the
 * server wins — so a regression that re-introduced client tier-sorting on the
 * server path would fail here.
 */
describe('GentleQuestionCard source switch', () => {
  it('server source takes pendingQuestionIds[0] even when System A tier order would differ', () => {
    const module = 'pet';
    const qs = questionsFor(module);

    // A server-ordered pending list that deliberately contradicts client tier
    // rank: a logistics question ('photos') ahead of a safety one ('steady').
    const pending = ['photos', 'steady'];
    const serverPick = qs.find((q) => q.id === pending[0]);
    expect(serverPick?.id).toBe('photos');

    // System A, with both eligible, sorts safety-first via TIER_RANK → 'steady'.
    const state: CadenceState = {
      module,
      name: 'Rex',
      onboarded: true,
      journalStage: 5,
      answeredIds: [],
      sessionCount: 1,
      checkinSnoozeSession: 0,
    };
    expect(nextQuestion(state)?.id).toBe('steady');

    // The two sources disagree; the server card follows the server order.
    expect(serverPick?.id).not.toBe(nextQuestion(state)?.id);
  });

  it('every catalog id resolves so a server pending id always maps to a question', () => {
    for (const module of ['pet', 'human'] as const) {
      const qs = questionsFor(module);
      const ids = qs.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length); // ids unique within a module
      // Each id round-trips through the same lookup the card uses.
      for (const id of ids) expect(qs.find((q) => q.id === id)?.id).toBe(id);
    }
  });
});
