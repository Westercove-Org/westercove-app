const mockPost = jest.fn();
jest.mock('@/lib/http', () => ({ apiClient: { post: (...a: unknown[]) => mockPost(...a) } }));

import {
  ApiSafetyService,
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
    expect(svc.classify('I feel so worthless lately').level).toBe(SafetyLevel.Elevated);
  });

  it('routes high-risk language to Level 3', () => {
    expect(svc.classify('I feel hopeless and cannot go on').level).toBe(SafetyLevel.High);
  });

  it('routes critical language to Level 4', () => {
    expect(svc.classify('I want to die').level).toBe(SafetyLevel.Critical);
  });

  it('over-responds: the dev override forces a level regardless of text', () => {
    setSafetyOverride(SafetyLevel.Critical);
    expect(svc.classify('a perfectly calm sentence').level).toBe(SafetyLevel.Critical);
  });
});

describe('ApiSafetyService.classifyRemote', () => {
  const svc = new ApiSafetyService();

  beforeEach(() => mockPost.mockReset());
  afterEach(() => setSafetyOverride(null));

  it('maps the backend crisis tier to the app level', async () => {
    mockPost.mockResolvedValue({ tier: 'tier_2', crisis: true, categories: ['crisis_signal'] });
    const res = await svc.classifyRemote('an ordinary-looking sentence');
    expect(mockPost).toHaveBeenCalledWith('/safety/classify', {
      text: 'an ordinary-looking sentence',
    });
    expect(res.level).toBe(SafetyLevel.High);
  });

  it('never downgrades below the local pre-flight (fail-safe)', async () => {
    // Backend says calm, but the local keyword pass caught critical language.
    mockPost.mockResolvedValue({ tier: 'none', crisis: false, categories: [] });
    const res = await svc.classifyRemote('I want to die');
    expect(res.level).toBe(SafetyLevel.Critical);
  });

  it('falls back to the local pre-flight when the backend is unreachable', async () => {
    mockPost.mockRejectedValue(new Error('network'));
    const res = await svc.classifyRemote('I feel hopeless and cannot go on');
    expect(res.level).toBe(SafetyLevel.High);
  });

  it('respects the dev override and skips the backend', async () => {
    setSafetyOverride(SafetyLevel.Elevated);
    const res = await svc.classifyRemote('anything at all');
    expect(res.level).toBe(SafetyLevel.Elevated);
    expect(mockPost).not.toHaveBeenCalled();
  });
});
