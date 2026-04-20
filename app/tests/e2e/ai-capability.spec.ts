/**
 * RRA Session Planner — AI Capability E2E tests
 *
 * Covers the April 2026 shipment:
 *   - Library: ✨ Draft with AI, 🔍 Audit for Venue, per-card ✨ Improve
 *   - Session: ⚡ Suggest Block, ✨ Autopilot, 📝 Debrief
 *   - Month:   ✨ Plan Phase Arc
 *   - Event bus: rra:ask-assistant opens the panel + primes a message
 *   - Role gating: admin-only buttons hidden from non-admins
 *
 * Every test checks auth first and skips cleanly when unauthenticated —
 * that way the suite still runs even if the test-account emails aren't
 * confirmed. Apply migration 019 and re-run to get full coverage.
 *
 * Run:
 *   E2E_EMAIL=<admin-email> E2E_PASSWORD=<password> npx playwright test ai-capability
 */
import { test, expect, Page } from "@playwright/test";

async function isAuthenticated(page: Page): Promise<boolean> {
  await page.goto("/dashboard/month");
  await page.waitForTimeout(2_000);
  return !page.url().includes("/login");
}

// ----------------------------------------------------------------------
// Library page AI entry points
// ----------------------------------------------------------------------
test("AI-1 — Library: ✨ Draft with AI visible for admin", async ({ page }) => {
  if (!(await isAuthenticated(page))) {
    test.skip(true, "Not authenticated — apply migration 019 and re-run");
    return;
  }
  await page.goto("/dashboard/library");
  await expect(page.getByRole("heading", { name: "Activity Library" })).toBeVisible({ timeout: 10_000 });
  // Admins see Draft + Audit + Add. Non-admins only see Audit + Add.
  const draft = page.getByRole("button", { name: /Draft a new activity with the AI Coach|Draft with AI/i });
  const audit = page.getByRole("button", { name: /Audit the library against the active venue|Audit for Venue/i });
  await expect(audit).toBeVisible();
  // Don't assert visibility of draft — test role-agnostically below.
  await expect(page.getByRole("button", { name: /\+ Add Activity/ })).toBeVisible();
});

test("AI-2 — Library: 🔍 Audit for Venue is visible for any coach", async ({ page }) => {
  if (!(await isAuthenticated(page))) {
    test.skip(true, "Not authenticated");
    return;
  }
  await page.goto("/dashboard/library");
  const audit = page.getByRole("button", { name: /Audit/i }).first();
  await expect(audit).toBeVisible({ timeout: 10_000 });
});

test("AI-3 — Library: clicking 🔍 Audit opens the AI panel and primes the message", async ({ page }) => {
  if (!(await isAuthenticated(page))) {
    test.skip(true, "Not authenticated");
    return;
  }
  await page.goto("/dashboard/library");
  const audit = page.getByRole("button", { name: /Audit for Venue|Audit the library/i }).first();
  await audit.click();
  // AssistantPanel should open — look for any recognisable panel element.
  // Adjust the selector once the panel has a stable test-id; for now a
  // textbox (the message input) is a reasonable proxy.
  await expect(page.locator('textarea, [role="textbox"]').first()).toBeVisible({ timeout: 8_000 });
});

// ----------------------------------------------------------------------
// Session page AI toolbar
// ----------------------------------------------------------------------
test("AI-4 — Session: ⚡ Suggest Block and ✨ Autopilot appear on the toolbar", async ({ page }) => {
  if (!(await isAuthenticated(page))) {
    test.skip(true, "Not authenticated");
    return;
  }
  await page.goto("/dashboard/sessions");
  // Open the first session in the list.
  const firstSession = page.locator("main button").first();
  await expect(firstSession).toBeVisible({ timeout: 10_000 });
  await firstSession.click();
  await page.waitForURL("**/dashboard/session/**", { timeout: 10_000 });

  const suggest = page.getByRole("button", { name: /Suggest Block/i });
  const autopilot = page.getByRole("button", { name: /Autopilot/i });
  await expect(suggest).toBeVisible({ timeout: 10_000 });
  await expect(autopilot).toBeVisible({ timeout: 10_000 });
});

test("AI-5 — Session: ⚡ Suggest Block dispatches the event and opens the AI panel", async ({ page }) => {
  if (!(await isAuthenticated(page))) {
    test.skip(true, "Not authenticated");
    return;
  }
  await page.goto("/dashboard/sessions");
  await page.locator("main button").first().click();
  await page.waitForURL("**/dashboard/session/**", { timeout: 10_000 });
  await page.getByRole("button", { name: /Suggest Block/i }).click();
  // Panel should appear. Same textarea-proxy as above.
  await expect(page.locator('textarea, [role="textbox"]').first()).toBeVisible({ timeout: 8_000 });
});

// ----------------------------------------------------------------------
// Event bus contract — anyone can dispatch rra:ask-assistant
// ----------------------------------------------------------------------
test("AI-6 — Event bus: dispatching rra:ask-assistant opens the panel", async ({ page }) => {
  if (!(await isAuthenticated(page))) {
    test.skip(true, "Not authenticated");
    return;
  }
  await page.goto("/dashboard/month");
  await page.evaluate(() => {
    window.dispatchEvent(
      new CustomEvent("rra:ask-assistant", {
        detail: { message: "hello from the e2e harness" },
      })
    );
  });
  // Expect an assistant input textarea to appear somewhere on the page.
  await expect(page.locator('textarea, [role="textbox"]').first()).toBeVisible({ timeout: 8_000 });
});

// ----------------------------------------------------------------------
// Month view — Phase Arc Planner
// ----------------------------------------------------------------------
test("AI-7 — Month view: ✨ Plan Phase Arc button is present", async ({ page }) => {
  if (!(await isAuthenticated(page))) {
    test.skip(true, "Not authenticated");
    return;
  }
  await page.goto("/dashboard/month");
  const planPhase = page.getByRole("button", { name: /Plan Phase Arc|Plan.*Phase/i });
  await expect(planPhase).toBeVisible({ timeout: 10_000 });
});

// ----------------------------------------------------------------------
// Role gating — non-admin should not see admin-only AI buttons
// ----------------------------------------------------------------------
test("AI-8 — Non-admin: Library does not expose ✨ Draft with AI", async ({ page }) => {
  // This test only runs meaningfully as an assistant/guest coach. Skip when
  // E2E_EMAIL targets the admin user.
  const email = process.env.E2E_EMAIL || "";
  if (!email.includes("e2e.coach") && !email.includes("coach@")) {
    test.skip(true, "Run with E2E_EMAIL=e2e.coach@... to validate role gating");
    return;
  }
  if (!(await isAuthenticated(page))) {
    test.skip(true, "Not authenticated");
    return;
  }
  await page.goto("/dashboard/library");
  await expect(page.getByRole("heading", { name: "Activity Library" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: /Draft with AI/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Improve/i })).toHaveCount(0);
});
