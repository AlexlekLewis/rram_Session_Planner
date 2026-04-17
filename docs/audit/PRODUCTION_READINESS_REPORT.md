# Production-Readiness Report — RRA Melbourne Session Planner

**Date:** 2026-04-17
**Reviewers:** App-Dev-Team multi-agent audit (Opus 4.6) — Security, Backend, Frontend, UX, Database, QA
**Commit audited:** `84eb77f` on `main`
**Phases complete:** 0 (clone), 1 (map), 2A/2B/2C (three parallel Opus audits), 4 (synthesis with code re-verification)
**Phases pending:** 3 (Playwright live E2E — awaiting production URL + e2e test credentials)

---

## Health Score

**Current:** 5/10 — multiple HIGH and CRITICAL issues would prevent a clean go-live today.
**After fixing the CRITICAL queue below:** projected 7–8/10 pending Phase 3 live test results.

---

## How this report was produced

Three Opus subagents ran in parallel, each with a scoped brief:
- **Track A — Code & Security** did the 12-layer app-stability pass and RLS policy verification directly against Supabase project `rrfghjhzdevmzzttvith`.
- **Track B — Head Coach UX** walked the app in user-journey order through the code.
- **Track C — Data Integrity** queried actual row counts, migration state, RLS policies and Supabase advisors via the Supabase MCP.

I then re-verified the top CRITICAL claims against the actual code before trusting them. Two corrections were applied (see "Corrections applied" at the bottom).

Full detail lives in three sibling files:
- [`code-security-findings.md`](./code-security-findings.md) — 12-layer audit, RLS matrix, silent-failure catalogue (556 lines)
- [`headcoach-ux-findings.md`](./headcoach-ux-findings.md) — journey-by-journey UX review (684 lines)
- [`data-integrity-findings.md`](./data-integrity-findings.md) — row counts, migration state, RLS matrix (282 lines)

This file is the synthesis — severity-ranked, de-duplicated, corrected, with downchain risk annotated.

---

## CRITICAL — fix before any further user enrolment

