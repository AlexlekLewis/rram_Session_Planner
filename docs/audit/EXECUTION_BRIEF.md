# RRAM Session Planner — P0/P1 Execution Brief

**Audited commit:** `84eb77f` on `main`
**Brief authored:** 2026-04-17
**Intended consumer:** A fresh session or a developer with code-edit authority.
**Scope:** Land every P0 and P1 fix from `docs/audit/fix-list.md` in dependency order, behind one PR per fix, with unit/e2e verification and changelog entries.

All file paths below are relative to the repo root. Every fix has: **scope → current state → target diff → verification → commit message → downstream impact pointer.**

Execute top-to-bottom. Do not skip, reorder, or merge commits.

---

## Order of execution (dependency-aware)

1. **C3** — useOfflineQueue data loss (standalone)
2. **C2** — useUserRole multi-program RLS bypass (no downstream dep)
3. **C1 + H7** — useAutoSave infinite retry loop (combined, same file)
4. **H2** — SessionGrid mobile min-width (blocks Phase 3 mobile tests)
5. **Phase 3 scaffolding** — playwright.config.ts + mobile.spec.ts (see `PHASE3_PLAYWRIGHT_PLAN.md`)
6. **C4 / C5 / M7 / M8** — DATA FINDINGS, re-verify against `rrfghjhzdevmzzttvith` first before remediating. Fixes are SQL-only, not code — see section at the end.

---

## Fix 1 of 4 — C3: useOfflineQueue delete-then-insert data loss

**File:** `app/src/hooks/useOfflineQueue.ts`
**Lines:** 139–172 (inside `flushQueue` → for-loop)
**Severity:** CRITICAL. Two coaches editing the same session offline → on reconnect, whichever flush runs second wipes the other's work.

### Current (the bug)

```ts
if (action.type === "upsert" && action.blocks) {
  // Delete all blocks for session, then re-insert
  await supabase
    .from("sp_session_blocks")
    .delete()
    .eq("session_id", action.sessionId)

  if (action.blocks.length > 0) {
    await supabase.from("sp_session_blocks").insert(
      action.blocks.map((block) => ({ ...block payload... }))
    )
  }
}
```

Problem: the queued `action.blocks` is a **snapshot from when the coach went offline**. On flush, the code deletes ALL blocks on the server (including blocks added by other coaches since that snapshot was taken) and re-inserts only the snapshot set.

### Target behaviour

Match the `useAutoSave` pattern: diff the snapshot against the server state **or** use idempotent upsert + targeted delete (by block ID only). The safest minimal fix is to mirror `useAutoSave`: pass the last-known-saved IDs with the queued action, upsert the current set, and only delete blocks whose IDs are in `lastSavedIds \ currentIds`.

### Target diff

Replace the `QueuedAction` interface and the upsert branch as follows.

```ts
interface QueuedAction {
  id: string
  type: "upsert" | "delete"
  sessionId: string
  blocks?: SessionBlock[]
  // NEW: the IDs that were on the server the last time this client
  // successfully saved. Used to compute a targeted delete set on flush.
  lastSavedIds?: string[]
  blockId?: string
  timestamp: number
}
```

```ts
// enqueueUpsert — accept lastSavedIds
const enqueueUpsert = useCallback(
  async (sessionId: string, blocks: SessionBlock[], lastSavedIds: string[]) => {
    const action: QueuedAction = {
      id: `upsert_${sessionId}_${Date.now()}`,
      type: "upsert",
      sessionId,
      blocks,
      lastSavedIds,
      timestamp: Date.now(),
    }
    await addToQueue(action)
    setQueueSize((prev) => prev + 1)
  },
  []
)
```

```ts
// flushQueue — replace the upsert branch with targeted upsert + diff-delete
if (action.type === "upsert" && action.blocks) {
  const currentIds = new Set(action.blocks.map((b) => b.id))
  const prevIds = new Set(action.lastSavedIds ?? [])
  const toDelete = [...prevIds].filter((id) => !currentIds.has(id))

  if (action.blocks.length > 0) {
    const { error: upsertError } = await supabase
      .from("sp_session_blocks")
      .upsert(
        action.blocks.map((block) => ({
          id: block.id,
          session_id: block.session_id,
          activity_id: block.activity_id || null,
          name: block.name,
          lane_start: block.lane_start,
          lane_end: block.lane_end,
          time_start: block.time_start,
          time_end: block.time_end,
          colour: block.colour,
          category: block.category,
          tier: block.tier,
          other_location: block.other_location || null,
          coaching_notes: block.coaching_notes || null,
          coaching_points: block.coaching_points || [],
          player_groups: block.player_groups || [],
          equipment: block.equipment || [],
          coach_assigned: block.coach_assigned || null,
          sort_order: block.sort_order,
          created_by: block.created_by || null,
        })),
        { onConflict: "id" }
      )
      .select("id")

    if (upsertError) throw upsertError
  }

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("sp_session_blocks")
      .delete()
      .in("id", toDelete)
      .select("id")

    if (deleteError) throw deleteError
  }
}
```

