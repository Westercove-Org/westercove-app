const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/lib/http', () => ({
  apiClient: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
    delete: (...a: unknown[]) => mockDelete(...a),
  },
}));

import { ApiSubscriptionService, MockSubscriptionService } from '@/services/subscription';

describe('MockSubscriptionService', () => {
  const svc = new MockSubscriptionService();

  it('gives a trial a plain end date and price, with no countdown', async () => {
    const s = await svc.getStatus();
    expect(s.trialEndsOn).toBeDefined();
    expect(s.price).toMatch(/\$/);
  });

  it('restore returns an active entitlement', async () => {
    expect(await svc.restore()).toBe('active_monthly');
  });

  it('schedules deletion with a grace period', async () => {
    const { deletesOn } = await svc.scheduleDeletion('a@b.co');
    expect(deletesOn.length).toBeGreaterThan(0);
  });
});

describe('ApiSubscriptionService', () => {
  const svc = new ApiSubscriptionService();
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockDelete.mockReset();
  });

  it('maps the membership fields: tier, card_last4, next_charge_date, sponsor', async () => {
    mockGet.mockResolvedValue({
      entitlement: 'active_monthly',
      price: '$24.99/month',
      tier: 'standard',
      card_last4: '4242',
      next_charge_date: '2026-10-01T00:00:00',
      sponsor: { org_name: 'Harbor Care', coverage_ends_at: '2027-01-01T00:00:00' },
      stripe: { status: 'active', current_period_end: '2026-10-01T00:00:00', price_id: 'price_123' },
    });
    const s = await svc.getStatus();
    expect(s.tier).toBe('standard');
    expect(s.cardLast4).toBe('4242');
    expect(s.nextChargeDate).toMatch(/2026/);
    expect(s.sponsor).toEqual({ orgName: 'Harbor Care', coverageEndsAt: expect.stringMatching(/2027/) });
  });

  it('leaves the membership fields undefined when the backend omits them', async () => {
    mockGet.mockResolvedValue({ entitlement: 'active_monthly', stripe: null });
    const s = await svc.getStatus();
    expect(s.tier).toBeUndefined();
    expect(s.cardLast4).toBeUndefined();
    expect(s.nextChargeDate).toBeUndefined();
    expect(s.sponsor).toBeUndefined();
  });

  it('reads status, mapping trial_ends_on → a plain date', async () => {
    mockGet.mockResolvedValue({ entitlement: 'trial_active', trial_ends_on: '2026-09-01T00:00:00Z', price: '$8.99 / month' });
    const s = await svc.getStatus();

    expect(mockGet).toHaveBeenCalledWith('/api/account/subscription');
    expect(s.entitlement).toBe('trial_active');
    expect(s.price).toBe('$8.99 / month');
    expect(s.trialEndsOn).toMatch(/2026/);
  });

  it('reads the nested Stripe trial → remaining days (parsed as UTC) + end date', async () => {
    // trial_end is a naive-UTC string (no 'Z'); parsing it as local time would
    // shift the day-count by the device offset. Pin "now" so the count is exact.
    jest.useFakeTimers().setSystemTime(new Date('2026-09-10T00:00:00Z'));
    mockGet.mockResolvedValue({
      entitlement: 'trial_active',
      trial_ends_on: null,
      price: '$0.99 / month',
      stripe: { status: 'trialing', trial_end: '2026-09-15T00:00:00' },
    });
    const s = await svc.getStatus();
    expect(s.trialDaysRemaining).toBe(5);
    expect(s.stripeTrialEndsOn).toMatch(/2026/);
    jest.useRealTimers();
  });

  it('has no trial fields when Stripe is null or not trialing', async () => {
    mockGet.mockResolvedValue({ entitlement: 'active_monthly', stripe: null });
    expect((await svc.getStatus()).trialDaysRemaining).toBeUndefined();

    mockGet.mockResolvedValue({
      entitlement: 'active_monthly',
      stripe: { status: 'active', trial_end: '2026-09-15T00:00:00' },
    });
    expect((await svc.getStatus()).trialDaysRemaining).toBeUndefined();
  });

  it('maps Stripe status, renewal date (UTC) and cancel-at-period-end', async () => {
    mockGet.mockResolvedValue({
      entitlement: 'active_monthly',
      stripe: {
        status: 'active',
        current_period_end: '2026-10-01T00:00:00',
        cancel_at_period_end: true,
      },
    });
    const s = await svc.getStatus();
    expect(s.stripeStatus).toBe('active');
    expect(s.renewsOn).toMatch(/2026/);
    expect(s.cancelAtPeriodEnd).toBe(true);
  });

  it('createPortalSession posts the billing-portal route and returns the url', async () => {
    mockPost.mockResolvedValue({ url: 'https://billing.stripe.com/p/session/abc' });
    expect(await svc.createPortalSession()).toEqual({
      url: 'https://billing.stripe.com/p/session/abc',
    });
    // No flow → no body, so the existing manage-billing / membership callers are unchanged.
    expect(mockPost).toHaveBeenCalledWith('/api/account/billing-portal', undefined);
  });

  it('createPortalSession forwards the flow so the portal opens on the card form (R-10/R-61)', async () => {
    mockPost.mockResolvedValue({ url: 'https://billing.stripe.com/p/session/card' });
    await svc.createPortalSession('payment_method_update');
    expect(mockPost).toHaveBeenCalledWith('/api/account/billing-portal', {
      flow: 'payment_method_update',
    });
  });

  it('createPortalSession throws when no url comes back (portal unavailable)', async () => {
    mockPost.mockResolvedValue({});
    await expect(svc.createPortalSession()).rejects.toThrow();
  });

  it('cancelSubscription posts cancel-at-period-end then returns the refreshed status', async () => {
    mockPost.mockResolvedValue({});
    mockGet.mockResolvedValue({
      entitlement: 'active_monthly',
      stripe: { status: 'active', current_period_end: '2026-10-01T00:00:00', cancel_at_period_end: true },
    });
    const s = await svc.cancelSubscription();
    expect(mockPost).toHaveBeenCalledWith('/api/account/subscription/cancel');
    expect(mockGet).toHaveBeenCalledWith('/api/account/subscription');
    expect(s.cancelAtPeriodEnd).toBe(true);
    expect(s.entitlement).toBe('active_monthly');
  });

  it('restore posts and returns the granted entitlement', async () => {
    mockPost.mockResolvedValue({ entitlement: 'active_monthly' });
    expect(await svc.restore()).toBe('active_monthly');
    expect(mockPost).toHaveBeenCalledWith('/api/account/subscription/restore');
  });

  it('redeems a license code', async () => {
    mockPost.mockResolvedValue({ entitlement: 'license_active', sponsor_organization: 'Westercove Care' });
    const r = await svc.redeemLicense('CODE-123');

    expect(mockPost).toHaveBeenCalledWith('/api/account/license', { code: 'CODE-123' });
    expect(r).toEqual({ entitlement: 'license_active', sponsorOrganization: 'Westercove Care' });
  });

  it('schedules deletion with the confirmation email and maps the date', async () => {
    mockPost.mockResolvedValue({ deletion_scheduled_at: '2026-09-18T00:00:00Z' });
    const { deletesOn } = await svc.scheduleDeletion('a@b.co');

    expect(mockPost).toHaveBeenCalledWith('/api/account/deletion', { confirm_email: 'a@b.co' });
    expect(deletesOn).toMatch(/2026/);
  });

  it('cancels deletion via DELETE', async () => {
    mockDelete.mockResolvedValue({ status: 'cancelled' });
    await svc.cancelDeletion();
    expect(mockDelete).toHaveBeenCalledWith('/api/account/deletion');
  });
});
