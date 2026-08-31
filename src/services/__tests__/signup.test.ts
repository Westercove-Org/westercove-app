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

  it('startPaymentCheckout POSTs email + password and maps the checkout status', async () => {
    mockPost.mockResolvedValue({ pending_signup_id: 'tok_1', checkout_url: 'https://stripe/x', status: 'checkout' });
    const r = await svc.startPaymentCheckout({ email: 'a@b.co', password: 'sup3rsecret!AB' });
    expect(mockPost).toHaveBeenCalledWith('/auth/signup/payment/checkout', {
      email: 'a@b.co',
      password: 'sup3rsecret!AB',
    });
    expect(r).toEqual({ pendingSignupId: 'tok_1', checkoutUrl: 'https://stripe/x', status: 'checkout' });
  });

  it('surfaces already_registered status (null checkout_url, no redirect)', async () => {
    mockPost.mockResolvedValue({ pending_signup_id: 'tok_2', checkout_url: null, status: 'already_registered' });
    const r = await svc.startPaymentCheckout({ email: 'a@b.co', password: 'sup3rsecret!AB' });
    expect(r.checkoutUrl).toBeNull();
    expect(r.status).toBe('already_registered');
  });

  it('infers status from the url when the backend omits it (pre-#118 deploy)', async () => {
    mockPost.mockResolvedValueOnce({ pending_signup_id: 'tok_3', checkout_url: null });
    expect((await svc.startPaymentCheckout({ email: 'a@b.co', password: 'sup3rsecret!AB' })).status).toBe('already_registered');
    mockPost.mockResolvedValueOnce({ pending_signup_id: 'tok_4', checkout_url: 'https://stripe/y' });
    expect((await svc.startPaymentCheckout({ email: 'a@b.co', password: 'sup3rsecret!AB' })).status).toBe('checkout');
  });

  it('getStatus GETs the url-encoded token; missing email → null (pre-#80 dev)', async () => {
    mockGet.mockResolvedValue({ status: 'awaiting_payment' });
    const r = await svc.getStatus('tok/1');
    expect(mockGet).toHaveBeenCalledWith('/auth/signup/status/tok%2F1');
    expect(r).toEqual({ status: 'awaiting_payment', email: null });
  });

  it('getStatus passes through the account email on a terminal status (bug7)', async () => {
    mockGet.mockResolvedValue({ status: 'active', email: 'a@b.co' });
    const r = await svc.getStatus('tok_1');
    expect(r).toEqual({ status: 'active', email: 'a@b.co' });
  });

  it('verifyOnboardingToken GETs the url-encoded token and maps the hint', async () => {
    mockGet.mockResolvedValue({ email_hint: 'j••@b.co', expires_at: '2026-01-01T00:00:00Z' });
    const r = await svc.verifyOnboardingToken('tok/1');
    expect(mockGet).toHaveBeenCalledWith('/auth/onboarding/verify/tok%2F1');
    expect(r).toEqual({ emailHint: 'j••@b.co', expiresAt: '2026-01-01T00:00:00Z' });
  });

  it('completeOnboarding POSTs token + password', async () => {
    mockPost.mockResolvedValue({ email: 'a@b.co' });
    const r = await svc.completeOnboarding('tok_1', 'hunter2hunter2');
    expect(mockPost).toHaveBeenCalledWith('/auth/onboarding/complete', {
      token: 'tok_1',
      password: 'hunter2hunter2',
    });
    expect(r).toEqual({ email: 'a@b.co' });
  });

  it('verifyEmailToken POSTs the token', async () => {
    mockPost.mockResolvedValue({ email: 'a@b.co' });
    const r = await svc.verifyEmailToken('tok_1');
    expect(mockPost).toHaveBeenCalledWith('/auth/onboarding/verify-email', { token: 'tok_1' });
    expect(r).toEqual({ email: 'a@b.co' });
  });

  it('resendOnboardingEmail POSTs the email (enumeration-safe, resolves void)', async () => {
    mockPost.mockResolvedValue({ status: 'ok' });
    await expect(svc.resendOnboardingEmail('a@b.co')).resolves.toBeUndefined();
    expect(mockPost).toHaveBeenCalledWith('/auth/onboarding/resend', { email: 'a@b.co' });
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