### Caller update

Find every call site of `enqueueUpsert` (grep `enqueueUpsert(`) and add the third argument. The natural source is `useAutoSave`'s `lastSavedBlocksRef.current` — extract its keys: `Array.from(lastSavedBlocksRef.current.keys())`.

### Verification

- Unit test: simulate two actions (A saves `[1,2]`, B saves `[2,3]` while offline) → on flush, result must be `[1,2,3]`, not `[2,3]`.
- Manual: open session on two devices, go offline on Device B, add block on A (syncs), add different block on B, bring B online, confirm both blocks present.

### Commit message

```
fix(offline): targeted upsert+delete on queue flush to prevent data loss

Replaces delete-all-then-insert pattern with per-id upsert and a
diff-computed delete set. Matches useAutoSave semantics, so two coaches
editing the same session offline no longer wipe each other's work on
reconnect.

Refs: audit/fix-list.md C3
```

**Downstream impact:** See `DOWNSTREAM_IMPACT_MATRIX.md` — touches `useAutoSave` (caller), all session-edit callers of `enqueueUpsert`, and realtime self-event dedup in session page.

---

## Fix 2 of 4 — C2: useUserRole multi-program RLS bypass

**File:** `app/src/hooks/useUserRole.ts`
**Lines:** 60, 83 (`.single()` → `.maybeSingle()`), 78–97 (legacy fallback)
**Severity:** CRITICAL. A coach with membership in Program A can currently be resolved as `head_coach` of Program B because the program-scoped `.single()` throws on zero rows and the legacy `sp_coaches` fallback returns a role that is not program-scoped.

### Current

```ts
// Strategy 1: Program-scoped lookup (if programId provided)
if (programId) {
  const { data: membership } = await supabase
    .from("sp_program_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("program_id", programId)
    .eq("status", "active")
    .single();                      // ← throws on 0 rows

  if (membership) { ... }
  // If no program membership, fall through to legacy
}

// Strategy 2: Legacy sp_coaches lookup
const { data: coach } = await supabase
  .from("sp_coaches")
  .select("name, role")
  .or(`email.eq.${email},user_id.eq.${user.id}`)
  .single();                        // ← also throws on 0 rows; granted cross-program
```

### Target

- Change both `.single()` calls to `.maybeSingle()`.
- Delete the Strategy 2 fallback entirely. Zero program membership must resolve to `player` (the existing default block).
- If the app still needs a no-program mode for super-admin screens, gate that behaviour behind an explicit `allowLegacyFallback: true` option — **not** an implicit fallback.

### Target diff (minimal — removes implicit fallback)

```ts
// Strategy 1: Program-scoped lookup (if programId provided)
if (programId) {
  const { data: membership, error } = await supabase
    .from("sp_program_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("program_id", programId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;

  if (membership) {
    const role = membership.role as UserRole;
    setState({
      role,
      isAdmin: role === "head_coach",
      isCoach: role !== "player",
      isPlayer: role === "player",
      userName: email.split("@")[0],
      userEmail: email,
      isLoading: false,
    });
    return;
  }
}

// If programId was supplied and there was no membership → default to player.
// Legacy sp_coaches fallback intentionally removed (see audit C2).
setState({
  role: "player",
  isAdmin: false,
  isCoach: false,
  isPlayer: true,
  userName: email.split("@")[0],
  userEmail: email,
  isLoading: false,
});
```

### Verification

- Unit test: user with `sp_coaches.role = 'head_coach'` but no `sp_program_members` row for the active program must now resolve as `player`.
- Manual: confirm every app surface that depends on `isAdmin`/`isCoach` still works when the user has a valid `sp_program_members` row.
- RLS sanity: grep for any other caller that reads `sp_coaches` on the client. If there are other legacy lookups, flag for a separate cleanup PR.

### Commit message

```
fix(auth): remove implicit sp_coaches fallback in useUserRole

Program-scoped lookup is now the only source of truth for role
resolution. Swapped both .single() calls to .maybeSingle() so zero-row
responses no longer throw. Users without a program membership now
resolve as "player" instead of inheriting a legacy global role.

Refs: audit/fix-list.md C2
BREAKING: users who relied on sp_coaches-only access must be added to
sp_program_members for the programs they need to access.
```

