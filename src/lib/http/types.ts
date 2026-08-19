/** Shared types for the app HTTP client. */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Per-request options. `body` is JSON-serialized unless it is already a string
 * or FormData. `headers` merge over (and can override) the standard headers. */
export interface RequestOptions {
  method?: HttpMethod;
  /** Query params appended to the URL; undefined/null values are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  body?: unknown;
  /** Skip the Authorization header for this call (e.g. sign-in, refresh). */
  auth?: boolean;
  /** Abort signal for cancellation / timeouts. */
  signal?: AbortSignal;
}

/**
 * Thrown for any non-2xx response. Carries the status and the parsed body so
 * callers can branch on `status` or read `data` without re-reading the stream.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    // Restore the prototype chain so `instanceof HttpError` holds even when the
    // class is down-compiled (extending built-ins otherwise breaks instanceof).
    Object.setPrototypeOf(this, HttpError.prototype);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

export interface HttpClientOptions {
  /** Base URL every request is resolved against (no trailing slash needed). */
  baseUrl: string;
  /** Returns the current bearer token, or null when unauthenticated. */
  getToken?: () => Promise<string | null> | string | null;
  /**
   * Centralized 401 handler. Called once when a request comes back 401.
   * Return true if the session was recovered (e.g. token refreshed) and the
   * request should be retried once; return false to surface the 401. Use this
   * to trigger a token refresh or sign the user out.
   */
  onUnauthorized?: () => Promise<boolean> | boolean;
  /** Default headers applied to every request. */
  defaultHeaders?: Record<string, string>;
}
