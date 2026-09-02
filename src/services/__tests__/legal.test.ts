const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('@/lib/http', () => ({
  apiClient: {
    get: (...a: unknown[]) => mockGet(...a),
    post: (...a: unknown[]) => mockPost(...a),
  },
}));

import { ApiLegalService } from '@/services/legal';

const wire = {
  required: true,
  reason: 'version_changed',
  current_version: 'v10.2026-09-01',
  content: {
    version: 'v10.2026-09-01',
    title: 'Before you begin',
    paragraphs: ['A', 'B'],
    bullets: ['one', 'two'],
    acknowledgement_checks: ['I am 18 or older', 'I have read and understood'],
    acknowledgement_label: 'I accept',
    save_and_read_later_label: 'Save and read later',
    community_guidelines_url: null,
    last_updated: 'January 1, 2026',
  },
};

describe('ApiLegalService', () => {
  const svc = new ApiLegalService();
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it('getStatus passes device_id as a query and maps snake_case content', async () => {
    mockGet.mockResolvedValue(wire);
    const s = await svc.getStatus('device-abcdefgh');
    expect(mockGet).toHaveBeenCalledWith('/legal-disclaimer/status', {
      query: { device_id: 'device-abcdefgh' },
    });
    expect(s.required).toBe(true);
    expect(s.currentVersion).toBe('v10.2026-09-01');
    expect(s.content.acknowledgementChecks).toEqual([
      'I am 18 or older',
      'I have read and understood',
    ]);
    expect(s.content.saveAndReadLaterLabel).toBe('Save and read later');
  });

  it('getStatus forwards a document discriminator and maps last_updated', async () => {
    mockGet.mockResolvedValue(wire);
    const s = await svc.getStatus('device-abcdefgh', 'terms');
    expect(mockGet).toHaveBeenCalledWith('/legal-disclaimer/status', {
      query: { device_id: 'device-abcdefgh', document: 'terms' },
    });
    expect(s.content.lastUpdated).toBe('January 1, 2026');
  });

  it('acknowledge forwards the document discriminator', async () => {
    mockPost.mockResolvedValue({ ...wire, required: false, reason: null });
    await svc.acknowledge('device-abcdefgh', 'terms');
    expect(mockPost).toHaveBeenCalledWith('/legal-disclaimer/acknowledge', {
      device_id: 'device-abcdefgh',
      document: 'terms',
    });
  });

  it('getContent GETs the PUBLIC no-auth content endpoint and maps it', async () => {
    mockGet.mockResolvedValue(wire.content);
    const c = await svc.getContent('disclaimer');
    expect(mockGet).toHaveBeenCalledWith('/legal-disclaimer/content', {
      auth: false,
      query: { document: 'disclaimer' },
    });
    expect(c.title).toBe('Before you begin');
    expect(c.acknowledgementLabel).toBe('I accept');
  });

  it('acknowledge posts the device_id and maps the refreshed status', async () => {
    mockPost.mockResolvedValue({ ...wire, required: false, reason: null });
    const s = await svc.acknowledge('device-abcdefgh');
    expect(mockPost).toHaveBeenCalledWith('/legal-disclaimer/acknowledge', {
      device_id: 'device-abcdefgh',
    });
    expect(s.required).toBe(false);
  });
});
