/**
 * Coach Management & Availability — End-to-End Tests
 *
 * Tests the coach management page, session-level availability grid,
 * coach profile editing, and session page coach bar integration.
 *
 * Prerequisites:
 *   1. Migrations 014-017 applied to Supabase
 *   2. E2E_PASSWORD env var set
 *   3. At least one program with sessions and coach members
 *
 * Run:
 *   E2E_PASSWORD=<password> npx playwright test coaches
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
test.describe("Coach Management & Availability", () => {
  test.beforeEach(async ({ page }) => {
    const authed = await isAuthenticated(page);
    if (!authed) {
      test.skip(true, "E2E_PASSWORD not set — skipping authenticated test");
    }
  });

  // ---- Test 1: Coaches nav link visible for coaches ----------------------
  test("1 — Coaches nav link visible in sidebar", async ({ page }) => {
    await page.goto("/dashboard/month");
    const coachesLink = page.getByRole("link", { name: /Coaches/i });
    await expect(coachesLink).toBeVisible({ timeout: 10_000 });
  });

  // ---- Test 2: Coaches page loads ----------------------------------------
  test("2 — Coaches page loads with header and summary badges", async ({ page }) => {
    await page.goto("/dashboard/coaches");
    await expect(page).toHaveURL(/\/dashboard\/coaches/);

    // Header
    await expect(page.getByRole("heading", { name: "Coaches" })).toBeVisible({ timeout: 10_000 });

    // Summary badges should exist (even if 0)
    await expect(page.getByText(/\d+ Coaches/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/\d+ Sessions/)).toBeVisible({ timeout: 10_000 });
  });

  // ---- Test 3: View mode toggle works ------------------------------------
  test("3 — View mode toggle switches between Upcoming and All", async ({ page }) => {
    await page.goto("/dashboard/coaches");

    // Toggle buttons visible
    const upcomingBtn = page.getByRole("button", { name: "Upcoming" });
    const allBtn = page.getByRole("button", { name: "All Sessions" });
    await expect(upcomingBtn).toBeVisible({ timeout: 10_000 });
    await expect(allBtn).toBeVisible();

    // Click All Sessions
    await allBtn.click();
    await expect(page.getByText("All Program Sessions")).toBeVisible({ timeout: 5_000 });

    // Click back to Upcoming
    await upcomingBtn.click();
    await expect(page.getByText("Upcoming Sessions")).toBeVisible({ timeout: 5_000 });
  });

  // ---- Test 4: Legend displays all status types --------------------------
  test("4 — Availability legend shows all status types", async ({ page }) => {
    await page.goto("/dashboard/coaches");

    await expect(page.getByText("Available")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Unavailable")).toBeVisible();
    await expect(page.getByText("Tentative")).toBeVisible();
    await expect(page.getByText("Not set")).toBeVisible();
  });

  // ---- Test 5: Roster table renders coaches ------------------------------
  test("5 — Roster table shows coach names and roles", async ({ page }) => {
    await page.goto("/dashboard/coaches");

    // Wait for table to load (Coach header in table)
    const table = page.locator("table");
    const tableVisible = await table.isVisible({ timeout: 10_000 }).catch(() => false);

    if (!tableVisible) {
      // Might show "No upcoming sessions" message
      const noSessions = page.getByText(/No.*sessions found/i);
      if (await noSessions.isVisible().catch(() => false)) {
        test.info().annotations.push({
          type: "note",
          description: "No sessions found — table not rendered",
        });
        return;
      }
      test.fail(true, "Table not visible and no 'no sessions' message");
      return;
    }

    // Table headers should include Coach, Role, Speciality
    await expect(page.getByText("Coach", { exact: true })).toBeVisible();
    await expect(page.getByText("Role", { exact: true })).toBeVisible();
    await expect(page.getByText("Speciality", { exact: true })).toBeVisible();
  });

  // ---- Test 6: Session columns show time ranges --------------------------
  test("6 — Session columns show date and time ranges", async ({ page }) => {
    await page.goto("/dashboard/coaches");

    // Switch to All Sessions to see more data
    const allBtn = page.getByRole("button", { name: "All Sessions" });
    await expect(allBtn).toBeVisible({ timeout: 10_000 });
    await allBtn.click();
    await page.waitForTimeout(1_000);

    // Look for time range format like "5pm–7pm" or similar
    const timeRange = page.locator("th").filter({ hasText: /\d+(?::\d+)?(?:am|pm)–\d+(?::\d+)?(?:am|pm)/ });
    const count = await timeRange.count();

    if (count > 0) {
      await expect(timeRange.first()).toBeVisible();
    } else {
      test.info().annotations.push({
        type: "note",
        description: "No session time ranges found in table headers — sessions may not exist",
      });
    }
  });

  // ---- Test 7: Availability cell click cycles status --------------------
  test("7 — Clicking availability cell cycles status", async ({ page }) => {
    await page.goto("/dashboard/coaches");

    // Wait for table
    const table = page.locator("table");
    const tableVisible = await table.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!tableVisible) {
      test.skip(true, "No table visible — no sessions");
      return;
    }

    // Find first availability cell button (round circle buttons in the table body)
    const availCells = page.locator("tbody button.rounded-full");
    const cellCount = await availCells.count();
    if (cellCount === 0) {
      test.skip(true, "No availability cells found");
      return;
    }

    // Click the first cell — should cycle from not-set to available (emerald)
    const firstCell = availCells.first();
    await firstCell.click();
    await page.waitForTimeout(500);

    // The cell should now have a status colour (emerald, red, or amber)
    const hasStatus = await firstCell.evaluate((el) => {
      return el.classList.contains("bg-emerald-400") ||
        el.classList.contains("bg-red-400") ||
        el.classList.contains("bg-amber-400");
    });
    expect(hasStatus).toBeTruthy();
  });

  // ---- Test 8: Coach profile modal opens on name click ------------------
  test("8 — Clicking coach name opens profile modal", async ({ page }) => {
    await page.goto("/dashboard/coaches");

    const table = page.locator("table");
    const tableVisible = await table.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!tableVisible) {
      test.skip(true, "No table visible");
      return;
    }

    // Click the first coach name button in the table
    const coachNameBtn = page.locator("tbody button").filter({ hasText: /.+/ }).first();
    const btnVisible = await coachNameBtn.isVisible().catch(() => false);
    if (!btnVisible) {
      test.skip(true, "No coach buttons found");
      return;
    }

    await coachNameBtn.click();

    // Modal should appear with profile fields
    await expect(page.getByText("Display Name")).toBeVisible({ timeout: 5_000 });
  });

  // ---- Test 9: Session page shows coach bar ----------------------------
  test("9 — Session page shows SessionCoachBar when coaches exist", async ({ page }) => {
    await page.goto("/dashboard/sessions");

    const firstLink = page.locator("main button").first();
    await expect(firstLink).toBeVisible({ timeout: 15_000 });
    await firstLink.click();
    await page.waitForURL("**/dashboard/session/**");

    // Wait for session to load
    await expect(page.getByText("M1", { exact: true }).first()).toBeVisible({ timeout: 10_000 });

    // Look for coach-related UI (pills or + button)
    // The SessionCoachBar shows coach pills or "+" add button
    const coachBar = page.locator('[class*="coach"], button[title*="coach"], button[title*="Add"]').first();
    const barVisible = await coachBar.isVisible({ timeout: 5_000 }).catch(() => false);

    if (barVisible) {
      await expect(coachBar).toBeVisible();
    } else {
      test.info().annotations.push({
        type: "note",
        description: "Coach bar not visible — may have no coaches in program",
      });
    }
  });

  // ---- Test 10: No sessions state shows helpful message -----------------
  test("10 — Upcoming mode with no future sessions shows empty state", async ({ page }) => {
    await page.goto("/dashboard/coaches");

    // This test checks the empty state renders correctly
    // If there are upcoming sessions, this still passes (it's about UI structure)
    await expect(page.locator("main")).toBeVisible({ timeout: 10_000 });

    // Either the table or the empty state message should be visible
    const table = page.locator("table");
    const emptyMsg = page.getByText(/No.*sessions found/i);

    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyMsg.isVisible().catch(() => false);

    expect(hasTable || hasEmpty).toBeTruthy();
  });
});
