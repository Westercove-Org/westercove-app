import { MockContentService } from '@/services/content';

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
