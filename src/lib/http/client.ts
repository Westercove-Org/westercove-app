import {
  HttpError,
  type HttpClientOptions,
  type RequestOptions,
} from './types';

/**
 * A small `fetch` wrapper: resolves URLs against a base, attaches standard
 * headers and the bearer token, serializes JSON bodies, parses JSON responses,
 * throws `HttpError` on non-2xx, and routes 401s through a single hook so
 * token-refresh / sign-out live in one place.
 *
 * Backend-agnostic on purpose — the same interface fronts every later
 * API-wiring ticket, mirroring the `Api…Service` pattern already in `services/`.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly getToken: HttpClientOptions['getToken'];
  private readonly onUnauthorized: HttpClientOptions['onUnauthorized'];
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.getToken = options.getToken;
    this.onUnauthorized = options.onUnauthorized;
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  get<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  put<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  patch<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  delete<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  /** Core request. Retries once after a recovered 401 (`onUnauthorized`). */
  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const res = await this.send(path, options);

    if (res.status === 401 && options.auth !== false && this.onUnauthorized) {
      const recovered = await this.onUnauthorized();
      if (recovered) return this.parse<T>(await this.send(path, options));
    }

    return this.parse<T>(res);
  }

  private async send(path: string, options: RequestOptions): Promise<Response> {
    const url = this.resolveUrl(path, options.query);
    const headers = await this.buildHeaders(options);
    const body = this.serializeBody(options.body, headers);

    return fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body,
      signal: options.signal,
    });
  }

  private resolveUrl(path: string, query?: RequestOptions['query']): string {
    const base = /^https?:\/\//i.test(path)
      ? path
      : `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
    if (!query) return base;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) params.append(key, String(value));
    }
    const qs = params.toString();
    return qs ? `${base}${base.includes('?') ? '&' : '?'}${qs}` : base;
  }

  private async buildHeaders(options: RequestOptions): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      accept: 'application/json',
      ...this.defaultHeaders,
      ...options.headers,
    };

    if (options.auth !== false && this.getToken) {
      const token = await this.getToken();
      if (token) headers.authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /** JSON-serialize plain bodies; pass strings and FormData through untouched. */
  private serializeBody(
    body: unknown,
    headers: Record<string, string>,
  ): BodyInit | undefined {
    if (body === undefined || body === null) return undefined;
    if (typeof body === 'string' || body instanceof FormData) return body as BodyInit;
    if (!headers['content-type']) headers['content-type'] = 'application/json';
    return JSON.stringify(body);
  }

  private async parse<T>(res: Response): Promise<T> {
    const data = await this.readBody(res);
    if (!res.ok) {
      const message =
        (data && typeof data === 'object' && 'message' in data
          ? String((data as { message: unknown }).message)
          : null) ?? `Request failed with status ${res.status}`;
      throw new HttpError(res.status, message, data);
    }
    return data as T;
  }

  private async readBody(res: Response): Promise<unknown> {
    if (res.status === 204) return null;
    const text = await res.text();
    if (!text) return null;
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    return text;
  }
}
