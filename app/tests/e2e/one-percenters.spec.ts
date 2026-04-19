/**
 * RRA Session Planner — 1%er Tests
 *
 * Tests for specific UX details Alex called out:
 *   - Manual time/lane editing in BlockDetailPanel (currently missing)
 *   - Modal dismiss contract consistency (backdrop click, ESC)
 *   - Click-off to exit modal before opening a new cell
 *
 * Run:
 *   E2E_PASSWORD=<password> npx playwright test one-percenters
 *
 * These tests are authored against the CURRENT broken state. They are
 * expected to fail until HIGH-001 / HIGH-002 / HIGH-003 are fixed.
 */
import { test, expect, Page } from "@playwright/test";

async function isAuthenticated(page: Page): Promise<boolean> {
  await page.goto("/dashboard/month");
  await page.waitForTimeout(2_000);
  return !page.url().includes("/login");
}

async function openFirstSession(page: Page) {
  await page.goto("/dashboard/sessions");
  const firstLink = page.locator("main button").first();
  await expect(firstLink).toBeVisible({ timeout: 15_000 });
  await firstLink.click();
  await page.waitForURL("**/dashboard/session/**");
  await expect(page.getByText("M1", { exact: true }).first()).toBeVisible({
    timeout: 10_000,
  });
}

test.describe("1%ers — UX details", () => {
  test.beforeEach(async ({ page }) => {
    const authed = await isAuthenticated(page);
    if (!authed) test.skip(true, "E2E_PASSWORD not set — skipping");
  });

  // ---- HIGH-002: CreateBlockModal closes on ESC -----------------------------
  test("HIGH-002a — CreateBlockModal closes on ESC", async ({ page }) => {
    await openFirstSession(page);

    const gridArea = page.locator("main").first();
    const box = await gridArea.boundingBox();
    test.skip(!box, "Grid not found");
    if (!box) return;

    // Drag a small selection to open the create modal
    const sx = box.x + 200;
    const sy = box.y + 300;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx + 80, sy + 40);
    await page.mouse.up();

    const modal = page.getByText("New Activity Block");
    const opened = await modal.isVisible({ timeout: 3_000 }).catch(() => false);
    test.skip(!opened, "Modal did not open via drag — interaction path differs");

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible({ timeout: 2_000 });
  });

  // ---- HIGH-002b: CreateBlockModal closes on backdrop click -----------------
  test("HIGH-002b — CreateBlockModal closes on backdrop click", async ({ page }) => {
    await openFirstSession(page);

    const gridArea = page.locator("main").first();
    const box = await gridArea.boundingBox();
    if (!box) test.skip(true, "Grid not found");
    if (!box) return;

    const sx = box.x + 200;
    const sy = box.y + 300;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx + 80, sy + 40);
    await page.mouse.up();

    const modal = page.getByText("New Activity Block");
    const opened = await modal.isVisible({ timeout: 3_000 }).catch(() => false);
    test.skip(!opened, "Modal did not open via drag");

    // Click on backdrop (top-left corner, should be backdrop not modal body)
    await page.mouse.click(10, 10);
    await expect(modal).not.toBeVisible({ timeout: 2_000 });
  });

  // ---- HIGH-002c: BlockDetailPanel closes on ESC (now a modal) --------
  test("HIGH-002c — BlockDetailPanel closes on ESC", async ({ page }) => {
    await openFirstSession(page);

    // Open any block's detail panel — find a rendered block via test ID or class
    const firstBlock = page.locator('[class*="GridBlock"], [data-block-id]').first();
    const hasBlock = await firstBlock.isVisible({ timeout: 3_000 }).catch(() => false);
    test.skip(!hasBlock, "No blocks in session — cannot test detail panel");

    await firstBlock.click();
    // BlockDetailPanel renders the close button with aria-label "Close block detail panel"
    const panel = page.locator('[aria-label="Close block detail panel"]');
    await expect(panel).toBeVisible({ timeout: 3_000 });

    await page.keyboard.press("Escape");
    // EXPECTED: panel dismisses. CURRENT: panel stays visible.
    await expect(panel).not.toBeVisible({ timeout: 2_000 });
  });

  // ---- HIGH-001: BlockDetailPanel exposes manual time/lane inputs ----------
  test("HIGH-001 — BlockDetailPanel exposes time_start, time_end, lane_start, lane_end", async ({
    page,
  }) => {
    await openFirstSession(page);

    const firstBlock = page.locator('[class*="GridBlock"], [data-block-id]').first();
    const hasBlock = await firstBlock.isVisible({ timeout: 3_000 }).catch(() => false);
    test.skip(!hasBlock, "No blocks in session — cannot test");

    await firstBlock.click();

    // These labels do not exist yet; the test asserts what the panel SHOULD expose.
    await expect(page.getByLabel(/time start/i)).toBeVisible({ timeout: 2_000 });
    await expect(page.getByLabel(/time end/i)).toBeVisible({ timeout: 2_000 });
    await expect(page.getByLabel(/lane start/i)).toBeVisible({ timeout: 2_000 });
    await expect(page.getByLabel(/lane end/i)).toBeVisible({ timeout: 2_000 });
  });

  // ---- HIGH-003: Opening a new grid selection dismisses BlockDetailPanel ----
  test("HIGH-003 — Starting a new grid drag dismisses the detail panel", async ({
    page,
  }) => {
    await openFirstSession(page);

    const firstBlock = page.locator('[class*="GridBlock"], [data-block-id]').first();
    const hasBlock = await firstBlock.isVisible({ timeout: 3_000 }).catch(() => false);
    test.skip(!hasBlock, "No blocks in session — cannot test");

    await firstBlock.click();
    const panel = page.locator('[aria-label="Close block detail panel"]');
    await expect(panel).toBeVisible({ timeout: 3_000 });

    // Start a new drag selection on an empty grid area
    const gridArea = page.locator("main").first();
    const box = await gridArea.boundingBox();
    if (!box) test.skip(true, "Grid not found");
    if (!box) return;

    const sx = box.x + 500; // further right — empty lane
    const sy = box.y + 400;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx + 60, sy + 30);
    await page.mouse.up();

    // EXPECTED: detail panel dismisses when a new selection/modal opens
    await expect(panel).not.toBeVisible({ timeout: 2_000 });
  });

  // ---- HIGH-005: CopyHourDialog submit disables during async -----------
  test("HIGH-005 — [EXPECTED FAIL] Copy Hour submit disables while running", async ({
    page,
  }) => {
    await openFirstSession(page);
    const copyBtn = page.getByRole("button", { name: /Copy Hour/i });
    await expect(copyBtn).toBeVisible({ timeout: 10_000 });
    await copyBtn.click();

    const submit = page.getByRole("button", { name: /Copy Blocks/i });
    await expect(submit).toBeVisible({ timeout: 3_000 });

    // Click and immediately assert disabled state (catches no-op copy, but the button
    // should still transition to disabled while the callback runs).
    await submit.click();
    // EXPECTED: disabled. CURRENT: stays enabled (user can double-click).
    await expect(submit).toBeDisabled({ timeout: 500 });
  });
});

