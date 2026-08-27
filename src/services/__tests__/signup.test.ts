const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('@/lib/http', () => ({
  apiClient: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
  },
}));

import { ApiSignupService, isSignupSuccessStatus } from '@/services/signup';

describe('ApiSignupService', () => {
  const svc = new ApiSignupService();
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it('orgCode POSTs email/password/code and returns status + email', async () => {
    mockPost.mockResolvedValue({ status: 'created_pending_verification', email: 'a@b.co' });
    const r = await svc.orgCode({ email: 'a@b.co', password: 'hunter2hunter2', code: 'ACME-1' });
    expect(mockPost).toHaveBeenCalledWith('/auth/signup/org-code', {
      email: 'a@b.co',
      password: 'hunter2hunter2',
      code: 'ACME-1',
    });
    expect(r).toEqual({ status: 'created_pending_verification', email: 'a@b.co' });
  });

  it('startPaymentCheckout POSTs email only and maps snake_case to camelCase', async () => {
    mockPost.mockResolvedValue({ pending_signup_id: 'tok_1', checkout_url: 'https://stripe/x' });
    const r = await svc.startPaymentCheckout('a@b.co');
    expect(mockPost).toHaveBeenCalledWith('/auth/signup/payment/checkout', { email: 'a@b.co' });
    expect(r).toEqual({ pendingSignupId: 'tok_1', checkoutUrl: 'https://stripe/x' });
  });

  it('passes through a null checkout_url (already-registered, enumeration-safe)', async () => {
    mockPost.mockResolvedValue({ pending_signup_id: 'tok_2', checkout_url: null });
    const r = await svc.startPaymentCheckout('a@b.co');
    expect(r.checkoutUrl).toBeNull();
  });

  it('getStatus GETs the url-encoded token', async () => {
    mockGet.mockResolvedValue({ status: 'awaiting_payment' });
    const r = await svc.getStatus('tok/1');
    expect(mockGet).toHaveBeenCalledWith('/auth/signup/status/tok%2F1');
    expect(r).toEqual({ status: 'awaiting_payment' });
  });
});

describe('isSignupSuccessStatus', () => {
  it('treats any terminal non-expired status as success', () => {
    expect(isSignupSuccessStatus('active')).toBe(true);
    expect(isSignupSuccessStatus('created_pending_verification')).toBe(true);
  });
  it('is not success while awaiting_payment or on expired', () => {
    expect(isSignupSuccessStatus('awaiting_payment')).toBe(false);
    expect(isSignupSuccessStatus('expired')).toBe(false);
  });
});
