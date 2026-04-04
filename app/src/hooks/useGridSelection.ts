"use client"

import { useState, useCallback } from "react"

interface SelectionRect {
  startLane: number
  startTimeIndex: number
  endLane: number
  endTimeIndex: number
}

interface UseGridSelectionReturn {
  isSelecting: boolean
  selection: SelectionRect | null
  handleMouseDown: (lane: number, timeIndex: number) => void
  handleMouseMove: (lane: number, timeIndex: number) => void
  handleMouseUp: () => {
    laneStart: number
    laneEnd: number
    timeStartIndex: number
    timeEndIndex: number
  } | null
  clearSelection: () => void
}

export function useGridSelection(): UseGridSelectionReturn {
  const [isSelecting, setIsSelecting] = useState(false)
  const [selection, setSelection] = useState<SelectionRect | null>(null)

  // Start a new selection
  const handleMouseDown = useCallback((lane: number, timeIndex: number) => {
    setIsSelecting(true)
    setSelection({
      startLane: lane,
      startTimeIndex: timeIndex,
      endLane: lane,
      endTimeIndex: timeIndex,
    })
  }, [])

  // Update selection while dragging
  const handleMouseMove = useCallback((lane: number, timeIndex: number) => {
    if (!isSelecting) return

    setSelection((prev) => {
      if (!prev) return null

      return {
        ...prev,
        endLane: lane,
        endTimeIndex: timeIndex,
      }
    })
  }, [isSelecting])

  // End selection and return normalized rectangle
  const handleMouseUp = useCallback((): {
    laneStart: number
    laneEnd: number
    timeStartIndex: number
    timeEndIndex: number
  } | null => {
    if (!selection || !isSelecting) {
      setIsSelecting(false)
      setSelection(null)
      return null
    }

    // Normalize the selection rectangle
    const laneStart = Math.min(selection.startLane, selection.endLane)
    const laneEnd = Math.max(selection.startLane, selection.endLane)
    const timeStartIndex = Math.min(selection.startTimeIndex, selection.endTimeIndex)
    const timeEndIndex = Math.max(selection.startTimeIndex, selection.endTimeIndex) + 1 // +1 for inclusive end

    const result = {
      laneStart,
      laneEnd,
      timeStartIndex,
      timeEndIndex,
    }

    setIsSelecting(false)
    setSelection(null)

    return result
  }, [selection, isSelecting])

  // Clear the current selection
  const clearSelection = useCallback(() => {
    setIsSelecting(false)
    setSelection(null)
  }, [])

  return {
    isSelecting,
    selection,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearSelection,
  }
}
