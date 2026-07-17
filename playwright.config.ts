import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for the LineLock ledger site (web/, Next.js 14 on :3402).
 *
 * The web app runs in DEMO MODE with no env keys: with `LINELOCK_API_URL`
 * unset it renders from the committed `fixtures/ledger-state.json`, so these
 * tests need no wallet, no API server, and no secrets — CI-runnable as-is.
 *
 * NOTE: the app's own start script is `next start -p 3402` (see web/package.json),
 * so we target :3402, not the create-next-app default of :3000.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL: "http://localhost:3402",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Build then start the production Next.js server (self-contained for CI + local).
    command: "npm run web:build && npm run web:start",
    url: "http://localhost:3402",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000, // a cold `next build` + start can take a while on CI
  },
});
