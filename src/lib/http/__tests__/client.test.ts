import { HttpClient } from '@/lib/http/client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(body === null ? '' : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('HttpClient', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('resolves paths against the base URL and parses JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const client = new HttpClient({ baseUrl: 'https://api.test/' });

    const data = await client.get<{ ok: boolean }>('/v1/ping');

    expect(data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.test/v1/ping',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('attaches the bearer token and standard headers', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    const client = new HttpClient({
      baseUrl: 'https://api.test',
      getToken: () => 'tok-123',
    });

    await client.post('/entries', { text: 'hi' });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.authorization).toBe('Bearer tok-123');
    expect(init.headers.accept).toBe('application/json');
    expect(init.headers['content-type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ text: 'hi' }));
  });

  it('omits the token when auth is false', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    const client = new HttpClient({
      baseUrl: 'https://api.test',
      getToken: () => 'tok-123',
    });

    await client.get('/public', { auth: false });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.authorization).toBeUndefined();
  });

  it('appends query params, dropping nullish values', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    const client = new HttpClient({ baseUrl: 'https://api.test' });

    await client.get('/search', { query: { q: 'grief', page: 2, tag: undefined } });

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/search?q=grief&page=2');
  });

  it('throws HttpError with status and body on non-2xx', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'nope' }, 400));
    const client = new HttpClient({ baseUrl: 'https://api.test' });

    await expect(client.get('/bad')).rejects.toMatchObject({
      name: 'HttpError',
      status: 400,
      message: 'nope',
    });
  });

  it('retries once when onUnauthorized recovers the session', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: 'expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const onUnauthorized = jest.fn().mockResolvedValue(true);
    const client = new HttpClient({ baseUrl: 'https://api.test', onUnauthorized });

    const data = await client.get<{ ok: boolean }>('/me');

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(data).toEqual({ ok: true });
  });

  it('surfaces the 401 when onUnauthorized does not recover', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: 'expired' }, 401));
    const onUnauthorized = jest.fn().mockResolvedValue(false);
    const client = new HttpClient({ baseUrl: 'https://api.test', onUnauthorized });

    await expect(client.get('/me')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null for 204 responses', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const client = new HttpClient({ baseUrl: 'https://api.test' });

    await expect(client.delete('/entries/1')).resolves.toBeNull();
  });

  describe('timeout (wes-freeze-first-entry)', () => {
    // A fetch that never resolves on its own, but rejects (like the real one)
    // when its abort signal fires — the "hung request" that froze the UI.
    const hangingFetch = () =>
      fetchMock.mockImplementation(
        (_url, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
            );
          }),
      );

    afterEach(() => jest.useRealTimers());

    it('aborts a hung request after the client default and throws TimeoutError', async () => {
      jest.useFakeTimers();
      hangingFetch();
      const client = new HttpClient({ baseUrl: 'https://api.test', timeoutMs: 30_000 });

      const p = client.get('/slow');
      const assertion = expect(p).rejects.toMatchObject({ name: 'TimeoutError' });
      await jest.advanceTimersByTimeAsync(30_000);
      await assertion;
    });

    it('lets a per-request timeoutMs override the default', async () => {
      jest.useFakeTimers();
      hangingFetch();
      const client = new HttpClient({ baseUrl: 'https://api.test', timeoutMs: 30_000 });

      const p = client.get('/slow', { timeoutMs: 1000 });
      const assertion = expect(p).rejects.toMatchObject({ name: 'TimeoutError' });
      await jest.advanceTimersByTimeAsync(1000);
      await assertion;
    });

    it('does not time out a request that responds in time', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
      const client = new HttpClient({ baseUrl: 'https://api.test', timeoutMs: 30_000 });

      await expect(client.get<{ ok: boolean }>('/fast')).resolves.toEqual({ ok: true });
    });

    it('passes the caller signal through when no timeout is configured', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
      const client = new HttpClient({ baseUrl: 'https://api.test' }); // no default timeout
      const signal = new AbortController().signal;

      await client.get('/x', { signal });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.signal).toBe(signal);
    });
  });
});
