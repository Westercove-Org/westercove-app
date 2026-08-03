jest.mock('@/lib/secureStorage', () => {
  let store: Record<string, string> = {};
  return {
    secureStorage: {
      getItem: async (k: string) => store[k] ?? null,
      setItem: async (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: async (k: string) => {
        delete store[k];
      },
    },
  };
});

process.env.EXPO_PUBLIC_API_URL = 'https://api.test';

import { ApiError, apiFetch, clearAuthToken, setAuthToken } from '@/services/http';

describe('apiFetch', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(async () => {
    await clearAuthToken();
  });

  function ok(body: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      status,
      text: async () => (body === undefined ? '' : JSON.stringify(body)),
    };
  }

  it('GETs and parses JSON against the base URL', async () => {
    fetchMock.mockResolvedValue(ok({ hello: 'world' }));
    const out = await apiFetch<{ hello: string }>('/thing');
    expect(out.hello).toBe('world');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/thing');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('injects the bearer token once set', async () => {
    await setAuthToken('jwt-123');
    fetchMock.mockResolvedValue(ok({}));
    await apiFetch('/secure');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer jwt-123');
  });

  it('serializes a JSON body with content-type', async () => {
    fetchMock.mockResolvedValue(ok({}));
    await apiFetch('/x', { method: 'POST', body: { a: 1 } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe('{"a":1}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('returns undefined for 204', async () => {
    fetchMock.mockResolvedValue(ok(undefined, 204));
    await expect(apiFetch('/gone', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('throws ApiError on non-2xx', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403, text: async () => 'nope' });
    await expect(apiFetch('/denied')).rejects.toBeInstanceOf(ApiError);
  });
});
