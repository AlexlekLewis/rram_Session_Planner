# RRAM Session Planner — Downstream Impact Matrix

**Audit commit:** `84eb77f`
**Authored:** 2026-04-17
**Purpose:** For every P0/P1 fix in `EXECUTION_BRIEF.md`, list the surfaces it touches downstream so the executing session knows what to verify, what to grep for, and what regressions to look out for.

This matrix is organised one-row-per-fix. Read it alongside the brief, not on its own.

---

## Legend

- **Direct callers:** code that imports or invokes the changed symbol.
- **Indirect surfaces:** UI screens, RLS policies, workflows, or DB rows whose behaviour changes because of the fix even though they don't reference it directly.
- **Regression risks:** what could break that the unit tests in the brief don't already catch.
- **Verification beyond the brief:** steps the executing session must take in addition to the brief's "Verification" section.

---

## C3 — useOfflineQueue targeted upsert+delete

| Axis | Detail |
|---|---|
| Direct callers | Every component that calls `enqueueUpsert`. Grep: `enqueueUpsert(`. Likely callers: `useAutoSave` (when offline branch is hit), session page wrapper. The new third argument (`lastSavedIds`) must be supplied at every call site. |
| Indirect surfaces | Realtime self-event dedup in `app/src/app/dashboard/session/[id]/page.tsx` — the `onBlocksSaved` callback wires upserted IDs into a Set so the realtime subscription doesn't double-apply local writes. The flush path now needs to fire `onBlocksSaved` with both the upserted and deleted IDs, mirroring `useAutoSave`. If it doesn't, two coaches reconnecting simultaneously will see flicker. |
| Regression risks | (a) Forgetting to fire `onBlocksSaved` from the flush path — visible as duplicate or flickering blocks after reconnect. (b) Passing stale `lastSavedIds` — same data-loss class as before, just narrower. The IDs must be the snapshot from when the *queued action* was created, not from when the flush runs. |
| Verification beyond the brief | (1) Dev-tools network tab: confirm flush sends one `PATCH/POST` upsert and (only if blocks were removed) one `DELETE` with `in.(id1,id2)`. The previous broad `delete().eq("session_id", ...)` must not appear. (2) Two-device manual test: open the same session on two phones, one offline. Add a block on the online phone. Add a different block on the offline phone. Bring the offline phone online. Both blocks must be present on both phones within 5s. |
| Migration / data | None. Pure code change. |

---

## C2 — useUserRole, remove implicit sp_coaches fallback

| Axis | Detail |
|---|---|
| Direct callers | Anywhere that calls `useUserRole(...)`. Grep: `useUserRole(`. Each call site must already pass `programId` — if any still call it without `programId`, those screens will degrade everyone to `player`. Audit those first. |
| Indirect surfaces | Every `isAdmin` / `isCoach` / `isPlayer` consumer. Grep: `isAdmin\b`, `isCoach\b`, `isPlayer\b`. Common consumers: nav rendering (admin tools), session edit affordances (coach-only), block edit modal (coach-only fields). These will flip to `false` for any user not in `sp_program_members` for the active program. |
| Regression risks | (a) Coaches who exist in `sp_coaches` but were never enrolled in `sp_program_members` will lose all coaching UI. This is the BREAKING change called out in the commit message — must be communicated and remediated *before* the PR ships, not after. (b) RLS policies on `sp_session_blocks` and related tables that grant write to `sp_coaches.role IN ('head_coach','assistant_coach')` rather than `sp_program_members.role` will continue to allow writes the UI no longer surfaces — verify policies match the new client model. |
| Verification beyond the brief | (1) Run on the correct Supabase project: `select email, role from sp_coaches where user_id not in (select user_id from sp_program_members where program_id = '<2026 program id>' and status = 'active');` — every row in that result is a coach who will be locked out. Backfill them into `sp_program_members` *before* merging. (2) Audit RLS policies: `select tablename, policyname, with_check from pg_policies where schemaname='public' and tablename in ('sp_sessions','sp_session_blocks','sp_program_members');` — confirm policies reference `sp_program_members` not `sp_coaches`. |
| Migration / data | Backfill SQL for `sp_program_members` is in `data-integrity-findings.md` under C5 — execute on the correct project before merging C2. |

---

## C1 + H7 — useAutoSave error classification & retry cap

| Axis | Detail |
|---|---|
| Direct callers | `app/src/app/dashboard/session/[id]/page.tsx` (the only consumer). The hook's return type changes from `SaveStatus` to (proposed) `{ saveStatus: SaveStatus; retry: () => Promise<void> }` once the retry button is wired — the page must destructure both. Alternatively keep returning a bare `SaveStatus` and re-call `performSave` from inside the hook on a separate exported `retry` function. The brief allows either; pick the shape that matches existing hook conventions in the repo. |
| Indirect surfaces | Save-status indicator in the session header — must show error text + a retry button when `saveStatus === "error"`. Toast layer (if one exists) — surface the server error message on first permanent error so the coach sees *why* it failed, not just that it did. Offline queue (`useOfflineQueue`) — same transient/permanent classification eventually belongs there too, but is out of scope for this PR (track as P2). |
| Regression risks | (a) Misclassifying RLS as transient → infinite retry returns by another path. The `isTransientError` heuristic in the brief defaults to `false` (permanent) on unknown errors precisely to avoid this. (b) The "next edit clears permanent-error flag" path: if it's not implemented, the only way out of an error state is reload. (c) Realtime subscription: if a coach is in error state and another coach modifies the same block, the realtime update could overwrite the unsaved local edit silently. Behaviour today is the same; flag for review post-merge. |
| Verification beyond the brief | (1) Network throttle to "Slow 3G" → assert save eventually succeeds, with at most 3 retry attempts visible in the network tab. (2) Manually break RLS by signing in as a player and editing a coach-only session → assert exactly one POST to `sp_session_blocks`, status flips to `error`, no further POSTs until you click retry. (3) After a permanent error, edit the block again → assert status moves through `saving` → `saved` (or back to `error` once). |
| Migration / data | None. |

