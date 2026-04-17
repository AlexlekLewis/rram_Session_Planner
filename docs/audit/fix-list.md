# Fix List — RRA Session Planner

Derived from `PRODUCTION_READINESS_REPORT.md` on 2026-04-17. Ordered by the dependency sequence in that report's "Downchain dependency map". Effort estimates are for a single developer working uninterrupted.

Status legend: `[ ]` open · `[x]` done · `[~]` in progress · `[!]` blocked

---

## P0 — CRITICAL (do these first, in order)

- [ ] **C3. Replace `.single()` with `.maybeSingle()` in role lookups** — ~30 min
  - `app/src/hooks/useUserRole.ts:60` and `:83`
  - `app/src/lib/program-context.tsx:150`
  - `app/src/app/dashboard/session/[id]/page.tsx:122`
  - Handle `null` explicitly; log a warning before defaulting to `player`.
  - **Downchain:** none if done first.

- [ ] **C2. Make `programId` required in `useUserRole`; remove silent `sp_coaches` fallback** — ~2 h
  - `app/src/hooks/useUserRole.ts:78–97`
  - Audit every call site — some will need `ProgramProvider` to resolve first.
  - **Downchain:** any page that reads the hook before `activeProgram.id` is ready will render briefly as `player`. Add a `isLoading` guard on the consuming pages.

- [ ] **C5. Enrol all 85 players in `sp_program_members`** — ~30 min
  - Bulk SQL insert with `role='player'`, `status='active'`, `program_id = <active>`.
  - Add a DB trigger (or app-layer handler on invite-accept) so future players are auto-enrolled.
  - **Downchain:** must land after C2 so the corrected role resolver classifies them right.

- [ ] **C1 + H7. Rewrite `useOfflineQueue.flushQueue` to use `.upsert().select("id")` + delete tombstones** — ~4 h
  - `app/src/hooks/useOfflineQueue.ts:121–191`
  - Per-block upsert mirroring `useAutoSave`; verify `data.length > 0`.
  - `enqueueDelete` writes a tombstone row; flush applies deletes as `DELETE ... WHERE id IN (...)` with row-count check.
  - Unit-test the multi-coach offline scenario.
  - **Downchain:** realtime subscription should already dedupe via `onBlocksSaved`; verify.

- [ ] **C4. Seed `sp_session_blocks` — at minimum Week 1 (Onboarding) across all 8 squads** — 3–5 days content work
  - Build-out, not a code fix. Can be done alongside the code work above.
  - Consider a seed script `scripts/seed-session-blocks.ts`.
  - **Downchain:** needed before H2 mobile validation is meaningful.

## P1 — HIGH (next)

- [ ] **H1. Distinguish transient vs permanent save failures; stop retrying on RLS errors** — ~2 h
  - `app/src/hooks/useAutoSave.ts:117–180`
  - Persistent error banner, button disabled, explain "read-only for your role".
  - **Downchain:** user sees honest failure mode instead of spinner flap.

- [ ] **H2. Responsive SessionGrid — shrink `minmax(600px, 1fr)` under 768 px** — ~4 h for (a), ~8 h for (b)
  - `app/src/components/session-grid/SessionGrid.tsx:125`
  - (a) quick: `minmax(320px, 1fr)` under 768 px + scaled typography.
  - (b) proper: swipeable lane carousel.
  - Test at 375 px / 390 px / 412 px with populated blocks from C4.

- [ ] **H3. Assistant-coach view with role-based filtering** — ~6 h
  - New route `/dashboard/coach/session/[id]/` OR role-branch in the existing read-only page.
  - Filter blocks by `coach_assigned` includes current user; sidebar "My Schedule" sorted by time; surface `coaching_notes`.
  - Subscribe to realtime for mid-session head-coach edits.
  - **Downchain:** depends on C2.

- [ ] **H4. Coach double-booking / conflict detection** — ~4 h
  - Check overlapping `sp_session_coaches.time_start/time_end` for same `coach_id` before accepting new allocation.
  - Warning modal, explicit override.

- [ ] **H5. Populate `sp_coach_availability` — Weeks 1–4 minimum** — ~1–2 days
  - Collect coach availability (Google form or direct Slack DM), bulk-insert.
  - Ideally an import script that reads a shared sheet.

- [ ] **H6. React Error Boundary on `/dashboard/session/[id]`** — ~1 h
  - Route-level boundary with retry button.
  - Differentiate 404 (deleted session) from 401 (permission denied) in the fetch handler.

## P2 — MEDIUM (before month 2)

- [ ] **M2.** Add `sonner` toasts to `PlayersTab` add/edit/delete — ~1 h
- [ ] **M3.** Extend `CoachProfileModal` with availability + hourly-rate fields — schema decision first
- [ ] **M4.** `AssistantPanel` → bottom drawer under 768 px — ~2 h
- [ ] **M5.** Reuse `PhaseBanner` in session header — ~30 min
- [ ] **M6.** `GridBlock` resize handles: 8–10 px tap target on touch — ~1 h
- [ ] **M7.** Migration to pin `search_path` on four helper functions — ~1 h
- [ ] **M8.** Delete / reassign the orphan session with `phase_id = NULL` — 5 min SQL
- [ ] **M9.** Update coach allocation memory to note Ikroop + Shenan — ~10 min

## P3 — LOW (polish)

- [ ] **L1.** Copy Hour 5-min granularity toggle — ~1 h
- [ ] **L2.** Undo/redo toast — ~30 min
- [ ] **L3.** CreateBlockModal colour-swatch preview — ~1 h
- [ ] **L4.** (Optional) Enlarge `SaveIndicator` on touch devices

---

## Blocked

- [!] **Phase 3 Playwright live testing** — awaiting production URL and e2e test credentials. Once provided, extend `playwright.config.ts` with mobile projects and run against prod.

---

## Post-session retrospective (per app-dev-team skill)

Once the P0 queue is through, run the retro questions and append below:
1. What broke during the fix pass that we didn't anticipate?
2. Which fix had the largest blast radius relative to its apparent scope?
3. Any silent failure the detection protocols missed?
4. Any gaps in discovery that caused problems?
5. New entries for the Known Failure Library?
6. Any agent protocol that gave insufficient guidance?
7. State of the critical paths now — all green?
