import { ApiChatSessionService } from '@/services/chat';

const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('@/lib/http', () => ({ apiClient: { get: (...a: unknown[]) => mockGet(...a), post: (...a: unknown[]) => mockPost(...a) } }));
const get = mockGet;
const post = mockPost;

describe('ApiChatSessionService', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('creates a session, sending only a trimmed title, and returns the id', async () => {
    post.mockResolvedValue({ session_id: 42 });
    const res = await new ApiChatSessionService().createSession({ title: '  Hard day  ' });

    expect(post).toHaveBeenCalledWith('/chat/sessions', { profile_id: undefined, title: 'Hard day' });
    expect(res).toEqual({ sessionId: 42 });
  });

  it('omits an empty/whitespace title', async () => {
    post.mockResolvedValue({ session_id: 1 });
    await new ApiChatSessionService().createSession({ profileId: 7, title: '   ' });

    expect(post).toHaveBeenCalledWith('/chat/sessions', { profile_id: 7, title: undefined });
  });

  it('posts a message with profile/timezone headers and returns the assistant reply', async () => {
    post.mockResolvedValue({
      assistant: { role: 'assistant', text: '  I am here with you.  ' },
      session_title: 'A hard night',
    });

    const res = await new ApiChatSessionService().postMessage(42, 'I miss her', {
      profileId: 3,
      timezone: 'America/New_York',
    });

    expect(post).toHaveBeenCalledWith(
      '/chat/sessions/42/messages',
      { message: 'I miss her' },
      { headers: { 'X-Profile-Id': '3', 'X-Client-Timezone': 'America/New_York' } },
    );
    expect(res).toEqual({ reply: 'I am here with you.', sessionTitle: 'A hard night' });
  });

  it('lists a profile\'s sessions, mapping snake_case → camelCase with defaults', async () => {
    get.mockResolvedValue({
      sessions: [
        { id: 2, created_at: '2026-08-19T00:00:00Z', title: 'Rex', entry_type: 'journal', safety_tier: 'support', journal_entry_id: 9 },
        { id: 3, created_at: '2026-08-18T00:00:00Z', title: null }, // missing fields → defaults
      ],
    });

    const res = await new ApiChatSessionService().listSessions(5);

    expect(get).toHaveBeenCalledWith('/chat/profiles/5/sessions');
    expect(res).toEqual([
      { id: 2, createdAt: '2026-08-19T00:00:00Z', title: 'Rex', entryType: 'journal', safetyTier: 'support', journalEntryId: 9 },
      { id: 3, createdAt: '2026-08-18T00:00:00Z', title: undefined, entryType: 'journal', safetyTier: 'none', journalEntryId: undefined },
    ]);
  });

  it('gets one session summary', async () => {
    get.mockResolvedValue({ id: 8, created_at: '2026-08-19T00:00:00Z', title: 'Note', entry_type: 'journal', safety_tier: 'none' });

    const res = await new ApiChatSessionService().getSession(8);

    expect(get).toHaveBeenCalledWith('/chat/sessions/8');
    expect(res.id).toBe(8);
    expect(res.title).toBe('Note');
  });
});
