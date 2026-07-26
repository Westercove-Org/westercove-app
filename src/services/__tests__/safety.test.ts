import {
  MockSafetyService,
  SafetyLevel,
  setSafetyOverride,
} from '@/services/safety';

describe('MockSafetyService.classify', () => {
  const svc = new MockSafetyService();

  afterEach(() => setSafetyOverride(null));

  it('returns Normal for ordinary grief text', () => {
    expect(svc.classify('I miss him so much today').level).toBe(SafetyLevel.Normal);
  });

  it('routes elevated-distress language to Level 2', () => {
    expect(svc.classify('I feel so worthless lately').level).toBe(
      SafetyLevel.Elevated,
    );
  });

  it('routes high-risk language to Level 3', () => {
    expect(svc.classify('I feel hopeless and cannot go on').level).toBe(
      SafetyLevel.High,
    );
  });

  it('routes critical language to Level 4', () => {
    expect(svc.classify('I want to die').level).toBe(SafetyLevel.Critical);
  });

  it('over-responds: the dev override forces a level regardless of text', () => {
    setSafetyOverride(SafetyLevel.Critical);
    expect(svc.classify('a perfectly calm sentence').level).toBe(
      SafetyLevel.Critical,
    );
  });
});
