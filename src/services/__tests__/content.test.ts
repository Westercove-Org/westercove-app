import { MockContentService } from '@/services/content';

describe('MockContentService', () => {
  const svc = new MockContentService();

  it('writes a summary for a book the user added', async () => {
    const s = await svc.generateBookSummary('A Book', 'An Author');
    expect(s).toContain('A Book');
  });

  it('returns organizations for a loss type', async () => {
    const orgs = await svc.organizationsFor('Pet');
    expect(orgs.length).toBeGreaterThan(0);
    expect(orgs[0].name).toContain('Pet');
  });
});