**Downstream impact:** See matrix — touches every surface that reads `isAdmin`/`isCoach`. Before merging, run a one-off query against the correct Supabase project to confirm every active coach has a matching `sp_program_members` row for the 2026 program.

---

## Fix 3 of 4 — C1 + H7: useAutoSave retry loop on permanent errors

**File:** `app/src/hooks/useAutoSave.ts`
**Lines:** 149–180 (`catch` + `finally`)
**Severity:** CRITICAL on the data-safety axis, HIGH on the UX axis.

The `finally` block unconditionally re-schedules a save if the current blocks differ from the last-saved snapshot. On a permanent error (RLS denial, 403, schema error), the snapshot is never updated, so `hasUnsavedChanges` stays `true` and the save retries every `SAVE_DEBOUNCE_MS` forever — hammering Supabase and never showing the coach that their edit is actually not going to land.

### Target behaviour

- Distinguish transient errors (network, 5xx, timeout) from permanent errors (RLS, 4xx other than 408/429).
- On permanent error: set `saveStatus = "error"`, surface a UI toast with the server message, and **stop** retrying until the user explicitly does something (hits "retry" or makes another edit).
- On transient error: retry with exponential backoff, max 3 attempts, then escalate to permanent-error path.

### Target diff (shape, not verbatim)

```ts
// Add at top of file
const MAX_TRANSIENT_RETRIES = 3
const BACKOFF_MS = [1000, 2000, 4000] // aligned with MAX_TRANSIENT_RETRIES

const retryCountRef = useRef(0)
const permanentErrorRef = useRef(false)

function isTransientError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  // PostgREST: RLS denials look like "new row violates row-level security policy"
  // or come back with 403. Treat anything that isn't obviously network/5xx as permanent.
  if (/row-level security/i.test(msg)) return false
  if (/permission/i.test(msg)) return false
  if (/network|fetch|timeout|5\d\d/i.test(msg)) return true
  return false // default to permanent — fail loud, not forever
}
```

In `catch`:

```ts
} catch (error) {
  console.error("Error saving blocks:", error)
  setSaveStatus("error")

  if (isTransientError(error) && retryCountRef.current < MAX_TRANSIENT_RETRIES) {
    // handled in finally via backoff scheduling
  } else {
    permanentErrorRef.current = true
    retryCountRef.current = 0
  }
}
```

In `finally`, replace the existing `if (hasUnsavedChanges)` block with:

```ts
} finally {
  isSavingRef.current = false

  if (permanentErrorRef.current) {
    // Do NOT reschedule. The user must either retry manually or edit again.
    return
  }

  const currentBlocks = blocksRef.current
  const lastSaved = lastSavedBlocksRef.current
  const hasUnsavedChanges =
    currentBlocks.length !== lastSaved.size ||
    currentBlocks.some((b) => {
      const prev = lastSaved.get(b.id)
      return !prev || JSON.stringify(prev) !== JSON.stringify(b)
    }) ||
    Array.from(lastSaved.keys()).some(
      (id) => !currentBlocks.find((b) => b.id === id)
    )

  if (hasUnsavedChanges) {
    const delay =
      saveStatus === "error"
        ? BACKOFF_MS[Math.min(retryCountRef.current, BACKOFF_MS.length - 1)]
        : SAVE_DEBOUNCE_MS
    if (saveStatus === "error") retryCountRef.current += 1

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      performSave()
    }, delay)
  } else {
    retryCountRef.current = 0
  }
}
```

Also: when an edit comes in after a permanent error (new `isDirty` cycle), clear `permanentErrorRef.current = false` inside `performSave`'s entry block, so the user's next edit attempts to save once.

### UI surface

The session page already renders `saveStatus`. Add a "Retry" button next to the status text when status is `"error"`. That button should call a memo'd `retry` exposed from the hook — the simplest form is to expose `performSave` as `retry` from the return, alongside `saveStatus`.

### Verification

- Unit: simulate an RLS error from the mocked client → assert exactly one save attempt, `saveStatus === "error"`, no retries.
- Unit: simulate a 503 → assert 3 retries with increasing delay, then permanent error.
- Manual: as a player, attempt to edit a coach-only session — status should move to error once and stop, not hammer.

### Commit message

```
fix(autosave): stop infinite retry on permanent save errors

Distinguishes transient (network/5xx) from permanent (RLS/403) errors.
Permanent errors now surface a single error state and stop the retry
loop until the next user action. Transient errors retry with
exponential backoff up to 3 attempts.

Refs: audit/fix-list.md C1, H7
```

**Downstream impact:** UI — session page needs a retry affordance. Offline queue — same classification should eventually move there too (tracked as follow-up, not P0).

---

## Fix 4 of 4 — H2: SessionGrid mobile minmax breaking tablets

