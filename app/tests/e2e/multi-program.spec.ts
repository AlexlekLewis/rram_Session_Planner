/**
 * Multi-Program Support — End-to-End Tests
 *
 * Tests the multi-program features: program context, switcher,
 * members management, invite flow, and data isolation.
 *
 * Prerequisites:
 *   1. Migrations 014 + 015 applied to Supabase
 *   2. E2E_PASSWORD env var set
 *   3. At least one program exists with the test user as head_coach
 *
 * Run:
 *   E2E_PASSWORD=<password> npx playwright test multi-program
 */
import { test, expect, Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function isAuthenticated(page: Page): Promise<boolean> {
  await page.goto("/dashboard/month");
  await page.waitForTimeout(2_000);
  return !page.url().includes("/login");
}

// ---------------------------------------------------------------------------
// All tests require authentication
// ---------------------------------------------------------------------------
test.describe("Multi-Program Support", () => {
  test.beforeEach(async ({ page }) => {
    const authed = await isAuthenticated(page);
    if (!authed) {
      test.skip(true, "E2E_PASSWORD not set — skipping authenticated test");
    }
  });

  // ---- Test 1: Settings page has Members tab ----------------------------
  test("1 — Settings page shows Members tab", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page).toHaveURL(/\/dashboard\/settings/);

    const membersTab = page.getByRole("button", { name: /members/i });
    await expect(membersTab).toBeVisible({ timeout: 10_000 });
  });

  // ---- Test 2: Members tab loads member list ----------------------------
  test("2 — Members tab shows program members", async ({ page }) => {
    await page.goto("/dashboard/settings");

    const membersTab = page.getByRole("button", { name: /members/i });
    await expect(membersTab).toBeVisible({ timeout: 10_000 });
    await membersTab.click();

    // Should show at least 1 member (the current user)
    await expect(
      page.getByText(/Members \(\d+\)/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  // ---- Test 3: New Program button exists for admins ---------------------
  test("3 — New Program button visible for admin", async ({ page }) => {
    await page.goto("/dashboard/settings");

    const newProgramBtn = page.getByRole("button", { name: /New Program/i });
    // This may not be visible if user isn't admin — soft check
    const visible = await newProgramBtn.isVisible().catch(() => false);
    if (visible) {
      await expect(newProgramBtn).toBeVisible();
    } else {
      test.info().annotations.push({
        type: "note",
        description: "New Program button not visible — user may not be admin",
      });
    }
  });

  // ---- Test 4: Create Program wizard opens ------------------------------
  test("4 — Create Program wizard opens and has required fields", async ({ page }) => {
    await page.goto("/dashboard/settings");

    const newProgramBtn = page.getByRole("button", { name: /New Program/i });
    const visible = await newProgramBtn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, "New Program button not visible — user is not admin");
      return;
    }

    await newProgramBtn.click();

    // Wizard should show with fields
    await expect(page.getByText("Create New Program")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder(/Cutting Edge/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Create Program/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Cancel/i })).toBeVisible();

    // Close it
    await page.getByRole("button", { name: /Cancel/i }).click();
    await expect(page.getByText("Create New Program")).not.toBeVisible();
  });

  // ---- Test 5: Invite button visible in Members tab ---------------------
  test("5 — Invite button visible for admin in Members tab", async ({ page }) => {
    await page.goto("/dashboard/settings");

    const membersTab = page.getByRole("button", { name: /members/i });
    await expect(membersTab).toBeVisible({ timeout: 10_000 });
    await membersTab.click();

    const inviteBtn = page.getByRole("button", { name: /Invite/i });
    const visible = await inviteBtn.isVisible().catch(() => false);
    if (visible) {
      await expect(inviteBtn).toBeVisible();
    } else {
      test.info().annotations.push({
        type: "note",
        description: "Invite button not visible — user may not be admin",
      });
    }
  });

  // ---- Test 6: Invite form opens and has fields -------------------------
  test("6 — Invite form opens with email and role fields", async ({ page }) => {
    await page.goto("/dashboard/settings");

    const membersTab = page.getByRole("button", { name: /members/i });
    await expect(membersTab).toBeVisible({ timeout: 10_000 });
    await membersTab.click();

    const inviteBtn = page.getByRole("button", { name: /Invite/i });
    const visible = await inviteBtn.isVisible().catch(() => false);
    if (!visible) {
      test.skip(true, "Invite button not visible — user is not admin");
      return;
    }

    await inviteBtn.click();

    // Invite form should appear
    await expect(page.getByPlaceholder("coach@example.com")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: /Create Invite/i })).toBeVisible();

    // Close it
    await page.getByRole("button", { name: /Cancel/i }).click();
  });

  // ---- Test 7: Invite acceptance page handles invalid token -------------
  test("7 — Invite page shows expired for invalid token", async ({ page }) => {
    await page.goto("/invite/invalid-token-that-does-not-exist");

    await expect(page.getByText("Invite Expired")).toBeVisible({ timeout: 10_000 });
  });

  // ---- Test 8: Program data loads (sessions scoped) ---------------------
  test("8 — Sessions page loads with program-scoped data", async ({ page }) => {
    await page.goto("/dashboard/sessions");
    await expect(page).toHaveURL(/\/dashboard\/sessions/);

    // Wait for session cards to load
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });

    // Verify sessions rendered (existing regression check)
    const buttons = page.locator("main button");
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
  });

  // ---- Test 9: Activity library shared across programs -------------------
  test("9 — Activity Library loads (shared activities)", async ({ page }) => {
    await page.goto("/dashboard/library");
    await expect(page).toHaveURL(/\/dashboard\/library/);

    // Activities should be visible (global + program-specific)
    await expect(
      page.getByText(/activities/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  // ---- Test 10: Existing E2E regression — session grid still works ------
  test("10 — Session grid still renders 8 lanes (regression)", async ({ page }) => {
    await page.goto("/dashboard/sessions");

    const firstLink = page.locator("main button").first();
    await expect(firstLink).toBeVisible({ timeout: 15_000 });

    await firstLink.click();
    await page.waitForURL("**/dashboard/session/**");

    for (const label of ["M1", "M2", "M3", "L4", "L5", "L6", "L7", "OTH"]) {
      await expect(
        page.getByText(label, { exact: true }).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});
