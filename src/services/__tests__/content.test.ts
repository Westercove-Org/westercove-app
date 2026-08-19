const mockPost = jest.fn();
jest.mock('@/lib/http', () => {
  class HttpError extends Error {
    status: number;
    constructor(status: number) {
      super(`HTTP ${status}`);
      this.status = status;
    }
  }
  return { apiClient: { post: (...a: unknown[]) => mockPost(...a) }, HttpError };
});

import { ApiContentService, MockContentService } from '@/services/content';
import { HttpError } from '@/lib/http';

describe('MockContentService', () => {
  const svc = new MockContentService();

  it('writes a summary for a book the user added', async () => {
    const { summary, rateLimited } = await svc.generateBookSummary('A Book', 'An Author');
    expect(summary).toContain('A Book');
    expect(rateLimited).toBe(false);
  });

  it('returns organizations for a loss type', async () => {
    const orgs = await svc.organizationsFor('Pet');
    expect(orgs.length).toBeGreaterThan(0);
    expect(orgs[0].name).toContain('Pet');
  });
});

describe('ApiContentService.generateBookSummary', () => {
  const svc = new ApiContentService();
  beforeEach(() => mockPost.mockReset());

  it('posts title + authors and returns the backend summary', async () => {
    mockPost.mockResolvedValue({ summary: 'A gentle summary', themes: ['loss'] });
    const r = await svc.generateBookSummary('A Book', 'An Author');

    expect(mockPost).toHaveBeenCalledWith('/library/books/generate-summary', {
      title: 'A Book',
      authors: ['An Author'],
    });
    expect(r).toEqual({ summary: 'A gentle summary', rateLimited: false });
  });

  it('reports rateLimited on 429 without retrying or fabricating a summary', async () => {
    mockPost.mockRejectedValue(new HttpError(429, "rate limited", null));
    const r = await svc.generateBookSummary('A Book', 'An Author');

    expect(mockPost).toHaveBeenCalledTimes(1); // no retry
    expect(r).toEqual({ summary: null, rateLimited: true });
  });

  it('falls back to a templated summary on other failures (never fails in the UI)', async () => {
    mockPost.mockRejectedValue(new HttpError(502, "bad gateway", null));
    const r = await svc.generateBookSummary('A Book', 'An Author');

    expect(r.rateLimited).toBe(false);
    expect(r.summary).toContain('A Book');
  });
});
