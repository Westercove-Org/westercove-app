import { secureStorage } from '@/lib/secureStorage';

/**
 * The bearer token lives in the encrypted secure store (keychain / keystore on
 * native, localStorage on web) under one key, cached in memory so the hot path
 * (`getToken` on every request) does not hit disk. Auth flows call
 * `setAuthToken` on sign-in and `clearAuthToken` on sign-out / 401.
 */
const TOKEN_KEY = 'westercove.authToken';

let cached: string | null | undefined;

export async function getAuthToken(): Promise<string | null> {
  if (cached !== undefined) return cached;
  cached = await secureStorage.getItem(TOKEN_KEY);
  return cached;
}

export async function setAuthToken(token: string): Promise<void> {
  cached = token;
  await secureStorage.setItem(TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
  cached = null;
  await secureStorage.removeItem(TOKEN_KEY);
}
