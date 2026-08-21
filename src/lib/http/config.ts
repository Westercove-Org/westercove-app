/**
 * Backend base URL, from the environment. `EXPO_PUBLIC_` is required so the
 * value is available in the client bundle (unlike the server-only keys read by
 * the `+api.ts` routes). Defaults to the hosted dev API so a fresh checkout
 * talks to AWS without a .env; point it at http://localhost:8000 in .env to run
 * against a local backend. `EXPO_PUBLIC_API_BASE_URL` is still honored as a
 * fallback for older local .env files.
 */
export const API_BASE_URL: string =
  (
    process.env.EXPO_PUBLIC_API_URL ??
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    'https://dev.westercove.com'
  ).replace(/\/+$/, '');
