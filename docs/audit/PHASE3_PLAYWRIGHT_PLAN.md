# RRAM Session Planner — Phase 3 Playwright Mobile Plan

**Audit commit:** `84eb77f`
**Authored:** 2026-04-17
**Status:** Plan only — the executing session lands these files once H2 is fixed, not before.

Running the mobile suite **before** H2 lands will flood the results with spurious "horizontal scroll on every viewport" failures and drown the signals that actually matter (tap targets, drawer behaviour, realtime cross-device updates). Land H2 first, then run this.

---

## 1. Config extension — `app/playwright.config.ts`

The current config has one `chromium` project. Add three mobile projects and keep desktop as a baseline. The existing `setup` dependency model (storageState from `./tests/e2e/.auth/user.json`) continues to work unchanged.

Target `projects` array:

```ts
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
  {
    name: "iphone-se",
    use: {
      ...devices["iPhone SE"],      // 375x667
      storageState: "./tests/e2e/.auth/user.json",
    },
    dependencies: ["setup"],
  },
  {
    name: "iphone-14-pro",
    use: {
      ...devices["iPhone 14 Pro"],  // 390x844
      storageState: "./tests/e2e/.auth/user.json",
    },
    dependencies: ["setup"],
  },
  {
    name: "pixel-7",
    use: {
      ...devices["Pixel 7"],        // 412x915
      storageState: "./tests/e2e/.auth/user.json",
    },
    dependencies: ["setup"],
  },
],
```

No other changes to the config. The `webServer` block and `BASE_URL` handling stay as-is.

Rationale for device selection:

- **iPhone SE (375)** — the narrowest viewport in meaningful active use. If the grid survives 375, it survives everything above.
- **iPhone 14 Pro (390)** — the median phone viewport today; catches anything that breaks specifically around notch and safe-area.
- **Pixel 7 (412)** — Android Chrome reference; catches touch-event differences vs iOS Safari-style WebKit.

Not adding an iPad project in Phase 3: tablets should be covered by the default desktop project at a resized viewport. Revisit if H2 regressions show up in the 640–768 band.

---

## 2. New test file — `app/tests/e2e/mobile.spec.ts`

Scope: the mobile-specific failure modes the audit identified — H2 (grid overflow), tap target size, drawer behaviour on narrow viewports, sticky positioning under scroll. Does **not** duplicate desktop flow tests.

### Test matrix

| Test | What it proves | Files it exercises |
|---|---|---|
| `grid fits viewport on phone without forced horizontal scroll` | H2 fix | `SessionGrid.tsx`, `GridCanvas.tsx` |
| `lane headers and time axis stay sticky under scroll` | layout regression | `SessionGrid.tsx`, `LaneHeader.tsx`, `TimeAxis.tsx` |
| `primary buttons meet 44px tap-target minimum` | WCAG 2.5.5 | nav bar, session toolbar, block modal |
| `activity library opens as a bottom sheet drawer on narrow viewports` | mobile UX | `session/[id]/page.tsx` |
| `editing a block on phone persists across reload` | save layer on mobile (catches H7 retry loop if C1 not yet landed) | `useAutoSave.ts`, session page |

### Inline spec

Save as `app/tests/e2e/mobile.spec.ts`:

```ts
import { test, expect } from "@playwright/test"

// All tests in this file run for every mobile project AND desktop,
// so we tag the mobile-specific assertions to skip on desktop when sensible.
const MOBILE_PROJECTS = ["iphone-se", "iphone-14-pro", "pixel-7"]

test.describe("mobile — session grid", () => {
  test("grid fits viewport without unconditional horizontal scroll", async ({ page, viewport }, testInfo) => {
    test.skip(!MOBILE_PROJECTS.includes(testInfo.project.name), "mobile-only")

    await page.goto("/dashboard")
    // Navigate to the first accessible session. Selector intentionally generic;
    // adjust to a data-testid when the app adds one.
    await page.getByRole("link", { name: /session/i }).first().click()

    const grid = page.locator("[data-grid-root], .session-grid-root").first()
    await expect(grid).toBeVisible()

    const gridBox = await grid.boundingBox()
    expect(gridBox).not.toBeNull()
    // The grid width should be <= viewport width + 1px tolerance, OR horizontal
    // scroll is explicitly allowed (lane count × 72 > viewport). We assert the
    // outer container never forces a minimum wider than the viewport.
    const viewportWidth = viewport!.width
    expect(gridBox!.width).toBeLessThanOrEqual(viewportWidth + 1)
  })

  test("lane headers and time axis stay sticky under scroll", async ({ page }, testInfo) => {
    test.skip(!MOBILE_PROJECTS.includes(testInfo.project.name), "mobile-only")

    await page.goto("/dashboard")
    await page.getByRole("link", { name: /session/i }).first().click()

    const timeAxis = page.locator("[data-time-axis]").first()
    const laneHeader = page.locator("[data-lane-header]").first()

    const axisBefore = await timeAxis.boundingBox()
    const headerBefore = await laneHeader.boundingBox()

    // Scroll the grid container vertically and horizontally
    await page.locator("[data-grid-root]").first().evaluate((el) => {
      el.scrollTop = 200
      el.scrollLeft = 200
    })

    const axisAfter = await timeAxis.boundingBox()
    const headerAfter = await laneHeader.boundingBox()

    // Time axis should not move horizontally (sticky left)
    expect(Math.abs(axisAfter!.x - axisBefore!.x)).toBeLessThanOrEqual(1)
    // Lane header should not move vertically (sticky top)
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
      if (await el.count() === 0) continue
      const box = await el.boundingBox()
      expect(box, `missing box for ${sel}`).not.toBeNull()
      expect(box!.width, `${sel} width`).toBeGreaterThanOrEqual(44)
      expect(box!.height, `${sel} height`).toBeGreaterThanOrEqual(44)
    }
  })
})

test.describe("mobile — activity library drawer", () => {
  test("activity library opens as bottom-sheet on narrow viewports", async ({ page }, testInfo) => {
    test.skip(!MOBILE_PROJECTS.includes(testInfo.project.name), "mobile-only")

    await page.goto("/dashboard")
    await page.getByRole("link", { name: /session/i }).first().click()

    // Toggle exists per code review (page.tsx:402-408). Text reads
    // "Activity Library" when closed.
    await page.getByRole("button", { name: /activity library/i }).click()

    const drawer = page.locator("[data-activity-library-drawer]").first()
    await expect(drawer).toBeVisible()

    const drawerBox = await drawer.boundingBox()
    const viewportHeight = page.viewportSize()!.height
    // Bottom-sheet should occupy the lower half+ of the viewport on mobile,
    // not appear as a desktop-style right rail.
    expect(drawerBox!.y).toBeGreaterThan(viewportHeight * 0.3)
    expect(drawerBox!.y + drawerBox!.height).toBeGreaterThanOrEqual(viewportHeight - 1)
  })
})

test.describe("mobile — save layer", () => {
  test("editing a block persists across reload on phone", async ({ page }, testInfo) => {
    test.skip(!MOBILE_PROJECTS.includes(testInfo.project.name), "mobile-only")

    await page.goto("/dashboard")
    await page.getByRole("link", { name: /session/i }).first().click()

    // Open an existing block — selector assumes first block is clickable.
    const firstBlock = page.locator("[data-session-block]").first()
    await firstBlock.click()

    const notesField = page.getByLabel(/coaching notes/i)
    const uniqueMarker = `mobile-e2e-${Date.now()}`
    await notesField.fill(uniqueMarker)

    // Wait for save status to settle
    await expect(page.locator("[data-save-status]")).toHaveText(/saved/i, { timeout: 15_000 })

    await page.reload()

    await firstBlock.click()
    await expect(page.getByLabel(/coaching notes/i)).toHaveValue(uniqueMarker)
  })
})
```

### Required test-id additions (non-code, noted here for the executing session)

The tests above use a mix of role selectors and `data-*` attributes. The following attributes should be added to existing components so the tests are robust against copy changes:

- `data-grid-root` on the outermost `SessionGrid` container.
- `data-time-axis` on the `TimeAxis` root.
- `data-lane-header` on the `LaneHeader` root.
- `data-activity-library-drawer` on the drawer wrapper (when open).
- `data-session-block` on each rendered block in the grid.
- `data-save-status` on the save-status text span in the session header.

These are additive and low-risk; include them in the H2 commit.

---

## 3. Run order

Once the config and spec files are in place:

```bash
cd app
npx playwright install --with-deps
E2E_BASE_URL=<production_or_staging_url> \
E2E_EMAIL=<e2e_test_user_email> \
E2E_PASSWORD=<e2e_test_user_password> \
npx playwright test mobile.spec.ts
```

Expected runtime: ~90 seconds across three mobile projects plus desktop baseline. HTML report lands in `app/playwright-report/` — attach to the PR.

---

## 4. CI integration

Append to `.github/workflows/ci.yml` (or wherever the existing e2e job lives):

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium webkit

- name: Run mobile e2e
  env:
    E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}
    E2E_EMAIL: ${{ secrets.E2E_TEST_USER_EMAIL }}
    E2E_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
  run: |
    cd app
    npx playwright test mobile.spec.ts --project=iphone-se --project=iphone-14-pro --project=pixel-7
```

Only mobile projects on CI to keep the runtime predictable; desktop smoke continues on every push.

---

## 5. What this plan intentionally does NOT cover

- Activity library drag-and-drop behaviour — deferred to a separate e2e file (`drag-drop.spec.ts`) because touch drag semantics differ enough from mouse to warrant their own matrix.
- Realtime cross-device concurrency — needs two browser contexts; deferred to `realtime.spec.ts`.
- Accessibility audits (axe-core) — deferred to a11y pass after P0 fixes land.

Each deferred area is tracked in `fix-list.md` under its own P2/P3 entry.

---

## 6. Known risks in this plan

- **Selectors are fragile until test-ids are added.** The spec uses `getByRole` where possible, but the grid root, time axis, lane header, and drawer all need `data-*` attributes to be reliable. These additions are listed above and must land in the same PR as H2.
- **E2E user permissions matter.** After C2 lands, the e2e user must be enrolled in `sp_program_members` for the program it's testing against. Update `global-setup.ts` or seed the user via a migration.
- **Horizontal-scroll test is asymmetric.** The spec asserts `gridBox.width <= viewportWidth`. That's correct for the outer container. If the test fails because the *inner* grid canvas overflows, the failure is expected (and desired) — it means lane count × 72 exceeds viewport, and the overflow should be a `overflow-x: auto` inside the outer container, not a force on the outer container itself.
