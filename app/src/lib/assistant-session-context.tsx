"use client";

import { createContext, useContext, useRef, useCallback, useMemo, ReactNode } from "react";
import { Session, SessionBlock } from "./types";

/**
 * Session Context Bridge for the Global AI Coach
 *
 * When a user navigates to a session page, that page "registers" its
 * session data (sessionId, blocks, callbacks) here. The global AI Coach
 * reads from this context to know which session is active and how to
 * modify its blocks.
 *
 * When the user navigates away from a session, the context is cleared.
 *
 * FIX: Uses a ref instead of state so that registerSession() does NOT
 * trigger a re-render of the provider subtree. This prevents the infinite
 * loop where: registerSession -> setActiveSession -> re-render page ->
 * blocks reference changes -> useEffect fires -> registerSession (repeat).
 *
 * The AI Coach reads getActiveSession() on-demand when processing user
 * messages, so it always gets the latest data without needing reactive state.
 *
 * PATTERN: React Context with ref for cross-component communication
 * SOURCE: React docs — "Passing Data Deeply with Context"
 */

interface SessionContextData {
  sessionId: string;
  session: Session;
  blocks: SessionBlock[];
  onAddBlock: (block: Omit<SessionBlock, "id" | "created_at" | "updated_at">) => SessionBlock;
  onUpdateBlock: (id: string, updates: Partial<SessionBlock>) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock: (id: string, laneStart: number, laneEnd: number, timeStart: string, timeEnd: string) => void;
  hasCollision: (position: { laneStart: number; laneEnd: number; timeStart: string; timeEnd: string }, excludeId?: string) => boolean;
  copyHour: (allBlocks: SessionBlock[], sourceStart: string, sourceEnd: string, targetStart: string) => Omit<SessionBlock, "id" | "created_at" | "updated_at">[];
  onUpdateSession: (updates: Partial<Session>) => Promise<void>;
}

interface AssistantSessionContextType {
  /** Returns the current active session data snapshot (ref-based, no re-renders) */
  getActiveSession: () => SessionContextData | null;
  /** Called by the session page to register its data (writes to ref, no re-render) */
  registerSession: (data: SessionContextData) => void;
  /** Called by the session page on unmount to clear */
  clearSession: () => void;
}

const AssistantSessionContext = createContext<AssistantSessionContextType>({
  getActiveSession: () => null,
  registerSession: () => {},
  clearSession: () => {},
});

export function AssistantSessionProvider({ children }: { children: ReactNode }) {
  const sessionRef = useRef<SessionContextData | null>(null);

  const getActiveSession = useCallback(() => sessionRef.current, []);

  const registerSession = useCallback((data: SessionContextData) => {
    sessionRef.current = data;
  }, []);

  const clearSession = useCallback(() => {
    sessionRef.current = null;
  }, []);

  // Memoize the context value so the provider never triggers consumer re-renders
  const value = useMemo(
    () => ({ getActiveSession, registerSession, clearSession }),
    [getActiveSession, registerSession, clearSession]
  );

  return (
    <AssistantSessionContext.Provider value={value}>
      {children}
    </AssistantSessionContext.Provider>
  );
}

export function useAssistantSessionContext() {
  return useContext(AssistantSessionContext);
}
