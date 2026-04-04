"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { SessionBlock, SaveStatus } from "@/lib/types"
import { SAVE_DEBOUNCE_MS } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"

/**
 * Diff-based auto-save hook.
 *
 * PATTERN: Standard optimistic persistence (Notion, Figma, Linear pattern).
 * Compare current blocks vs last-saved snapshot → partition into:
 *   - NEW blocks (not in last-saved) → INSERT
 *   - MODIFIED blocks (in both, but updated_at differs) → UPDATE
 *   - DELETED blocks (in last-saved, not in current) → DELETE
 *
 * SOURCE: Supabase docs — `.upsert()` with `onConflict: 'id'` for new+modified,
 *         `.delete().in('id', [...])` for removed blocks.
 *
 * WHY NOT DELETE ALL + INSERT: That pattern causes data loss when two coaches
 * edit the same session simultaneously. Coach A's save deletes Coach B's new block.
 */
export function useAutoSave(
  blocks: SessionBlock[],
  sessionId: string,
  isDirty: boolean,
  onBlocksSaved?: (blockIds: string[]) => void
): SaveStatus {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedBlocksRef = useRef<Map<string, SessionBlock>>(new Map())
  const supabaseRef = useRef(createClient())
  const isSavingRef = useRef(false)

  const performSave = useCallback(async () => {
    if (!isDirty || isSavingRef.current) return

    isSavingRef.current = true
    setSaveStatus("saving")

    try {
      const supabase = supabaseRef.current
      const lastSaved = lastSavedBlocksRef.current
      const currentMap = new Map(blocks.map((b) => [b.id, b]))

      // Partition into new, modified, and deleted
      const toUpsert: SessionBlock[] = []
      const toDelete: string[] = []

      // Find new and modified blocks
      for (const block of blocks) {
        const prev = lastSaved.get(block.id)
        if (!prev) {
          // New block — not in last-saved snapshot
          toUpsert.push(block)
        } else if (prev.updated_at !== block.updated_at) {
          // Modified block — updated_at changed
          toUpsert.push(block)
        }
      }

      // Find deleted blocks — in last-saved but not in current
      lastSaved.forEach((_, id) => {
        if (!currentMap.has(id)) {
          toDelete.push(id)
        }
      })

      // Skip save if nothing changed
      if (toUpsert.length === 0 && toDelete.length === 0) {
        setSaveStatus("saved")
        isSavingRef.current = false
        return
      }

      // Execute upsert for new + modified blocks
      if (toUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from("sp_session_blocks")
          .upsert(
            toUpsert.map((block) => ({
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

        if (upsertError) throw upsertError
      }

      // Execute delete for removed blocks
      if (toDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("sp_session_blocks")
          .delete()
          .in("id", toDelete)

        if (deleteError) throw deleteError
      }

      // Notify caller of saved block IDs (for realtime self-event dedup)
      const savedIds = [...toUpsert.map((b) => b.id), ...toDelete]
      if (onBlocksSaved && savedIds.length > 0) {
        onBlocksSaved(savedIds)
      }

      // Update last-saved snapshot
      lastSavedBlocksRef.current = new Map(blocks.map((b) => [b.id, { ...b }]))
      setSaveStatus("saved")
    } catch (error) {
      console.error("Error saving blocks:", error)
      setSaveStatus("error")
    } finally {
      isSavingRef.current = false
    }
  }, [blocks, sessionId, isDirty, onBlocksSaved])

  // Initialize last-saved snapshot when blocks first load
  useEffect(() => {
    if (blocks.length > 0 && lastSavedBlocksRef.current.size === 0) {
      lastSavedBlocksRef.current = new Map(blocks.map((b) => [b.id, { ...b }]))
    }
  }, [blocks])

  // Debounced save trigger
  useEffect(() => {
    if (!isDirty) return

    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set a new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      performSave()
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [blocks, isDirty, performSave])

  return saveStatus
}
