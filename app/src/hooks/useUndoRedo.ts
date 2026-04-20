"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { SessionBlock } from "../lib/types"
import { UNDO_STACK_SIZE } from "../lib/constants"

/**
 * Undo/Redo with the hook owning the "current" state internally.
 *
 * C1 FIX (April 2026): the previous implementation took `currentBlocks` as a
 * parameter to undo() and redo() and trusted the caller to pass the live
 * value. Callers passed `blockManager.blocks` (React state), which is stale
 * across rapid keystrokes — `setBlocks(prev)` queues a render but doesn't
 * mutate the captured variable. So back-to-back undo→redo pushed the same
 * stale state onto both stacks, corrupting history.
 *
 * The fix: this hook owns a `current` ref that is the source of truth for
 * "what's on the grid right now". Callers never pass current state to
 * undo/redo. They call pushState(previousState) before mutating, plus
 * syncCurrent(latestBlocks) whenever external state (DB load, realtime
 * push, assistant action) changes blocks without going through pushState.
 *
 * The state machine is extracted as a pure function (advanceState /
 * undoState / redoState / syncCurrentState) so it can be unit-tested
 * without React.
 */

export interface UndoRedoSnapshot {
  undoStack: SessionBlock[][]
  redoStack: SessionBlock[][]
  current: SessionBlock[]
}

export function emptySnapshot(initial: SessionBlock[] = []): UndoRedoSnapshot {
  return { undoStack: [], redoStack: [], current: deepClone(initial) }
}

function deepClone(blocks: SessionBlock[]): SessionBlock[] {
  return JSON.parse(JSON.stringify(blocks))
}

/**
 * Record a mutation: push prior state onto the undo stack, clear redo
 * (since we've branched off the old future), set current to the new state.
 */
export function advanceState(
  snapshot: UndoRedoSnapshot,
  previousState: SessionBlock[],
  newState: SessionBlock[]
): UndoRedoSnapshot {
  return {
    undoStack: [deepClone(previousState), ...snapshot.undoStack].slice(0, UNDO_STACK_SIZE),
    redoStack: [],
    current: deepClone(newState),
  }
}

/**
 * Pure undo: move current onto redo stack, pop undo stack as new current.
 * Returns null if undo stack is empty.
 */
export function undoState(
  snapshot: UndoRedoSnapshot
): { snapshot: UndoRedoSnapshot; newCurrent: SessionBlock[] } | null {
  if (snapshot.undoStack.length === 0) return null
  const [previous, ...restUndo] = snapshot.undoStack
  const next: UndoRedoSnapshot = {
    undoStack: restUndo,
    redoStack: [deepClone(snapshot.current), ...snapshot.redoStack],
    current: deepClone(previous),
  }
  return { snapshot: next, newCurrent: deepClone(previous) }
}

/**
 * Pure redo: move current onto undo stack, pop redo stack as new current.
 * Returns null if redo stack is empty.
 */
export function redoState(
  snapshot: UndoRedoSnapshot
): { snapshot: UndoRedoSnapshot; newCurrent: SessionBlock[] } | null {
  if (snapshot.redoStack.length === 0) return null
  const [next, ...restRedo] = snapshot.redoStack
  const nextSnapshot: UndoRedoSnapshot = {
    undoStack: [deepClone(snapshot.current), ...snapshot.undoStack].slice(0, UNDO_STACK_SIZE),
    redoStack: restRedo,
    current: deepClone(next),
  }
  return { snapshot: nextSnapshot, newCurrent: deepClone(next) }
}

/**
 * External sync — use when blocks change outside of user-initiated mutations
 * (DB fetch on mount, Supabase realtime push, AI-applied action). Does NOT
 * touch the undo/redo stacks; only updates "current" so the next undo knows
 * what to push on redo.
 */
export function syncCurrentState(snapshot: UndoRedoSnapshot, blocks: SessionBlock[]): UndoRedoSnapshot {
  return { ...snapshot, current: deepClone(blocks) }
}

interface UseUndoRedoReturn {
  /**
   * Record the pre-mutation state. Call BEFORE applying the mutation.
   * Backward-compatible with the old single-arg signature: callers pass
   * `blockManager.blocks` (the current snapshot, which becomes the pre-
   * mutation state on the stack). The hook's own "current" is kept
   * in sync via syncCurrent() from a useEffect on the caller side.
   */
  pushState: (previousBlocks: SessionBlock[]) => void
  /** Return the previous state, or null if nothing to undo. */
  undo: () => SessionBlock[] | null
  /** Return the next state, or null if nothing to redo. */
  redo: () => SessionBlock[] | null
  /**
   * Sync the hook's "current" snapshot with externally-driven block changes:
   * DB load, realtime push, AI-applied action, post-mutation re-render.
   * Does not affect canUndo/canRedo.
   */
  syncCurrent: (blocks: SessionBlock[]) => void
  canUndo: boolean
  canRedo: boolean
}

export function useUndoRedo(initialBlocks: SessionBlock[] = []): UseUndoRedoReturn {
  const snapshotRef = useRef<UndoRedoSnapshot>(emptySnapshot(initialBlocks))
  const [, setRenderTrigger] = useState(0)
  const triggerRender = useCallback(() => setRenderTrigger((c) => c + 1), [])

  // Initialise once with the mount-time blocks. Later updates come via syncCurrent.
  useEffect(() => {
    if (snapshotRef.current.current.length === 0 && initialBlocks.length > 0) {
      snapshotRef.current = emptySnapshot(initialBlocks)
      triggerRender()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pushState = useCallback(
    (previousBlocks: SessionBlock[]) => {
      // At pushState time the mutation hasn't applied yet, so "previous" is
      // also the best available "current" until syncCurrent is called. This
      // keeps the invariant: undo pops → returns the state BEFORE previous.
      snapshotRef.current = advanceState(snapshotRef.current, previousBlocks, previousBlocks)
      triggerRender()
    },
    [triggerRender]
  )

  const undo = useCallback((): SessionBlock[] | null => {
    const result = undoState(snapshotRef.current)
    if (!result) return null
    snapshotRef.current = result.snapshot
    triggerRender()
    return result.newCurrent
  }, [triggerRender])

  const redo = useCallback((): SessionBlock[] | null => {
    const result = redoState(snapshotRef.current)
    if (!result) return null
    snapshotRef.current = result.snapshot
    triggerRender()
    return result.newCurrent
  }, [triggerRender])

  const syncCurrent = useCallback((blocks: SessionBlock[]) => {
    snapshotRef.current = syncCurrentState(snapshotRef.current, blocks)
    // Deliberately no triggerRender — syncing current on every realtime
    // tick doesn't affect canUndo/canRedo and we want to avoid render floods.
  }, [])

  return {
    pushState,
    undo,
    redo,
    syncCurrent,
    canUndo: snapshotRef.current.undoStack.length > 0,
    canRedo: snapshotRef.current.redoStack.length > 0,
  }
}
