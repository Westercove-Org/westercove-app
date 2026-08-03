jest.mock('@/lib/secureStorage', () => ({
  secureStorage: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
}));

process.env.EXPO_PUBLIC_API_URL = 'https://api.test';

import { ApiSubscriptionService, MockSubscriptionService } from '@/services/subscription';

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

describe('ApiSubscriptionService', () => {
  const svc = new ApiSubscriptionService();
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });
  const ok = (body: unknown) => ({ ok: true, status: 200, text: async () => JSON.stringify(body) });

  it('exportArchive POSTs to /account/export', async () => {
    fetchMock.mockResolvedValue(ok({ id: 'j1', status: 'pending' }));
    expect(await svc.exportArchive({ includeRage: true })).toEqual({ ready: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/account/export');
    expect(init.method).toBe('POST');
  });

  it('scheduleDeletion reads the email then confirms it', async () => {
    fetchMock
      .mockResolvedValueOnce(ok({ email: 'you@test.app' }))
      .mockResolvedValueOnce(ok({ deletion_scheduled_at: '2026-09-01T00:00:00Z' }));
    const { deletesOn } = await svc.scheduleDeletion();
    expect(deletesOn).toMatch(/2026/);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/account');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ confirm_email: 'you@test.app' });
  });

  it('cancelDeletion DELETEs', async () => {
    fetchMock.mockResolvedValue(ok({ status: 'cancelled' }));
    await svc.cancelDeletion();
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
  });

  it('inherits the local status formatter', () => {
    expect(svc.getStatus('trial_active').price).toMatch(/\$/);
  });
});
