"use client"

import { useState, useCallback, useRef } from "react"
import { SessionBlock } from "@/lib/types"
import { UNDO_STACK_SIZE } from "@/lib/constants"

interface UseUndoRedoReturn {
  pushState: (blocks: SessionBlock[]) => void
  undo: (currentBlocks: SessionBlock[]) => SessionBlock[] | null
  redo: (currentBlocks: SessionBlock[]) => SessionBlock[] | null
  canUndo: boolean
  canRedo: boolean
}

/**
 * Undo/Redo with useRef for synchronous access.
 *
 * PATTERN: Command pattern with refs for synchronous stack read.
 * React docs explicitly warn against reading state from within `setState` updaters
 * for return values — React batches state updates, so the value you read may be stale.
 *
 * SOURCE: React docs — "Referencing values with refs"
 * WHY NOT useState for stacks: We need to synchronously return the previous/next state
 * from undo()/redo(). useState is async — you can't reliably read the new value
 * until the next render. useRef gives synchronous access.
 *
 * We use a single useState counter purely to trigger re-renders when canUndo/canRedo changes.
 */
export function useUndoRedo(): UseUndoRedoReturn {
  // Refs hold the actual data — synchronous access
  const undoStackRef = useRef<SessionBlock[][]>([])
  const redoStackRef = useRef<SessionBlock[][]>([])

  // Counter triggers re-renders so canUndo/canRedo update in the UI
  const [, setRenderTrigger] = useState(0)
  const triggerRender = useCallback(() => setRenderTrigger((c) => c + 1), [])

  // Deep clone blocks to prevent reference sharing between stack entries
  const deepClone = (blocks: SessionBlock[]): SessionBlock[] => {
    return JSON.parse(JSON.stringify(blocks))
  }

  // Push current state onto undo stack, clear redo stack
  const pushState = useCallback(
    (blocks: SessionBlock[]) => {
      const cloned = deepClone(blocks)
      const stack = undoStackRef.current

      // Prepend to stack, cap at UNDO_STACK_SIZE
      undoStackRef.current = [cloned, ...stack].slice(0, UNDO_STACK_SIZE)

      // Any new action clears the redo stack
      redoStackRef.current = []

      triggerRender()
    },
    [triggerRender]
  )

  // Undo: pop from undo stack, return it. Push CURRENT state to redo stack.
  const undo = useCallback((currentBlocks: SessionBlock[]): SessionBlock[] | null => {
    const undoStack = undoStackRef.current
    if (undoStack.length === 0) return null

    const [previous, ...rest] = undoStack

    // Update stacks synchronously via refs
    undoStackRef.current = rest
    redoStackRef.current = [deepClone(currentBlocks), ...redoStackRef.current]

    triggerRender()

    // Return a deep clone so the caller gets an independent copy
    return deepClone(previous)
  }, [triggerRender])

  // Redo: pop from redo stack, return it. Push CURRENT state to undo stack.
  const redo = useCallback((currentBlocks: SessionBlock[]): SessionBlock[] | null => {
    const redoStack = redoStackRef.current
    if (redoStack.length === 0) return null

    const [next, ...rest] = redoStack

    // Update stacks synchronously via refs
    redoStackRef.current = rest
    undoStackRef.current = [deepClone(currentBlocks), ...undoStackRef.current]

    triggerRender()

    // Return a deep clone so the caller gets an independent copy
    return deepClone(next)
  }, [triggerRender])

  return {
    pushState,
    undo,
    redo,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
  }
}
