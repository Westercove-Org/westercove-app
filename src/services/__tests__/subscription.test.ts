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

  it('reads status, mapping trial_ends_on → a plain date', async () => {
    mockGet.mockResolvedValue({ entitlement: 'trial_active', trial_ends_on: '2026-09-01T00:00:00Z', price: '$8.99 / month' });
    const s = await svc.getStatus();

    expect(mockGet).toHaveBeenCalledWith('/api/account/subscription');
    expect(s.entitlement).toBe('trial_active');
    expect(s.price).toBe('$8.99 / month');
    expect(s.trialEndsOn).toMatch(/2026/);
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
