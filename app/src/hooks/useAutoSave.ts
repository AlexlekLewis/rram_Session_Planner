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
  const blocksRef = useRef<SessionBlock[]>(blocks)
  blocksRef.current = blocks

  const performSave = useCallback(async () => {
    if (!isDirty || isSavingRef.current) return

    isSavingRef.current = true
    setSaveStatus("saving")

    try {
      const supabase = supabaseRef.current
      const lastSaved = lastSavedBlocksRef.current
      // Use ref to always read the latest blocks, not the stale closure value.
      // This is critical for the re-save path triggered from the finally block.
      const currentBlocks = blocksRef.current
      const currentMap = new Map(currentBlocks.map((b) => [b.id, b]))

      // Partition into new, modified, and deleted
      const toUpsert: SessionBlock[] = []
      const toDelete: string[] = []

      // Find new and modified blocks
      // BUG-003 FIX: Use deep equality instead of updated_at only.
      // This catches changes made via setBlocks() that bypass updateBlock().
      // PATTERN: JSON.stringify comparison — standard deep-equal for serializable objects.
      // With max ~50 blocks per session, this is negligible performance cost.
      for (const block of currentBlocks) {
        const prev = lastSaved.get(block.id)
        if (!prev) {
          // New block — not in last-saved snapshot
          toUpsert.push(block)
        } else if (JSON.stringify(prev) !== JSON.stringify(block)) {
          // Modified block — any property changed
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
      // BUG-011 FIX: Use .select() to verify rows were actually written.
      // RLS can silently block writes (returning success with 0 rows).
      if (toUpsert.length > 0) {
        const { data: upsertData, error: upsertError } = await supabase
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
          .select("id")

        if (upsertError) throw upsertError

        // Verify rows were actually written — RLS can silently block with 0 rows
        if (!upsertData || upsertData.length === 0) {
          throw new Error("Save failed — you may not have permission to edit this session.")
        }
      }

      // Execute delete for removed blocks
      if (toDelete.length > 0) {
        const { data: deleteData, error: deleteError } = await supabase
          .from("sp_session_blocks")
          .delete()
          .in("id", toDelete)
          .select("id")

        if (deleteError) throw deleteError

        if (!deleteData || deleteData.length === 0) {
          console.warn("Delete returned 0 rows — RLS may have blocked the operation")
        }
      }

      // Notify caller of saved block IDs (for realtime self-event dedup)
      const savedIds = [...toUpsert.map((b) => b.id), ...toDelete]
      if (onBlocksSaved && savedIds.length > 0) {
        onBlocksSaved(savedIds)
      }

      // Update last-saved snapshot — use currentBlocks (from ref), not closure
      lastSavedBlocksRef.current = new Map(currentBlocks.map((b) => [b.id, { ...b }]))
      setSaveStatus("saved")
    } catch (error) {
      console.error("Error saving blocks:", error)
      setSaveStatus("error")
    } finally {
      isSavingRef.current = false

      // DATA LOSS FIX: If blocks changed while we were saving, the debounce
      // effect already fired and was cleaned up, so no new timer was set.
      // Re-check current blocks (via ref) against last-saved snapshot and
      // schedule another save if they differ.
      const currentBlocks = blocksRef.current
      const lastSaved = lastSavedBlocksRef.current
      const hasUnsavedChanges =
        currentBlocks.length !== lastSaved.size ||
        currentBlocks.some((b) => {
          const prev = lastSaved.get(b.id)
          return !prev || JSON.stringify(prev) !== JSON.stringify(b)
        }) ||
        // Check for deletions: blocks in lastSaved not in current
        Array.from(lastSaved.keys()).some(
          (id) => !currentBlocks.find((b) => b.id === id)
        )

      if (hasUnsavedChanges) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
        debounceTimerRef.current = setTimeout(() => {
          performSave()
        }, SAVE_DEBOUNCE_MS)
      }
    }
  }, [sessionId, isDirty, onBlocksSaved])

  // Initialize last-saved snapshot ONLY on first load (when isDirty is false).
  // BUG-011 ROOT CAUSE FIX: The previous version initialized the snapshot whenever
  // blocks.length > 0 and size === 0, which meant the first locally-added block
  // got included in the snapshot as "already saved" — causing the diff to skip it.
  // Now we only initialize when isDirty is false (meaning blocks came from the DB).
  const snapshotInitialized = useRef(false)
  useEffect(() => {
    if (!snapshotInitialized.current && blocks.length > 0 && !isDirty) {
      lastSavedBlocksRef.current = new Map(blocks.map((b) => [b.id, { ...b }]))
      snapshotInitialized.current = true
    }
  }, [blocks, isDirty])

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
