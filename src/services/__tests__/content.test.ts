jest.mock('@/lib/secureStorage', () => ({
  secureStorage: {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  },
}));

process.env.EXPO_PUBLIC_API_URL = 'https://api.test';

import { ApiContentService, MockContentService } from '@/services/content';

describe('MockContentService', () => {
  const svc = new MockContentService();

  it('fetches a book summary', async () => {
    const s = await svc.fetchBookSummary('b1');
    expect(s.length).toBeGreaterThan(0);
  });

  it('returns organizations for a loss type', async () => {
    const orgs = await svc.organizationsFor('Pet');
    expect(orgs.length).toBeGreaterThan(0);
    expect(orgs[0].name).toContain('Pet');
  });
});

describe('ApiContentService', () => {
  const svc = new ApiContentService();
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });
  const ok = (body: unknown) => ({ ok: true, status: 200, text: async () => JSON.stringify(body) });

  it('requests organizations by loss type, url-encoded', async () => {
    fetchMock.mockResolvedValue(ok([{ id: '1', name: 'Org', description: 'd' }]));
    const orgs = await svc.organizationsFor('Pet');
    expect(orgs).toEqual([{ id: '1', name: 'Org', description: 'd' }]);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/resources/organizations?loss_type=Pet');
  });

  it('returns empty list until orgs are seeded', async () => {
    fetchMock.mockResolvedValue(ok([]));
    expect(await svc.organizationsFor('Suicide')).toEqual([]);
  });

  it('matches a curated summary by id, falls back to generic', async () => {
    fetchMock.mockResolvedValue(ok([{ id: 7, title: 'T', authors: ['A'], summary: 'real summary' }]));
    expect(await svc.fetchBookSummary('7')).toBe('real summary');
    // Cached: a second summary lookup reuses the one curated fetch.
    expect(await svc.fetchBookSummary('b1')).toContain('gentle, grounded companion');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('maps curated books to the Discover catalog shape', async () => {
    const fresh = new ApiContentService();
    fetchMock.mockResolvedValue(
      ok([{ id: 42, title: 'Bearing', authors: ['Joanne', 'PhD'], summary: null }]),
    );
    const catalog = await fresh.listCatalog();
    expect(catalog).toEqual([
      { id: '42', title: 'Bearing', author: 'Joanne, PhD', spine: expect.any(String) },
    ]);
  });
});
