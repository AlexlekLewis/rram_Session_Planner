/**
 * Global Setup — Authenticates once and saves browser state for all tests.
 *
 * Credentials:
 *   E2E_EMAIL    — defaults to alex.lewis@rramelbourne.com
 *   E2E_PASSWORD — REQUIRED, no default (set in .env or pass on CLI)
 *
 * Usage:
 *   E2E_PASSWORD=MyPassword123 npx playwright test
 *
 * If E2E_PASSWORD is not set, a dummy storage-state file is written so the
 * test suite still runs — tests that need auth will skip gracefully.
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const AUTH_FILE = path.join(__dirname, ".auth", "user.json");
const TEST_EMAIL = process.env.E2E_EMAIL ?? "alex.lewis@rramelbourne.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "";

setup("authenticate", async ({ page }) => {
  // Ensure the .auth directory exists
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  if (!TEST_PASSWORD) {
    console.warn(
      "\n⚠  E2E_PASSWORD not set — writing empty auth state.\n" +
        "   Tests requiring login will be skipped.\n" +
        "   Run with: E2E_PASSWORD=<password> npx playwright test\n"
    );
    // Write a minimal valid storage-state so Playwright doesn't error
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  // Navigate to login page
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Session Planner" })
  ).toBeVisible({ timeout: 15_000 });

  // Ensure "Password" tab is active
  const passwordTab = page.getByRole("button", { name: "Password" });
  if (await passwordTab.isVisible()) {
    await passwordTab.click();
  }

  // Fill credentials and submit
  await page.getByPlaceholder("coach@rramelbourne.com").fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard/**", { timeout: 20_000 });

  // Save signed-in state
  await page.context().storageState({ path: AUTH_FILE });
});
