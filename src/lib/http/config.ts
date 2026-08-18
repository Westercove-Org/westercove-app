/**
 * Backend base URL, from the environment. `EXPO_PUBLIC_` is required so the
 * value is available in the client bundle (unlike the server-only keys read by
 * the `+api.ts` routes). Falls back to the local dev server so a fresh checkout
 * runs without a .env.
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ??
  'http://localhost:8000';
