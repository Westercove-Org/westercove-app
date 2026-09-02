import { planLimitFrom } from '@/features/billing/planLimit';
import { HttpError } from '@/lib/http';

const err402 = (detail: unknown) => new HttpError(402, 'Payment Required', { detail });

describe('planLimitFrom (R-1b)', () => {
  it('parses a profile_limit_reached 402', () => {
    const limit = planLimitFrom(
      err402({ code: 'profile_limit_reached', tier: 'standard', limit: 1, message: 'Standard includes one profile.' }),
    );
    expect(limit).toEqual({
      code: 'profile_limit_reached',
      tier: 'standard',
      limit: 1,
      message: 'Standard includes one profile.',
    });
  });

  it('parses a chat_turn_cap_reached 402', () => {
    const limit = planLimitFrom(
      err402({ code: 'chat_turn_cap_reached', tier: 'standard', limit: 50, message: 'You have reached this period’s limit.' }),
    );
    expect(limit?.code).toBe('chat_turn_cap_reached');
    expect(limit?.message).toContain('limit');
  });

  it('defaults a missing/odd limit to 0 and a null tier through', () => {
    const limit = planLimitFrom(err402({ code: 'profile_limit_reached', message: 'msg' }));
    expect(limit).toEqual({ code: 'profile_limit_reached', tier: null, limit: 0, message: 'msg' });
  });

  it('is null for a non-402 error, an unknown code, or a missing message', () => {
    expect(planLimitFrom(new HttpError(429, 'Too Many', { detail: {} }))).toBeNull();
    expect(planLimitFrom(err402({ code: 'something_else', message: 'x' }))).toBeNull();
    expect(planLimitFrom(err402({ code: 'profile_limit_reached' }))).toBeNull();
    expect(planLimitFrom(new Error('plain'))).toBeNull();
  });
});
