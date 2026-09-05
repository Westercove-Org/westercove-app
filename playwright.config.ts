import { defineConfig, devices } from '@playwright/test';

/**
 * Web end-to-end tests against the exported web build. The webServer exports
 * the app and serves it, so `npm run e2e` is self-contained. The export is
 * `output: 'single'` (one index.html + client-side expo-router), so it is
 * served with an index.html SPA fallback (e2e/serve-dist.mjs) — a plain static
 * server 404s every client route.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // `-c` clears the Metro cache: a stale cache can otherwise emit a partial
    // bundle with an empty route tree ("No routes found" / blank app).
    command: 'npm run web:export -- -c && node e2e/serve-dist.mjs dist 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
