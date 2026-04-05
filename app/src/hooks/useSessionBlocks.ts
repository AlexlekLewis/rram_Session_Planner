"use client"

import { useState, useCallback } from "react"
import { SessionBlock, BlockPosition } from "@/lib/types"

interface UseSessionBlocksReturn {
  blocks: SessionBlock[]
  setBlocks: (blocks: SessionBlock[] | ((prev: SessionBlock[]) => SessionBlock[])) => void
  addBlock: (block: Omit<SessionBlock, "id" | "created_at" | "updated_at">) => SessionBlock
  updateBlock: (id: string, updates: Partial<SessionBlock>) => void
  deleteBlock: (id: string) => void
  moveBlock: (id: string, newLaneStart: number, newLaneEnd: number, newTimeStart: string, newTimeEnd: string) => void
  resizeBlock: (id: string, newLaneEnd: number, newTimeEnd: string) => void
  hasCollision: (position: BlockPosition, excludeId?: string) => boolean
  selectedBlockIds: string[]
  setSelectedBlockIds: (ids: string[]) => void
  isDirty: boolean
  markDirty: () => void
}

export function useSessionBlocks(initialBlocks: SessionBlock[] = []): UseSessionBlocksReturn {
  const [blocks, setBlocks] = useState<SessionBlock[]>(initialBlocks)
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)

  // Check if a position overlaps with any existing block
  const hasCollision = useCallback(
    (position: BlockPosition, excludeId?: string): boolean => {
      const { laneStart, laneEnd, timeStart, timeEnd } = position

      return blocks.some((block) => {
        if (excludeId && block.id === excludeId) return false

        // Check lane overlap: laneStart <= existing.laneEnd && laneEnd >= existing.laneStart
        const lanesOverlap = laneStart <= block.lane_end && laneEnd >= block.lane_start

        // Check time overlap: timeStart < existing.timeEnd && timeEnd > existing.timeStart
        const timeOverlap = timeStart < block.time_end && timeEnd > block.time_start

        return lanesOverlap && timeOverlap
      })
    },
    [blocks]
  )

  // Add a new block
  const addBlock = useCallback(
    (block: Omit<SessionBlock, "id" | "created_at" | "updated_at">): SessionBlock => {
      const newBlock: SessionBlock = {
        ...block,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setBlocks((prev) => [...prev, newBlock])
      setIsDirty(true)

      return newBlock
    },
    []
  )

  // Update a block's properties
  const updateBlock = useCallback((id: string, updates: Partial<SessionBlock>) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id
          ? {
              ...block,
              ...updates,
              updated_at: new Date().toISOString(),
            }
          : block
      )
    )
    setIsDirty(true)
  }, [])

  // Delete a block
  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id))
    setSelectedBlockIds((prev) => prev.filter((selectedId) => selectedId !== id))
    setIsDirty(true)
  }, [])

  // Move a block to a new position (lane + time)
  const moveBlock = useCallback(
    (id: string, newLaneStart: number, newLaneEnd: number, newTimeStart: string, newTimeEnd: string) => {
      updateBlock(id, {
        lane_start: newLaneStart,
        lane_end: newLaneEnd,
        time_start: newTimeStart,
        time_end: newTimeEnd,
      })
    },
    [updateBlock]
  )

  // Mark blocks as dirty (e.g. after undo/redo restores state)
  const markDirty = useCallback(() => {
    setIsDirty(true)
  }, [])

  // Resize a block (change end lane and time)
  const resizeBlock = useCallback(
    (id: string, newLaneEnd: number, newTimeEnd: string) => {
      updateBlock(id, {
        lane_end: newLaneEnd,
        time_end: newTimeEnd,
      })
    },
    [updateBlock]
  )

  return {
    blocks,
    setBlocks,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    resizeBlock,
    hasCollision,
    selectedBlockIds,
    setSelectedBlockIds,
    isDirty,
    markDirty,
  }
}
