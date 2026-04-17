import { defineConfig, devices } from "@playwright/test";

const BASE_URL =
  process.env.E2E_BASE_URL || "http://localhost:3000";
const isRemote = !BASE_URL.includes("localhost");

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    // Phase 3 mobile projects (audit 2026-04-17).
    // Scope on CI with --project=iphone-se etc. to keep runtime predictable.
    {
      name: "iphone-se",
      use: {
        ...devices["iPhone SE"],
        storageState: "./tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "iphone-14-pro",
      use: {
        ...devices["iPhone 14 Pro"],
        storageState: "./tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "pixel-7",
      use: {
        ...devices["Pixel 7"],
        storageState: "./tests/e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  // Only start local dev server when testing against localhost
  ...(isRemote
    ? {}
    : {
        webServer: {
          command: "npm run dev",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      }),
});
