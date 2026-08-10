import { defineConfig, devices } from '@playwright/test';

/**
 * Web end-to-end tests against the exported web build. The webServer exports
 * the app and serves it, so `npm run e2e` is self-contained. The export is a
 * server build (API routes), so it is served by `expo serve`, not a static
 * file server.
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
    command: 'npm run web:export && npx expo serve --port 8080',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