**File:** `app/src/components/session-grid/SessionGrid.tsx`
**Line:** 125
**Severity:** HIGH. 600px minimum forces horizontal scroll on every viewport narrower than ~664px (600 + 64 time axis). That covers all phones and most small tablets in portrait.

### Current

```ts
gridTemplateColumns: "64px minmax(600px, 1fr)",
```

### Target

```ts
// Allow the grid to shrink to the viewport width on mobile; the grid canvas
// itself handles internal lane sizing at a minimum of ~72px per lane. Horizontal
// overflow is acceptable ONLY when the number of lanes × min-lane-width exceeds
// the viewport, not unconditionally.
gridTemplateColumns: "64px 1fr",
```

Then inside `GridCanvas`, ensure lane columns use `minmax(72px, 1fr)` so the grid shrinks to fit the viewport down to the sum of (lane_count × 72 + 64). For 8 lanes (CEC Bundoora max), that's 640px + 64px = 704px — still larger than a 375px phone, so `overflow-x: auto` on the outer container handles it gracefully and the time axis stays pinned.

### Verification

- Visual: iPhone SE 375px, iPhone 14 Pro 390px, Pixel 7 412px, iPad mini 768px — grid must be readable without horizontal scroll on iPad mini; on phones, horizontal scroll is permitted but the time axis must stay sticky-left.
- Playwright: covered in `mobile.spec.ts` — see `PHASE3_PLAYWRIGHT_PLAN.md`.

### Commit message

```
fix(mobile): allow SessionGrid to shrink below 600px

Removes the unconditional minmax(600px, 1fr). Lane sizing is now driven
by lane count × 72px minimum, so tablets in portrait render the full
grid without horizontal scroll and phones only scroll when they
genuinely need to.

Refs: audit/fix-list.md H2
```

**Downstream impact:** Visual only — confirm `GridCanvas` already uses per-lane minmax, otherwise update there too.

---

## Data findings — re-verify before remediating

C4 (zero `sp_session_blocks`), C5 (players not in `sp_program_members`), M7 (helper functions missing `search_path`), M8 (orphan session with `phase_id = NULL`) were all read via Supabase MCP while it was pointed at the wrong project (`pudldzgmluwoocwxtzhw`). The live project is `rrfghjhzdevmzzttvith`.

**Do not remediate these findings until they are re-confirmed against the correct project.** The remediation SQL in `fix-list.md` is still correct in shape — backfilling `sp_program_members` for missing players, adding `search_path` to the four helper functions, and either deleting or assigning `phase_id` to the orphan session — but the specific row counts need fresh numbers.

Steps to re-verify:

1. Point the Supabase MCP at `rrfghjhzdevmzzttvith` (or run the queries in the SQL editor).
2. Execute the four diagnostic queries in `data-integrity-findings.md` under each of C4/C5/M7/M8.
3. Append an appendix to `PRODUCTION_READINESS_REPORT.md` titled "Data findings — re-verification (2026-04-XX)" with the new row counts.
4. Only then, apply the remediation.

---

## Changelog entries

Each commit should append a dated entry to `CHANGELOG.md` under the existing `## [Unreleased]` section, grouped under `### Fixed`. Example:

```
### Fixed
- **CRITICAL:** useOfflineQueue now does targeted upsert+delete on flush
  instead of delete-all-then-insert, preventing data loss when multiple
  coaches edit the same session offline. (audit C3)
- **CRITICAL:** useUserRole no longer falls back to the global sp_coaches
  table when a user has no sp_program_members row; such users now resolve
  as "player". (audit C2) BREAKING: coaches must be enrolled in
  sp_program_members for every program they need access to.
- **CRITICAL:** useAutoSave distinguishes transient vs permanent errors
  and no longer retries infinitely on RLS denials. (audit C1, H7)
- SessionGrid grid template no longer forces a 600px minimum, allowing
  the grid to fit viewports smaller than 664px without horizontal
  scroll. (audit H2)
```

---

## Handover checklist for the executing session

- [ ] `git pull origin main` — confirm HEAD is still `84eb77f` or rebase this brief.
- [ ] One PR per fix, in the order above.
- [ ] Each PR: target diff applied, unit tests added, `CHANGELOG.md` entry, manual verification note in the PR description.
- [ ] After C1+H7 lands, ensure the session page exposes a "Retry" button when `saveStatus === "error"`.
- [ ] After H2 lands, run Phase 3 Playwright mobile suite (`PHASE3_PLAYWRIGHT_PLAN.md`) and attach the HTML report to the PR.
- [ ] Data findings (C4/C5/M7/M8) wait for Supabase project re-verification — do not merge remediation until the correct-project row counts are appended to `PRODUCTION_READINESS_REPORT.md`.
