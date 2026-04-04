"use client"

import { useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { SessionBlock } from "@/lib/types"
import { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

interface UseRealtimeSyncOptions {
  sessionId: string
  onRemoteInsert: (block: SessionBlock) => void
  onRemoteUpdate: (block: SessionBlock) => void
  onRemoteDelete: (blockId: string) => void
  enabled?: boolean
}

/**
 * Self-event deduplication via local ID tracking.
 *
 * PATTERN: Maintain a Set<string> of recently-mutated block IDs with a 5-second TTL.
 * When a Realtime event arrives for a block ID in the set, it's our own echo — ignore it.
 *
 * SOURCE: Standard pub/sub self-echo filtering pattern. Supabase Realtime sends events
 * back to ALL subscribers on a channel, including the one that made the change.
 * Client-side dedup is the recommended approach when you can't filter server-side.
 *
 * WHY NOT a DB column: Adding `_realtime_tab` to sp_session_blocks just for filtering
 * is unnecessary schema pollution. A client-side Set with TTL is simpler, has no DB cost,
 * and is the standard approach for this problem.
 */

/** TTL for self-event tracking (milliseconds) */
const SELF_EVENT_TTL = 5000

export function useRealtimeSync({
  sessionId,
  onRemoteInsert,
  onRemoteUpdate,
  onRemoteDelete,
  enabled = true,
}: UseRealtimeSyncOptions) {
  const supabaseRef = useRef(createClient())
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Set of block IDs we recently saved — used to filter our own events
  const recentlySavedRef = useRef<Set<string>>(new Set())

  // Keep callbacks stable via refs to avoid subscription churn
  const onInsertRef = useRef(onRemoteInsert)
  const onUpdateRef = useRef(onRemoteUpdate)
  const onDeleteRef = useRef(onRemoteDelete)
  onInsertRef.current = onRemoteInsert
  onUpdateRef.current = onRemoteUpdate
  onDeleteRef.current = onRemoteDelete

  /**
   * Track a block ID as recently saved by us.
   * The ID is removed from the set after SELF_EVENT_TTL milliseconds.
   */
  const trackSavedBlock = useCallback((blockId: string) => {
    recentlySavedRef.current.add(blockId)
    setTimeout(() => {
      recentlySavedRef.current.delete(blockId)
    }, SELF_EVENT_TTL)
  }, [])

  /**
   * Check if a block ID was recently saved by us (i.e., this is our own echo).
   */
  const isOwnEvent = useCallback((blockId: string): boolean => {
    return recentlySavedRef.current.has(blockId)
  }, [])

  useEffect(() => {
    if (!enabled || !sessionId) return

    const supabase = supabaseRef.current

    const channel = supabase
      .channel(`session-blocks:${sessionId}`)
      .on<Record<string, unknown>>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sp_session_blocks",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const newBlock = payload.new as unknown as SessionBlock
          if (newBlock && !isOwnEvent(newBlock.id)) {
            onInsertRef.current(newBlock)
          }
        }
      )
      .on<Record<string, unknown>>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sp_session_blocks",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const updated = payload.new as unknown as SessionBlock
          if (updated && !isOwnEvent(updated.id)) {
            onUpdateRef.current(updated)
          }
        }
      )
      .on<Record<string, unknown>>(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "sp_session_blocks",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          const old = payload.old as Record<string, unknown>
          if (old?.id && !isOwnEvent(old.id as string)) {
            onDeleteRef.current(old.id as string)
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [sessionId, enabled, isOwnEvent])

  return {
    isSubscribed: !!channelRef.current,
    /** Call this after saving a block to prevent its Realtime echo from being processed */
    trackSavedBlock,
  }
}

/**
 * Generate a unique tab ID for this browser tab.
 * Used for display purposes (e.g., showing other users' cursors in future phases).
 */
export function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