---

## H2 — SessionGrid mobile minmax

| Axis | Detail |
|---|---|
| Direct callers | None directly — `SessionGrid` is rendered from `app/src/app/dashboard/session/[id]/page.tsx`. The grid template change is internal. |
| Indirect surfaces | `GridCanvas` lane sizing — must use `minmax(72px, 1fr)` per lane so the grid shrinks gracefully. If `GridCanvas` currently hardcodes a wider per-lane width, this change moves the overflow problem one level inward without solving it. Read `GridCanvas` before merging. |
| Regression risks | (a) Block widths are computed from grid column width × span. If the grid now shrinks below the previous 600px floor on phones, blocks that used to render at, say, 80px wide may render at 50px and the block label/category becomes unreadable. The block component needs a `min-width: 0` and a text-truncation fallback (likely already in place — verify). (b) Sticky positioning relies on the grid being inside a single scroll container. Confirm the change doesn't introduce a second scroll context. |
| Verification beyond the brief | (1) DevTools device emulation at 320, 375, 390, 412, 768 — visually confirm the grid renders edge-to-edge without horizontal scroll on 768 (tablet portrait), and with single-axis horizontal scroll on phones. (2) Confirm sticky time axis stays pinned during both vertical and horizontal scroll. (3) Drag a block on a phone — confirm `dnd-kit` still resolves drop targets correctly at the new column widths. |
| Migration / data | None. |

---

## Phase 3 Playwright (config + mobile spec)

| Axis | Detail |
|---|---|
| Direct callers | CI workflow (`.github/workflows/*.yml`). Spec depends on `data-*` test-ids being added to existing components — see `PHASE3_PLAYWRIGHT_PLAN.md` §2 for the exact list. Add the test-ids in the H2 commit so the spec runs green from the start. |
| Indirect surfaces | The e2e test user — after C2 lands, this user must be enrolled in `sp_program_members` for the program it tests against. Update `global-setup.ts` or seed via migration. |
| Regression risks | (a) Adding mobile projects multiplies CI minutes by ~3 per spec file. Scope mobile projects to `mobile.spec.ts` only on CI (the brief includes the per-project filter). (b) `iPhone SE` device descriptor in Playwright defaults to a small viewport; if the existing global-setup hits a layout that requires desktop width, mobile setup will fail. Solution: run `setup` only on the `setup` project (already configured), then mobile projects reuse storage state. |
| Verification beyond the brief | (1) `npx playwright test --project=iphone-se mobile.spec.ts` locally before pushing to CI. (2) Open the HTML report, confirm screenshots show the grid edge-to-edge on each viewport. (3) Re-run after H2 lands and confirm `grid fits viewport` test goes from RED → GREEN. |
| Migration / data | None — but `global-setup.ts` may need to seed the e2e user into `sp_program_members` once C2 lands. |

---

## Cross-fix interactions

| Pair | Interaction |
|---|---|
| C2 ↔ C1+H7 | Once C2 lands, more users will hit RLS denials (the implicit fallback that masked them is gone). Without C1+H7 landed first, those denials become infinite-retry storms. **Ship C1+H7 before or in the same PR as C2.** The brief orders C2 second on the assumption that C1+H7 lands in the same release window — if C2 must ship alone, ship C1+H7 first. |
| C3 ↔ C1+H7 | The offline queue currently swallows all errors silently in its for-loop. The classification logic from C1+H7 should be ported here in a follow-up (P2). Without it, a permanent error during flush leaves the queue items in IDB but reports them as drained. |
| H2 ↔ Phase 3 | Phase 3 mobile suite without H2 fixed = noise. Order is non-negotiable: H2, then Phase 3 spec lands. |
| C5 ↔ C2 | C5 (players not in `sp_program_members`) has the same root cause as part of C2 (relying on the legacy `sp_coaches` table for cross-program identity). The C5 backfill SQL should be run **before** C2 ships, otherwise the C2 BREAKING change locks out real users. Re-verify C5 row counts on `rrfghjhzdevmzzttvith` first. |

---

## Open questions for the executing session to resolve

1. Does `useAutoSave` currently expose anything beyond `SaveStatus`? If so, what's the existing convention for adding `retry`?
2. Does `useOfflineQueue.enqueueUpsert` have callers other than `useAutoSave`? If yes, the third-argument change is not just the autosave wrapper.
3. Are there RLS policies that still reference `sp_coaches` directly? If yes, C2 needs an accompanying migration, not just a code change.
4. Does the e2e user account exist? If not, Phase 3 stays blocked regardless of code state.

Each question is small enough to answer in one grep or one SQL query — do it before opening the PRs, not during review.
