const mockGet = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();
jest.mock('@/lib/http', () => ({
  apiClient: {
    get: (...a: unknown[]) => mockGet(...a),
    patch: (...a: unknown[]) => mockPatch(...a),
    delete: (...a: unknown[]) => mockDelete(...a),
  },
}));

import { ApiJournalService } from '@/services/journal';

const raw = {
  id: 7,
  date: '2026-08-30',
  time: '14:03:00',
  title: 'A hard morning',
  entry: 'I miss her.',
  reflection: 'It makes sense that this morning felt heavy.',
  entry_type: 'grief_question',
  profile_id: 3,
  created_at: '2026-08-30T18:03:00Z',
};

const mapped = {
  id: 7,
  date: '2026-08-30',
  time: '14:03:00',
  title: 'A hard morning',
  entry: 'I miss her.',
  reflection: 'It makes sense that this morning felt heavy.',
  entryType: 'grief_question',
  profileId: 3,
  createdAt: '2026-08-30T18:03:00Z',
};

describe('ApiJournalService', () => {
  const svc = new ApiJournalService();
  beforeEach(() => {
    mockGet.mockReset();
    mockPatch.mockReset();
    mockDelete.mockReset();
  });

  it('lists a profile\'s entries with profile_id required, defaults, and maps to camelCase', async () => {
    mockGet.mockResolvedValue([raw]);
    const res = await svc.list(3);

    expect(mockGet).toHaveBeenCalledWith('/api/journal?profile_id=3');
    expect(res).toEqual([mapped]);
  });

  it('passes sort and entry_type filters on list', async () => {
    mockGet.mockResolvedValue([]);
    await svc.list(3, { sort: 'entry_type', entryType: 'memory' });

    expect(mockGet).toHaveBeenCalledWith('/api/journal?profile_id=3&sort=entry_type&entry_type=memory');
  });

  it('gets one entry by id', async () => {
    mockGet.mockResolvedValue(raw);
    const res = await svc.get(7);

    expect(mockGet).toHaveBeenCalledWith('/api/journal/7');
    expect(res).toEqual(mapped);
  });

  it('defaults a missing reflection / profile_id to null', async () => {
    mockGet.mockResolvedValue({ ...raw, reflection: undefined, profile_id: undefined });
    const res = await svc.get(7);

    expect(res.reflection).toBeNull();
    expect(res.profileId).toBeNull();
  });

  it('patches only the provided fields (snake_case body)', async () => {
    mockPatch.mockResolvedValue(raw);
    await svc.update(7, { title: 'New title', entryType: 'letter' });

    expect(mockPatch).toHaveBeenCalledWith('/api/journal/7', {
      title: 'New title',
      entry_type: 'letter',
    });
  });

  it('sends reflection: null explicitly to clear it (distinguished from omitted)', async () => {
    mockPatch.mockResolvedValue(raw);
    await svc.update(7, { reflection: null });

    expect(mockPatch).toHaveBeenCalledWith('/api/journal/7', { reflection: null });
  });

  it('deletes by id', async () => {
    mockDelete.mockResolvedValue(undefined);
    await svc.remove(7);

    expect(mockDelete).toHaveBeenCalledWith('/api/journal/7');
  });
});
