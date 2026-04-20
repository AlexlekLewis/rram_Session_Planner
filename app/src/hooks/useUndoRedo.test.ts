/**
 * Unit tests for the useUndoRedo state machine.
 *
 * Tests the pure functions (advanceState / undoState / redoState /
 * syncCurrentState / emptySnapshot) so we can verify the rapid-keystroke
 * race fix (C1) without spinning up React.
 *
 * Run with:
 *   cd app && ./node_modules/.bin/sucrase-node src/hooks/useUndoRedo.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceState,
  undoState,
  redoState,
  syncCurrentState,
  emptySnapshot,
} from "./useUndoRedo";
import type { SessionBlock } from "../lib/types";

function block(id: string, name: string = id): SessionBlock {
  return {
    id,
    session_id: "sess-1",
    name,
    lane_start: 1,
    lane_end: 1,
    time_start: "17:00",
    time_end: "17:15",
    colour: "#000",
    category: "batting",
    tier: "R",
    coaching_points: [],
    player_groups: [],
    equipment: [],
    sort_order: 0,
    created_at: "2026-04-21",
    updated_at: "2026-04-21",
  };
}

const A = [block("a")];
const AB = [block("a"), block("b")];
const ABC = [block("a"), block("b"), block("c")];
const ABCD = [block("a"), block("b"), block("c"), block("d")];

test("emptySnapshot seeds current with the initial blocks", () => {
  const snap = emptySnapshot(A);
  assert.equal(snap.undoStack.length, 0);
  assert.equal(snap.redoStack.length, 0);
  assert.deepEqual(snap.current, A);
});

test("advanceState pushes previous onto undo, clears redo, updates current", () => {
  let snap = emptySnapshot(A);
  snap = advanceState(snap, A, AB);
  assert.deepEqual(snap.current, AB);
  assert.deepEqual(snap.undoStack, [A]);
  assert.equal(snap.redoStack.length, 0);
});

test("advanceState clears redo stack on a new mutation — branching off old future", () => {
  let snap = emptySnapshot(A);
  snap = advanceState(snap, A, AB);
  snap = advanceState(snap, AB, ABC);
  // Undo once — redo stack now has ABC
  const undone = undoState(snap);
  assert.ok(undone);
  snap = undone!.snapshot;
  assert.equal(snap.redoStack.length, 1);
  // Now make a new change — redo should clear
  snap = advanceState(snap, snap.current, ABCD);
  assert.equal(snap.redoStack.length, 0);
  assert.deepEqual(snap.current, ABCD);
});

test("undoState returns null on empty undo stack", () => {
  const snap = emptySnapshot(A);
  assert.equal(undoState(snap), null);
});

test("redoState returns null on empty redo stack", () => {
  const snap = emptySnapshot(A);
  assert.equal(redoState(snap), null);
});

test("undo → redo round-trip restores exact state — C1 regression guard", () => {
  let snap = emptySnapshot(A);
  snap = advanceState(snap, A, AB);

  const undone = undoState(snap)!;
  snap = undone.snapshot;
  assert.deepEqual(undone.newCurrent, A);
  assert.deepEqual(snap.current, A);

  const redone = redoState(snap)!;
  snap = redone.snapshot;
  assert.deepEqual(redone.newCurrent, AB);
  assert.deepEqual(snap.current, AB);
});

test("rapid undo→redo→undo→redo — stacks stay coherent (C1 race fix)", () => {
  // This is the scenario the old hook corrupted: the caller passed stale
  // React state on each call and the redo stack got the wrong value.
  let snap = emptySnapshot(A);
  snap = advanceState(snap, A, AB);
  snap = advanceState(snap, AB, ABC);

  // mash undo twice quickly — no React re-render between calls
  let r = undoState(snap)!;
  snap = r.snapshot;
  assert.deepEqual(r.newCurrent, AB);

  r = undoState(snap)!;
  snap = r.snapshot;
  assert.deepEqual(r.newCurrent, A);

  // Now mash redo twice
  let rr = redoState(snap)!;
  snap = rr.snapshot;
  assert.deepEqual(rr.newCurrent, AB);

  rr = redoState(snap)!;
  snap = rr.snapshot;
  assert.deepEqual(rr.newCurrent, ABC);

  // Final state is ABC, stacks are clean
  assert.deepEqual(snap.current, ABC);
  assert.equal(snap.redoStack.length, 0);
  assert.equal(snap.undoStack.length, 2);
});

test("undoStack cap is respected (UNDO_STACK_SIZE)", () => {
  let snap = emptySnapshot(A);
  // Advance 100 times — stack should cap at UNDO_STACK_SIZE (50)
  for (let i = 0; i < 100; i++) {
    snap = advanceState(snap, snap.current, [...snap.current, block(`x${i}`)]);
  }
  assert.ok(snap.undoStack.length <= 50, `stack grew to ${snap.undoStack.length}`);
});

test("syncCurrentState updates current without touching stacks (DB load / realtime)", () => {
  let snap = emptySnapshot(A);
  snap = advanceState(snap, A, AB);
  snap = advanceState(snap, AB, ABC);
  const undoLen = snap.undoStack.length;

  // Simulate a realtime push changing blocks underneath us
  snap = syncCurrentState(snap, ABCD);
  assert.deepEqual(snap.current, ABCD);
  assert.equal(snap.undoStack.length, undoLen); // unchanged
  assert.equal(snap.redoStack.length, 0);

  // Subsequent undo should push the synced current (ABCD) onto redo
  const r = undoState(snap)!;
  assert.deepEqual(r.snapshot.redoStack[0], ABCD);
});

test("deep clones prevent external mutation from corrupting history", () => {
  const state = [block("a")];
  let snap = emptySnapshot(state);
  snap = advanceState(snap, state, [...state, block("b")]);

  // Mutate the original array — snapshot should be unaffected
  state[0].name = "MUTATED";
  assert.equal(snap.undoStack[0][0].name, "a");
});

test("redo is cleared after advance but undo preserves history", () => {
  let snap = emptySnapshot(A);
  snap = advanceState(snap, A, AB);
  snap = advanceState(snap, AB, ABC);
  snap = undoState(snap)!.snapshot;
  // In-between state: undoStack=[A], redoStack=[ABC], current=AB
  assert.equal(snap.undoStack.length, 1);
  assert.equal(snap.redoStack.length, 1);

  // New branch
  snap = advanceState(snap, AB, [...AB, block("x")]);
  assert.equal(snap.redoStack.length, 0);
  // undoStack kept AB as the pre-branch state
  assert.deepEqual(snap.undoStack[0], AB);
});
