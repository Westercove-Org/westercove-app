import { defineConfig, devices } from '@playwright/test';

/**
 * Web end-to-end tests against the exported static web build. The webServer
 * exports the app and serves it, so `npm run e2e` is self-contained.
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
    command: 'npm run web:export && npx serve dist -l 8080 -s',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
