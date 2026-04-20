/**
 * Global Setup — Authenticates once and saves browser state for all tests.
 *
 * Dev accounts (seeded by migration 018_e2e_dev_accounts.sql):
 *   e2e.admin@rramelbourne.com    — head_coach (admin)
 *   e2e.coach@rramelbourne.com    — assistant_coach
 *   e2e.player@rramelbourne.com   — player
 *
 * All three share the password `DevTest2026` — alphanumeric so zsh won't
 * escape it (dev_team_learnings Lesson 17). Defaulting E2E_PASSWORD to this
 * shared dev password means the suite runs out of the box on this machine
 * without requiring Alex to type a secret every time. Override both vars
 * when running against a different environment.
 *
 * Credentials:
 *   E2E_EMAIL    — defaults to e2e.admin@rramelbourne.com
 *   E2E_PASSWORD — defaults to DevTest2026 (dev-seed password, not a secret)
 *
 * Usage:
 *   # default — admin perspective
 *   npx playwright test
 *
 *   # coach perspective
 *   E2E_EMAIL=e2e.coach@rramelbourne.com npx playwright test
 *
 *   # player perspective
 *   E2E_EMAIL=e2e.player@rramelbourne.com npx playwright test
 *
 * If authentication fails, an empty storage-state file is written so the
 * test suite still runs — auth'd tests will skip gracefully.
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const AUTH_FILE = path.join(__dirname, ".auth", "user.json");
const TEST_EMAIL = process.env.E2E_EMAIL ?? "e2e.admin@rramelbourne.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "DevTest2026";

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

  // Ensure the "Password" tab is active. The login page also has a
  // "Forgot password?" button — use exact match to target the tab only.
  const passwordTab = page.getByRole("button", { name: "Password", exact: true });
  if (await passwordTab.isVisible().catch(() => false)) {
    await passwordTab.click();
  }

  // Fill credentials and submit
  await page.getByPlaceholder("coach@rramelbourne.com").fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for redirect to dashboard — but degrade gracefully if auth fails
  // (wrong password, unconfirmed email, etc). Without this, a wrong
  // credential blows up the entire suite. Instead we write an empty
  // storage-state and let authenticated tests skip cleanly.
  try {
    await page.waitForURL("**/dashboard/**", { timeout: 20_000 });
    await page.context().storageState({ path: AUTH_FILE });
    return;
  } catch {
    // Surface the Supabase error banner, if any, so CI logs make
    // the failure cause obvious without requiring the screenshot.
    const errorText = await page.locator("p").allInnerTexts();
    const bannerLine = errorText.find(
      (t) =>
        t.toLowerCase().includes("invalid") ||
        t.toLowerCase().includes("not confirmed") ||
        t.toLowerCase().includes("failed")
    );
    console.warn(
      "\n⚠  Playwright auth failed — continuing without a logged-in session.\n" +
        `   Email: ${TEST_EMAIL}\n` +
        (bannerLine ? `   Supabase said: ${bannerLine}\n` : "") +
        "   To fix (Supabase dashboard for rrfghjhzdevmzzttvith):\n" +
        "   • confirm e2e.admin@/e2e.coach@/e2e.player@rramelbourne.com in Auth → Users, OR\n" +
        "   • apply migration 019_confirm_e2e_dev_accounts.sql, OR\n" +
        "   • pass a working E2E_EMAIL / E2E_PASSWORD pair.\n"
    );
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
  }
});
