/**
 * Mobile E2E — Phase 3 of the 2026-04-17 production-readiness audit.
 *
 * Covers the mobile-specific failure modes the audit identified:
 *   - H2: grid overflow on narrow viewports
 *   - sticky lane header + time axis under scroll
 *   - WCAG 2.5.5 tap-target minimums
 *   - activity library drawer behaviour on narrow viewports
 *   - save-layer persistence on phone (regression guard for H7)
 *
 * Do not duplicate desktop flow tests here; desktop smoke lives elsewhere.
 */
import { test, expect } from "@playwright/test"

const MOBILE_PROJECTS = ["iphone-se", "iphone-14-pro", "pixel-7"]

test.describe("mobile — session grid", () => {
  test("grid fits viewport without unconditional horizontal scroll", async ({ page, viewport }, testInfo) => {
    test.skip(!MOBILE_PROJECTS.includes(testInfo.project.name), "mobile-only")

    await page.goto("/dashboard")
    await page.getByRole("link", { name: /session/i }).first().click()

    const grid = page.locator("[data-grid-root]").first()
    await expect(grid).toBeVisible()

    const gridBox = await grid.boundingBox()
    expect(gridBox).not.toBeNull()

    const viewportWidth = viewport!.width
    // The outer container must not force a minimum wider than the viewport.
    // Internal horizontal scroll is allowed when lane_count × 72 exceeds
    // viewport — that's handled by overflow-x: auto on the outer container
    // and is not what this assertion is testing.
    expect(gridBox!.width).toBeLessThanOrEqual(viewportWidth + 1)
  })

  test("lane headers and time axis stay sticky under scroll", async ({ page }, testInfo) => {
    test.skip(!MOBILE_PROJECTS.includes(testInfo.project.name), "mobile-only")

    await page.goto("/dashboard")
    await page.getByRole("link", { name: /session/i }).first().click()

    const timeAxis = page.locator("[data-time-axis]").first()
    const laneHeader = page.locator("[data-lane-header]").first()

    await expect(timeAxis).toBeVisible()
    await expect(laneHeader).toBeVisible()

    const axisBefore = await timeAxis.boundingBox()
    const headerBefore = await laneHeader.boundingBox()

    await page.locator("[data-grid-root]").first().evaluate((el) => {
      el.scrollTop = 200
      el.scrollLeft = 200
    })

    const axisAfter = await timeAxis.boundingBox()
    const headerAfter = await laneHeader.boundingBox()

    expect(Math.abs(axisAfter!.x - axisBefore!.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(headerAfter!.y - headerBefore!.y)).toBeLessThanOrEqual(1)
  })
})

test.describe("mobile — tap targets", () => {
  test("primary buttons meet 44x44px minimum", async ({ page }, testInfo) => {
    test.skip(!MOBILE_PROJECTS.includes(testInfo.project.name), "mobile-only")

    await page.goto("/dashboard")

    const selectors = [
      "nav a[href*='/dashboard']",
      "button:has-text('New Session')",
      "button[aria-label*='menu' i]",
    ]

    for (const sel of selectors) {
      const el = page.locator(sel).first()
      if ((await el.count()) === 0) continue
      const box = await el.boundingBox()
      if (!box) continue
      expect.soft(box.width, `${sel} width`).toBeGreaterThanOrEqual(44)
      expect.soft(box.height, `${sel} height`).toBeGreaterThanOrEqual(44)
    }
  })
})

test.describe("mobile — activity library drawer", () => {
  test("activity library opens and is reachable on narrow viewports", async ({ page }, testInfo) => {
    test.skip(!MOBILE_PROJECTS.includes(testInfo.project.name), "mobile-only")

    await page.goto("/dashboard")
    await page.getByRole("link", { name: /session/i }).first().click()

    // Per audit, toggle text reads "Activity Library" when closed.
    const toggle = page.getByRole("button", { name: /activity library/i })
    if ((await toggle.count()) === 0) {
      test.skip()
      return
    }
    await toggle.click()

    // Drawer/rail — selector is permissive to accommodate both bottom-sheet
    // and side-drawer implementations; the test only asserts it becomes
    // reachable after the toggle click.
    const drawer = page
      .locator("[data-activity-library-drawer], [data-testid='activity-library']")
      .first()
    await expect(drawer).toBeVisible({ timeout: 5_000 })
  })
})

test.describe("mobile — save layer", () => {
  test("editing a block persists across reload on phone", async ({ page }, testInfo) => {
    test.skip(!MOBILE_PROJECTS.includes(testInfo.project.name), "mobile-only")

    await page.goto("/dashboard")
    await page.getByRole("link", { name: /session/i }).first().click()

    const firstBlock = page.locator("[data-session-block]").first()
    if ((await firstBlock.count()) === 0) {
      test.skip()
      return
    }
    await firstBlock.click()

    const notesField = page.getByLabel(/coaching notes/i)
    if ((await notesField.count()) === 0) {
      test.skip()
      return
    }

    const uniqueMarker = `mobile-e2e-${Date.now()}`
    await notesField.fill(uniqueMarker)

    // Wait for save status to settle to "saved".
    await expect(page.locator("[data-save-status]")).toHaveText(/saved/i, {
      timeout: 15_000,
    })

    await page.reload()

    await firstBlock.click()
    await expect(page.getByLabel(/coaching notes/i)).toHaveValue(uniqueMarker)
  })
})
