import { clearAuthToken, getAuthToken } from './authToken';
import { HttpClient } from './client';
import { API_BASE_URL } from './config';

/**
 * The app-wide HTTP client. Reads the bearer token from the secure store and,
 * on a 401, clears the token and signs the user out — a single place for the
 * unauthenticated case. When the backend grows a refresh endpoint, refresh here
 * and return true to have the failed request retried transparently.
 */
export const apiClient = new HttpClient({
  baseUrl: API_BASE_URL,
  getToken: getAuthToken,
  async onUnauthorized() {
    // Lazy require breaks the module-init cycle: sessionStore/services →
    // chat/survey → this client. Only needed at 401 time, never at load.
    const { services } = require('@/services');
    try {
      // Silent refresh: exchange the stored refresh token for a fresh access
      // token and have the failed request retried transparently.
      if (await services.auth.refresh()) return true;
    } catch {
      // fall through to sign-out
    }
    await clearAuthToken();
    const { useSessionStore } = require('@/features/auth/sessionStore');
    useSessionStore.getState().signOut();
    return false;
  },
});

export { HttpClient } from './client';
export { API_BASE_URL } from './config';
export { getAuthToken, setAuthToken, clearAuthToken } from './authToken';
export { HttpError } from './types';
export type { HttpClientOptions, RequestOptions, HttpMethod } from './types';