### C1. Offline queue flush uses DELETE-all-then-INSERT pattern → multi-coach data loss
**File:** `app/src/hooks/useOfflineQueue.ts:139–147`
**Verified:** YES — literal `.delete().eq("session_id", …)` followed by `.insert(blocks)`.
**Failure mode:** Two coaches edit the same session while offline. Coach A reconnects first, deletes all blocks, re-inserts theirs. Coach B reconnects 3 s later, deletes all (including A's), re-inserts theirs. Net result: Coach A's work is silently gone.
**The hook's own header (line 20–21) already documents why this is wrong** but the offline queue wasn't updated to match.
**Fix direction:** Replace the delete-then-insert block with per-block `.upsert({...}, { onConflict: "id" }).select("id")`, mirroring `useAutoSave.ts`. Add `enqueueDelete` tombstones so removed blocks are honoured on flush.
**Downchain risk of fix:** none significant — the upsert pattern is already the canonical path; you're aligning two code paths. Realtime subscription (`useRealtimeSync`) will still dedupe via `onBlocksSaved`.

### C2. `useUserRole` falls back to legacy global `sp_coaches` → multi-program RLS bypass
**File:** `app/src/hooks/useUserRole.ts:78–97`
**Verified:** YES — if `programId` is missing OR the `sp_program_members` lookup returns `null`, the hook queries `sp_coaches` globally and reports `isAdmin: role === "head_coach"` based on that global record.
**Failure mode:** A user who is head_coach in Program A but not in Program B loads Program B and the frontend renders Edit controls. Saves fail at the RLS layer with the generic "you may not have permission" message, confusing the user and accumulating queued offline blocks that will never flush.
**Fix direction:** Make `programId` required in multi-program mode; remove the silent `sp_coaches` fallback or log it loudly. Ensure `ProgramProvider` has resolved `activeProgram.id` before the first `useUserRole()` call.
**Downchain risk of fix:** Any legacy code path that calls `useUserRole()` without a programId will now return `player`. Grep for all call sites before shipping.

### C3. `.single()` in role lookups crashes on no-rows → silent fallback to `player`
**Files:** `app/src/hooks/useUserRole.ts:60` and `:83`; also flagged at `app/src/lib/program-context.tsx:150` and `app/src/app/dashboard/session/[id]/page.tsx:122`
**Verified:** YES at the `useUserRole` sites (line 60 and 83 both use `.single()`).
**Failure mode:** `.single()` throws HTTP 406 when zero rows match. The error is swallowed by the outer `catch` at line 109, state defaults to `role: "player"`. A user who should be `guest_coach` gets silently demoted; RLS writes then fail with the generic "permission" error.
**Fix direction:** Replace with `.maybeSingle()` and handle `null` explicitly. Log a warning if we fall through to player default so you can diagnose role-resolution problems.
**Downchain risk of fix:** Low — behavior-preserving on the happy path; fixes the unhappy path.

### C4. Zero `sp_session_blocks` across all 96 sessions → planner is structurally empty
**Source:** Data integrity audit, Query 5.
**Verified:** YES via Supabase MCP row count against project `rrfghjhzdevmzzttvith`.
**Failure mode:** A coach logs in, opens any session on the Month view, is greeted by an empty grid. Nothing to save, nothing to review, no sign the program exists. The app works — the program content doesn't.
**Fix direction:** Content build-out. A head coach authoring template blocks for Week 1 (Onboarding) and cloning forward via Copy Hour is the fastest path. Consider a seed script `scripts/seed-session-blocks.ts` that reads a spreadsheet and writes via `.upsert()`.
**Downchain risk of fix:** once seeded, every page that renders a session will have real data — validate the session-grid layout at 375 px with populated blocks (not just empty lanes) before signing off Phase 3.

### C5. Players not enrolled in `sp_program_members` → all player-facing RLS denies
**Source:** Data integrity audit, Query 8 and Query 11.
**Verified:** `sp_program_members` count = 19 (1 head + 10 assistant + 8 guest, 0 players). 85 players exist in `sp_players`.
**Failure mode:** Player lands on `/dashboard/player` → `useUserRole` can't find a membership row → falls back via C2/C3 paths → behavior is undefined. Even if role resolves, every RLS policy that checks `user_is_program_member(program_id)` returns false.
**Fix direction:** Bulk insert players into `sp_program_members` with `role='player'`, `status='active'`, `program_id = <active program>`. Auto-create the row on player account creation going forward (trigger on `sp_players` insert, OR application-layer on the invite-accept flow).
**Downchain risk of fix:** players will start appearing in the `useUserRole` membership lookup — make sure C2/C3 fixes land first, otherwise the broken fallback will still mis-classify them.

---

## HIGH — fix before going public with the app

### H1. `useAutoSave` retries RLS-blocked saves indefinitely
**File:** `app/src/hooks/useAutoSave.ts:152–180`
**Verified:** YES — the `finally` block re-checks `hasUnsavedChanges` and re-schedules `performSave()` after `SAVE_DEBOUNCE_MS` regardless of whether the previous failure was transient or permanent.
**Note:** The Track-A subagent originally flagged this as CRITICAL and claimed retries "mask" the failure by eventually succeeding. That's not quite right — an RLS block is deterministic, so retries will keep failing with the same error. The real bug is the infinite retry loop: user's CPU spins, error spam in console, the SaveIndicator flaps between "Saving…" and "Error!" forever, and offline queue may accumulate.
**Fix direction:** Track error category. On an RLS/permission error (`data.length === 0` path), set a permanent error state, stop retrying, show a persistent banner ("You don't have permission to edit this session"). On a network error, retry with backoff.
**Downchain risk of fix:** none — purer failure mode is strictly better for the user and for battery.

### H2. SessionGrid minimum width 664 px → unusable on iPhone SE / 375 px
**File:** `app/src/components/session-grid/SessionGrid.tsx:125`
**Verified:** YES — `gridTemplateColumns: "64px minmax(600px, 1fr)"` forces horizontal scroll on any viewport under 664 px.
**Failure mode:** Primary trackside use case (head coach checking session on iPhone) is broken — the entire grid scrolls horizontally inside its container, sticky headers may lose their anchor, tap-targets cluster together.
**Fix direction:** Two options:
  (a) Responsive `minmax(320px, 1fr)` under 768 px with font-size and padding scaled down.
  (b) Dedicated mobile layout: swipeable lane carousel showing 2–3 lanes at a time with a lane switcher.
(b) is more work but gives a usable trackside experience. (a) is a 30-minute fix that unblocks most of the pain.
**Downchain risk of fix:** block label truncation at narrower track widths — verify with real 3-word activity names; don't ship without testing at 375 px with populated blocks (see C4).

### H3. Assistant-coach view reuses the player route, no role-based filtering
**File:** `app/src/app/dashboard/player/session/[id]/page.tsx` + `ReadOnlyGrid.tsx`
**Verified:** YES — no `/dashboard/assistant-coach/` route exists; the read-only view shows all 8 lanes with no filter by `coach_assigned`.
**Failure mode:** Assistant coach arrives at the boundary to run Lane 3, opens the app, sees every block for every lane, has to scan to find theirs. During warm-up chaos, this is useless.
**Fix direction:** Add a dedicated `/dashboard/coach/session/[id]/` route (or a role-based branch in the existing read-only page) that filters to blocks where `coach_assigned` includes the current user, plus a "My Schedule" sidebar sorted by `time_start`. Include coaching notes prominently.
**Downchain risk of fix:** needs a UserRole check (depends on C2 fix). Also needs Realtime subscription so head-coach mid-session edits flow through — the existing read-only page doesn't subscribe.

### H4. No coach double-booking / conflict detection
**File:** `app/src/components/session-grid/SessionCoachBar.tsx:37, 42–189`
**Verified:** The `availability` prop is loaded but not rendered; there's no collision check in the "Add Coach" flow.
**Failure mode:** Head coach assigns Jarryd to Squad WE2 on Saturday 5–7 pm, forgetting he's already on Squad WE1 Saturday 4–6 pm. Finds out on the day.
**Fix direction:** Before rostering, query `sp_session_coaches` for overlapping time ranges on the same coach; show a warning modal. Longer-term: a "Coach Schedule" admin view.

### H5. `sp_coach_availability` is empty → no coach capacity visible for Month 1
**Source:** Data integrity audit, Query 9.
**Verified:** 0 rows.
**Failure mode:** Any UI that relies on availability (SessionCoachBar, future scheduler) shows blank; H4's conflict engine can't do better than naive overlap-checks.
**Fix direction:** Build an availability entry form OR a bulk-import from a Google Sheet the coaches already fill in. Get 4 weeks ahead on the rolling basis.

### H6. Missing React Error Boundary on `/dashboard/session/[id]`
**File:** `app/src/app/dashboard/session/[id]/page.tsx`
**Verified:** No error boundary wraps the session content; a failed Supabase query (network blip, RLS deny, missing row) bubbles to a white screen.
**Fix direction:** Add a route-level error boundary with a friendly "Couldn't load this session — please refresh or ask your head coach to share it with you" message and a retry button. Differentiate "not found" from "permission denied" in the fetch handler.

### H7. Offline queue has no SELECT verification and no tombstone for deletes
**File:** `app/src/hooks/useOfflineQueue.ts:137–191`
**Verified:** `insert(...)` has no `.select("id")` chain; `enqueueDelete` stores `blockId` but flush only deletes on re-connect — no reconciliation if the block has been re-added by someone else meanwhile.
**Fix direction:** fold into the C1 fix — switch to upsert-based flush, add `.select("id")` row-count verification, queue deletes as tombstones with a last-seen `updated_at`, drop tombstones older than N hours.

---

## MEDIUM — fix before month 2 of the program

- **M1.** `useAutoSave` does not distinguish transient vs. permanent save failures in the UI. Tied to H1.
- **M2.** `PlayersTab` has no toast on add/edit success or error; `sonner` is already installed. One-hour fix.
- **M3.** `CoachProfileModal` is missing `availability_start_date`, `availability_end_date`, `hourly_rate`, `weekly_hour_capacity` fields that the UX review expected. Schema decision required before coding.
- **M4.** `AssistantPanel.tsx:99` is `fixed right-0 top-0 w-96` — overlaps the grid on mobile. Switch to bottom drawer below 768 px.
- **M5.** Session page has no phase context (Phase 1: Onboarding / Week 1) in the header. `PhaseBanner` component exists and is only used in Month view; reuse it.
- **M6.** `GridBlock` resize handles are 1.5 px wide — unusable on touch. Increase to 8–10 px under `md:` or hide on mobile and use long-press.
- **M7.** Supabase security-lint: four helper functions (`user_sp_role`, `user_is_sp_coach`, and two triggers) have mutable `search_path` — theoretical injection surface. Add `SET search_path = public;` in a new migration.
- **M8.** One orphan `sp_sessions` row with `phase_id = NULL`. Delete or reassign.
- **M9.** Coach count drift: 19 total vs. spec's 9. Two coaches (Ikroop, Shenan) were added post-plan and are genuine; update the allocation sheet memory, not the DB.

---

## LOW — polish

- **L1.** Copy Hour dialog slot granularity is coarser (15-min intervals) than the underlying 5-min step supports. Add an "advanced" toggle.
- **L2.** Undo/redo happens silently — a short toast ("Undone: added block") builds confidence.
- **L3.** Category in CreateBlockModal defaults to "batting" silently. Add a colour-swatch live preview.
- **L4.** Save status indicator is small and lives in the session header; fine for MVP but easy to miss.

---

## Corrections applied to the raw subagent reports

1. **Track A Finding #2** downgraded from CRITICAL to HIGH and reworded. The original claim that `useAutoSave` retries eventually "succeed and mask" the failure is not consistent with the code — RLS errors are deterministic, so retries fail identically. The real bug is the infinite retry loop on a permanent error (see H1).
2. **Track B Finding 1.5** ("Activity Library hidden from UI") **removed** — the toggle button exists at `app/src/app/dashboard/session/[id]/page.tsx:402–408` with visible text "Activity Library" / "Close Library". This was a false positive from the subagent.
3. **Track C migration status** confirmed: the `.build-error-memory.md` claim that 014 and 015 weren't applied is outdated. All 17 migrations are applied in project `rrfghjhzdevmzzttvith`.

---

## Downchain dependency map for fixes

Applying the fixes in the wrong order causes regressions. Recommended sequence:

1. **C3 (.maybeSingle)** first — it's self-contained and unblocks everything else.
2. **C2 (useUserRole fallback)** — must go after C3 since C3 makes the happy path safer.
3. **C5 (enrol players in sp_program_members)** — must go after C2 so the new members are classified correctly.
4. **C1 + H7 (offline queue)** together — they're the same path.
5. **H1 (retry loop)** — independent of above.
6. **H2 (mobile grid)** after **C4 (seed blocks)** so you can test with real content.
7. **H3 (assistant-coach view)** after C2 (depends on correct role resolution).
8. **H4 + H5 (coach conflicts + availability)** together.
9. **H6 (error boundary)** anytime, independent.
10. MEDIUM queue in any order.

---

## Phase 3 — Playwright live testing — PENDING

The 11 existing E2E specs at `app/tests/e2e/session-planner.spec.ts` + `multi-program.spec.ts` are desktop-only (chromium 1440×900). To sign off production readiness I still need:
- **Production URL** for `E2E_BASE_URL`
- **Dedicated e2e test-user credentials** (`E2E_EMAIL`, `E2E_PASSWORD`)

Once you paste those I will:
1. Extend `playwright.config.ts` with three mobile projects (iPhone SE 375, iPhone 14 Pro 390, Pixel 7 412)
2. Add a `mobile.spec.ts` covering: login, month view, session grid at 375 px (H2 reproducer), AI assistant drawer (M4 reproducer), PDF export on mobile, session card tap targets ≥44 px, horizontal-overflow detection on every route
3. Run against production and capture: screenshots, console errors, 4xx/5xx, RLS-denial banners
4. Update this report with a Phase 3 section

---

## Open questions for you

1. **Attendance tracking** — the UX audit flagged this as absent. The PRD notes it's handled in an external system. Is that still true for the 2026 program, or do we need to pull it into the planner before launch?
2. **Player self-service** — should players be able to see "here's my session this week" on `/dashboard/player`? C5 affects this. What data should a player see, and what should be hidden?
3. **Mobile philosophy** — H2 has two fix directions (responsive width vs. swipeable carousel). Which do you prefer?

---

*Cross-references: [code-security-findings.md](./code-security-findings.md) · [headcoach-ux-findings.md](./headcoach-ux-findings.md) · [data-integrity-findings.md](./data-integrity-findings.md)*
