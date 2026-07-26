import { MockSubscriptionService } from '@/services/subscription';

describe('MockSubscriptionService', () => {
  const svc = new MockSubscriptionService();

  it('gives a trial a plain end date and price, with no countdown', () => {
    const s = svc.getStatus('trial_active');
    expect(s.trialEndsOn).toBeDefined();
    expect(s.price).toMatch(/\$/);
  });

  it('a lapsed user still has a status (crisis is never gated by state)', () => {
    const s = svc.getStatus('lapsed');
    expect(s.entitlement).toBe('lapsed');
  });

  it('schedules deletion with a grace period', async () => {
    const { deletesOn } = await svc.scheduleDeletion();
    expect(deletesOn.length).toBeGreaterThan(0);
  });

  it('restore returns an active entitlement', async () => {
    expect(await svc.restore()).toBe('active_monthly');
  });
});
