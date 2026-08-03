import { secureStorage } from '@/lib/secureStorage';

/**
 * The shared HTTP client for the real backend (FastAPI/AWS, repo QuietRoom).
 * Every future Api… service impl goes through here so base URL, auth token, JSON
 * handling, and error shape live in one place.
 *
 * Base URL comes from EXPO_PUBLIC_API_URL (Expo inlines EXPO_PUBLIC_* at build).
 * When it is unset the app stays on the Mock services — see services/index.ts.
 */
export function apiBaseUrl(): string | undefined {
  return process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
}

/** True when a backend is configured; gates the Mock→Api swap in the registry. */
export function apiConfigured(): boolean {
  return Boolean(apiBaseUrl());
}

const TOKEN_KEY = 'westercove.auth.jwt';
let cachedToken: string | null = null;

/** Persist the Cognito JWT (call after sign-in, once auth issuance exists). */
export async function setAuthToken(token: string): Promise<void> {
  cachedToken = token;
  await secureStorage.setItem(TOKEN_KEY, token);
}

/** Clear the token on sign-out. */
export async function clearAuthToken(): Promise<void> {
  cachedToken = null;
  await secureStorage.removeItem(TOKEN_KEY);
}

async function getAuthToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  cachedToken = await secureStorage.getItem(TOKEN_KEY);
  return cachedToken;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`API ${status}: ${body.slice(0, 200)}`);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** JSON body; serialized automatically. */
  body?: unknown;
  /** Extra headers, e.g. X-Profile-Id for chat. */
  headers?: Record<string, string>;
}

/**
 * Make a JSON request to the backend. Injects the bearer token, throws ApiError
 * on non-2xx, and returns parsed JSON (or undefined for 204/empty bodies).
 */
export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const base = apiBaseUrl();
  if (!base) {
    throw new Error('EXPO_PUBLIC_API_URL is not set; backend is not configured.');
  }
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...opts.headers,
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const token = await getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.text().catch(() => ''));
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