test.describe("1%ers — consistency across modals", () => {
  test.beforeEach(async ({ page }) => {
    const authed = await isAuthenticated(page);
    if (!authed) test.skip(true, "E2E_PASSWORD not set — skipping");
  });

  // ---- HIGH-007: AssistantPanel thread dropdown closes on outside click ----
  test("HIGH-007 — AssistantPanel thread dropdown closes on outside click", async ({
    page,
  }) => {
    await page.goto("/dashboard/month");
    const aiBtn = page.getByRole("button", { name: /AI Coach/i });
    await aiBtn.click();

    // Open the thread dropdown
    const threadBtn = page.getByRole("button", { name: /threads|history/i }).first();
    const hasThreadBtn = await threadBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    test.skip(!hasThreadBtn, "Thread dropdown button not found");

    await threadBtn.click();
    // Dropdown content should be visible (loose selector — adapt once we see it)
    const dropdownItem = page.locator('[role="listbox"], [data-thread-item]').first();
    const opened = await dropdownItem.isVisible({ timeout: 2_000 }).catch(() => false);
    test.skip(!opened, "Thread dropdown did not open");

    // Click outside (on body)
    await page.mouse.click(10, 200);

    // EXPECTED: dropdown closes. CURRENT: stays open.
    await expect(dropdownItem).not.toBeVisible({ timeout: 2_000 });
  });
});
