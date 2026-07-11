import { defineConfig, devices } from "@playwright/test";

// End-to-end smoke suite. It drives the real app, so Postgres + the Spring
// backend (localhost:8080) must already be running — Playwright only boots the
// Vite dev server, which proxies /api to the backend (see vite.config.ts).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
