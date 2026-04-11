"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { SessionBlock } from "@/lib/types"

const DB_NAME = "rra-session-planner"
const DB_VERSION = 1
const STORE_NAME = "offline-queue"

interface QueuedAction {
  id: string
  type: "upsert" | "delete"
  sessionId: string
  blocks?: SessionBlock[]
  blockId?: string
  timestamp: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function addToQueue(action: QueuedAction): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    store.put(action)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getAllQueued(): Promise<QueuedAction[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function clearQueue(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    store.clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueSize, setQueueSize] = useState(0)
  const [isFlushing, setIsFlushing] = useState(false)
  const supabaseRef = useRef(createClient())

  // Monitor online/offline status
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Enqueue an upsert action for when we're back online
  const enqueueUpsert = useCallback(async (sessionId: string, blocks: SessionBlock[]) => {
    const action: QueuedAction = {
      id: `upsert_${sessionId}_${Date.now()}`,
      type: "upsert",
      sessionId,
      blocks,
      timestamp: Date.now(),
    }
    await addToQueue(action)
    setQueueSize((prev) => prev + 1)
  }, [])

  // Enqueue a delete action
  const enqueueDelete = useCallback(async (sessionId: string, blockId: string) => {
    const action: QueuedAction = {
      id: `delete_${blockId}_${Date.now()}`,
      type: "delete",
      sessionId,
      blockId,
      timestamp: Date.now(),
    }
    await addToQueue(action)
    setQueueSize((prev) => prev + 1)
  }, [])

  // Flush queued actions when back online
  const flushQueue = useCallback(async () => {
    if (isFlushing) return
    setIsFlushing(true)

    try {
      const queued = await getAllQueued()
      if (queued.length === 0) {
        setIsFlushing(false)
        return
      }

      const supabase = supabaseRef.current

      // Sort by timestamp, process in order
      const sorted = queued.sort((a, b) => a.timestamp - b.timestamp)

      for (const action of sorted) {
        try {
          if (action.type === "upsert" && action.blocks) {
            // Upsert by id instead of delete-all + re-insert. The old pattern
            // caused data loss when two coaches had edited the same session
            // offline: the second flush would delete blocks the first flush
            // had just persisted. Matches the pattern used in useAutoSave.ts.
            if (action.blocks.length > 0) {
              await supabase
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
                    created_at: block.created_at,
                    updated_at: block.updated_at,
                  })),
                  { onConflict: "id" }
                )
            }
          } else if (action.type === "delete" && action.blockId) {
            await supabase
              .from("sp_session_blocks")
              .delete()
              .eq("id", action.blockId)
          }
        } catch (err) {
          console.error("Error flushing queued action:", action.id, err)
        }
      }

      await clearQueue()
      setQueueSize(0)
    } catch (err) {
      console.error("Error flushing offline queue:", err)
    } finally {
      setIsFlushing(false)
    }
  }, [isFlushing])

  // Auto-flush when coming back online
  useEffect(() => {
    if (isOnline && queueSize > 0) {
      flushQueue()
    }
  }, [isOnline, queueSize, flushQueue])

  // Check queue size on mount
  useEffect(() => {
    getAllQueued()
      .then((items) => setQueueSize(items.length))
      .catch(() => {})
  }, [])

  return {
    isOnline,
    queueSize,
    isFlushing,
    enqueueUpsert,
    enqueueDelete,
    flushQueue,
  }
}
