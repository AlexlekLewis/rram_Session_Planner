# Changelog — RRA Session Planner

All notable changes, audits, and production-impacting decisions for the RRA Melbourne Session Planner.
Kept per the project's multi-agent governance rule: every change gets logged and downchain effects noted.

Format is loosely based on [Keep a Changelog](https://keepachangelog.com/).
Dates are in `YYYY-MM-DD`.

---

## [Unreleased]

### Fixed — P0/P1 from the 2026-04-17 audit (same-day execution)

- **CRITICAL — C3:** `useOfflineQueue.flushQueue` now does a targeted upsert + diff-computed delete instead of the previous delete-all-then-insert pattern. Two coaches editing the same session offline no longer wipe each other's work on reconnect. `enqueueUpsert` gained a third argument `lastSavedIds` (defaulted for backwards compat) — callers should pass the pre-queue block id snapshot so the flush knows which blocks were removed vs never present.
- **CRITICAL — C2 (BREAKING):** `useUserRole` no longer implicitly falls back to the global `sp_coaches` table when a `programId` is supplied. Zero rows in `sp_program_members` for that program now resolves to `player`. Both `.single()` calls were swapped to `.maybeSingle()`. Coaches without program membership must be enrolled in `sp_program_members` before this ships — re-verify on project `rrfghjhzdevmzzttvith`.
- **CRITICAL — C1 + H7:** `useAutoSave` distinguishes transient (network / 5xx) from permanent (RLS / 403 / permission) errors. Permanent errors now latch a non-retrying error state that clears on the next edit; transient errors retry with exponential backoff, max 3 attempts. Kills the infinite retry loop that hammered Supabase on deterministic failures.
- **HIGH — H2:** `SessionGrid` grid template changed from `64px minmax(600px, 1fr)` to `64px 1fr`. Phones and tablets in portrait no longer force horizontal scroll. Internal per-lane sizing continues to drive overflow when genuinely needed. Added `data-grid-root`, `data-lane-header`, `data-time-axis` test-ids for Phase 3 selectors.

### Added — Phase 3 Playwright

- `app/playwright.config.ts` extended with `iphone-se`, `iphone-14-pro`, `pixel-7` mobile projects, all reusing the existing `setup` project's storage state.
- `app/tests/e2e/mobile.spec.ts` — new suite covering: grid fits viewport, sticky header/axis under scroll, 44×44px tap targets, activity library drawer reachability, save-layer persistence across reload on phone.

### Still pending

- Data findings C4, C5, M7, M8 — **do not remediate** until re-verified against Supabase project `rrfghjhzdevmzzttvith` (MCP was on the wrong project during Phase 1).
- Before C2 ships to production: run `select email, role from sp_coaches where user_id not in (select user_id from sp_program_members where program_id = '<2026 program id>' and status = 'active');` — every row is a coach who will be locked out post-merge. Backfill first.
- Exposing an explicit `retry()` from `useAutoSave` + a retry button in the session header — deferred; the permanent-error latch currently clears on any new edit, which covers the common case.

---

## [2026-04-17] — Production-readiness audit (Opus 4.6 multi-agent)

### Added
- Three parallel Opus audits covering code/security, head-coach UX, and data integrity. Reports live in `docs/audit/`:
  - `code-security-findings.md` — 12-layer stability pass + RLS matrix
  - `headcoach-ux-findings.md` — journey-by-journey UX review
  - `data-integrity-findings.md` — row counts, migration state, Supabase advisors
  - `PRODUCTION_READINESS_REPORT.md` — synthesized, severity-ranked, corrected
  - `fix-list.md` — prioritized queue with effort estimates

### Findings summary
- **5 CRITICAL** blockers: offline-queue data-loss pattern, `useUserRole` legacy fallback bypass, `.single()` in role lookups, zero `sp_session_blocks` content, players not enrolled in `sp_program_members`.
- **7 HIGH**: infinite retry loop on permanent save failures, mobile grid unusable under 664 px, assistant-coach view unfiltered, no coach conflict detection, empty `sp_coach_availability`, missing error boundary on session route, offline queue lacks tombstones + SELECT verification.
- **9 MEDIUM** + **4 LOW** — polish, toasts, search-path hardening.

### Corrections to raw subagent output
- Downgraded "useAutoSave silent RLS retries mask failure" from CRITICAL to HIGH — the underlying retry loop is real, but the "eventually succeeds and masks" claim was inaccurate. RLS errors are deterministic.
- Removed "Activity Library hidden from UI" UX finding — the toggle is present at `app/src/app/dashboard/session/[id]/page.tsx:402` ("Activity Library" / "Close Library"). False positive.
- Confirmed migrations 014 and 015 ARE applied (the `.build-error-memory.md` note was outdated).

### Added — execution pack (2026-04-17, later the same day)
- `docs/audit/EXECUTION_BRIEF.md` — copy-paste-ready P0/P1 diffs in dependency order (C3 → C2 → C1+H7 → H2), one commit message per fix, unit + manual verification per fix.
- `docs/audit/PHASE3_PLAYWRIGHT_PLAN.md` — full mobile test plan: `playwright.config.ts` extension for three mobile projects (iPhone SE, iPhone 14 Pro, Pixel 7), inline `mobile.spec.ts` covering H2, tap targets, drawer, sticky behaviour, save-layer persistence. Includes required `data-*` test-id additions and CI job snippet.
- `docs/audit/DOWNSTREAM_IMPACT_MATRIX.md` — per-fix matrix of direct callers, indirect surfaces, regression risks, extra verification, cross-fix interactions, and open questions the executing session must resolve first.

### Phase 3 pending
- Playwright live E2E across desktop + three mobile viewports awaiting production URL and dedicated e2e test credentials. This report will be updated with a Phase 3 section once those arrive.
- P0/P1 code fixes themselves are **not yet landed** — this session produced the plans and diffs only. A fresh session with code-edit authority (or the dev-team plugin) should land the EXECUTION_BRIEF in PR order.

### Supabase project mismatch (flagged, pending user action)
- The data-integrity findings (C4, C5, M7, M8) were read via the Supabase MCP while it was connected to `pudldzgmluwoocwxtzhw`. The live project is `rrfghjhzdevmzzttvith` (per `.build-error-memory.md`).
- These four findings must be re-verified against the correct project before remediation. Remediation SQL shape stands; row counts need fresh numbers.
- Code findings (C1, C2, C3, H1, H2, H3, H6, H7) and UX findings are unaffected — they came from reading the repo, not the DB.

### Downchain effects to watch on fixes
- Fixing `.single()` (C3) before `useUserRole` fallback (C2) is required — reversing the order masks the behaviour change.
- Seeding `sp_session_blocks` (C4) must happen before Phase 3 mobile validation (H2 reproduction needs populated blocks).
- Offline queue rewrite (C1+H7) must land together — they share the same code path.

### Audited commit
- `84eb77f` on `main` (`chore: remove temporary seed/diagnostic API routes`)

---
