"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
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
 * PATTERN: React Context for cross-component communication
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
  /** Current active session data, or null if not viewing a session */
  activeSession: SessionContextData | null;
  /** Called by the session page to register its data */
  registerSession: (data: SessionContextData) => void;
  /** Called by the session page on unmount to clear */
  clearSession: () => void;
}

const AssistantSessionContext = createContext<AssistantSessionContextType>({
  activeSession: null,
  registerSession: () => {},
  clearSession: () => {},
});

export function AssistantSessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<SessionContextData | null>(null);

  const registerSession = useCallback((data: SessionContextData) => {
    setActiveSession(data);
  }, []);

  const clearSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  return (
    <AssistantSessionContext.Provider value={{ activeSession, registerSession, clearSession }}>
      {children}
    </AssistantSessionContext.Provider>
  );
}

export function useAssistantSessionContext() {
  return useContext(AssistantSessionContext);
}
