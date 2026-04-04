"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Session, SessionBlock, Squad, BlockCategory, Tier, Activity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatTime, CATEGORY_COLOURS } from "@/lib/constants";
import { SquadBadge } from "@/components/shared/SquadBadge";
import { SaveIndicator } from "@/components/shared/SaveIndicator";
import { ExportPdfButton } from "@/components/shared/ExportPdfButton";
import { SessionGrid } from "@/components/session-grid/SessionGrid";
import { LibraryPanel } from "@/components/activity-library/LibraryPanel";
import { TierSelector } from "@/components/activity-library/TierSelector";
import { BlockDetailPanel } from "@/components/session-grid/BlockDetailPanel";
import { CopyHourDialog } from "@/components/session-grid/CopyHourDialog";
import { SessionMetadataEditor } from "@/components/session-editor/SessionMetadataEditor";
import { useSessionBlocks } from "@/hooks/useSessionBlocks";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useClipboard } from "@/hooks/useClipboard";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useUserRole } from "@/hooks/useUserRole";
import { ReadOnlyGrid } from "@/components/session-grid/ReadOnlyGrid";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState("");
  const [isEditingTheme, setIsEditingTheme] = useState(false);

  // Phase 3 state
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [copyHourOpen, setCopyHourOpen] = useState(false);
  const [tierSelector, setTierSelector] = useState<{
    activity: Activity;
    position: { x: number; y: number };
    laneStart: number;
    laneEnd: number;
    timeStart: string;
    timeEnd: string;
  } | null>(null);

  // Role check — guest coaches and players get read-only view
  const { role } = useUserRole();
  const canEdit = role === "head_coach" || role === "assistant_coach";

  // Core hooks
  const blockManager = useSessionBlocks([]);
  const undoRedo = useUndoRedo();
  const clipboard = useClipboard();

  // Realtime sync — must be initialized before auto-save so trackSavedBlock is available
  const { trackSavedBlock } = useRealtimeSync({
    sessionId,
    enabled: !isLoading,
    onRemoteInsert: useCallback((block: SessionBlock) => {
      blockManager.setBlocks((prev: SessionBlock[]) => {
        if (prev.some((b) => b.id === block.id)) return prev;
        return [...prev, block];
      });
    }, [blockManager]),
    onRemoteUpdate: useCallback((block: SessionBlock) => {
      blockManager.setBlocks((prev: SessionBlock[]) =>
        prev.map((b) => (b.id === block.id ? block : b))
      );
    }, [blockManager]),
    onRemoteDelete: useCallback((blockId: string) => {
      blockManager.setBlocks((prev: SessionBlock[]) =>
        prev.filter((b) => b.id !== blockId)
      );
    }, [blockManager]),
  });

  // Auto-save with diff-based persistence — notifies realtime of saved IDs for dedup
  const saveStatus = useAutoSave(
    blockManager.blocks,
    sessionId,
    blockManager.isDirty,
    useCallback((blockIds: string[]) => {
      blockIds.forEach(trackSavedBlock);
    }, [trackSavedBlock])
  );

  // Selected block for detail panel
  const selectedBlock = blockManager.selectedBlockIds.length === 1
    ? blockManager.blocks.find((b) => b.id === blockManager.selectedBlockIds[0]) || null
    : null;

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [sessionRes, blocksRes, squadsRes] = await Promise.all([
          supabase.from("sp_sessions").select("*").eq("id", sessionId).single(),
          supabase.from("sp_session_blocks").select("*").eq("session_id", sessionId).order("sort_order"),
          supabase.from("sp_squads").select("*"),
        ]);
        if (sessionRes.error) throw sessionRes.error;
        setSession(sessionRes.data as Session);
        setTheme(sessionRes.data?.theme || "");
        if (blocksRes.error) throw blocksRes.error;
        blockManager.setBlocks((blocksRes.data || []) as SessionBlock[]);
        if (squadsRes.error) throw squadsRes.error;
        setSquads((squadsRes.data || []) as Squad[]);
      } catch (err) {
        console.error("Error fetching session data:", err);
        setError(err instanceof Error ? err.message : "Failed to load session");
      } finally {
        setIsLoading(false);
      }
    };
    if (sessionId) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isInput = (e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA";

      // Ctrl+Z — Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const prev = undoRedo.undo();
        if (prev) blockManager.setBlocks(prev);
      }
      // Ctrl+Shift+Z — Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        const next = undoRedo.redo();
        if (next) blockManager.setBlocks(next);
      }
      // Ctrl+C — Copy selected blocks
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && !isInput && blockManager.selectedBlockIds.length > 0) {
        e.preventDefault();
        const selected = blockManager.blocks.filter((b) => blockManager.selectedBlockIds.includes(b.id));
        clipboard.copy(selected);
      }
      // Ctrl+V — Paste blocks
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && !isInput && clipboard.hasClipboard) {
        e.preventDefault();
        const pasted = clipboard.paste(1, session?.start_time || "17:00");
        if (pasted) {
          undoRedo.pushState(blockManager.blocks);
          pasted.forEach((b) => blockManager.addBlock({ ...b, session_id: sessionId }));
        }
      }
      // Delete/Backspace — Delete selected
      if ((e.key === "Delete" || e.key === "Backspace") && !isInput && blockManager.selectedBlockIds.length > 0) {
        e.preventDefault();
        undoRedo.pushState(blockManager.blocks);
        blockManager.selectedBlockIds.forEach((id) => blockManager.deleteBlock(id));
        blockManager.setSelectedBlockIds([]);
      }
      // Escape — Deselect / close panels
      if (e.key === "Escape") {
        blockManager.setSelectedBlockIds([]);
        setTierSelector(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [blockManager, undoRedo, clipboard, session, sessionId]);

  // Wrap mutations to push undo state
  const addBlock = useCallback(
    (block: Omit<SessionBlock, "id" | "created_at" | "updated_at">) => {
      undoRedo.pushState(blockManager.blocks);
      return blockManager.addBlock(block);
    },
    [blockManager, undoRedo]
  );

  const updateBlock = useCallback(
    (id: string, updates: Partial<SessionBlock>) => {
      undoRedo.pushState(blockManager.blocks);
      blockManager.updateBlock(id, updates);
    },
    [blockManager, undoRedo]
  );

  const deleteBlock = useCallback(
    (id: string) => {
      undoRedo.pushState(blockManager.blocks);
      blockManager.deleteBlock(id);
    },
    [blockManager, undoRedo]
  );

  const moveBlock = useCallback(
    (id: string, laneStart: number, laneEnd: number, timeStart: string, timeEnd: string) => {
      undoRedo.pushState(blockManager.blocks);
      blockManager.moveBlock(id, laneStart, laneEnd, timeStart, timeEnd);
    },
    [blockManager, undoRedo]
  );

  const duplicateBlock = useCallback(
    (block: SessionBlock) => {
      undoRedo.pushState(blockManager.blocks);
      const [h, m] = block.time_end.split(":").map(Number);
      const startMins = h * 60 + m;
      const [bsH, bsM] = block.time_start.split(":").map(Number);
      const [beH, beM] = block.time_end.split(":").map(Number);
      const duration = (beH * 60 + beM) - (bsH * 60 + bsM);
      const newEndMins = startMins + duration;
      const newTimeStart = `${Math.floor(startMins / 60).toString().padStart(2, "0")}:${(startMins % 60).toString().padStart(2, "0")}`;
      const newTimeEnd = `${Math.floor(newEndMins / 60).toString().padStart(2, "0")}:${(newEndMins % 60).toString().padStart(2, "0")}`;
      blockManager.addBlock({ ...block, session_id: sessionId, time_start: newTimeStart, time_end: newTimeEnd, sort_order: block.sort_order + 1 });
    },
    [blockManager, undoRedo, sessionId]
  );

  // Copy Hour handler
  const handleCopyHour = useCallback(
    (sourceStart: string, sourceEnd: string, targetStart: string) => {
      const copied = clipboard.copyHour(blockManager.blocks, sourceStart, sourceEnd, targetStart);
      if (copied.length > 0) {
        undoRedo.pushState(blockManager.blocks);
        copied.forEach((b) => blockManager.addBlock({ ...b, session_id: sessionId }));
      }
      setCopyHourOpen(false);
    },
    [blockManager, clipboard, undoRedo, sessionId]
  );

  // Library drag-drop: when activity dropped on grid, show tier selector
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLibraryDrop = useCallback(
    (activity: Activity, laneStart: number, laneEnd: number, timeStart: string, timeEnd: string, position: { x: number; y: number }) => {
      setTierSelector({ activity, position, laneStart, laneEnd, timeStart, timeEnd });
    },
    []
  );

  // Tier selected from library drop
  const handleTierSelected = useCallback(
    (tier: Tier) => {
      if (!tierSelector) return;
      const { activity, laneStart, laneEnd, timeStart, timeEnd } = tierSelector;
      addBlock({
        session_id: sessionId,
        activity_id: activity.id,
        name: activity.name,
        lane_start: laneStart,
        lane_end: laneEnd,
        time_start: timeStart,
        time_end: timeEnd,
        colour: CATEGORY_COLOURS[activity.category as BlockCategory] || "#D4D4D8",
        category: activity.category as BlockCategory,
        tier,
        other_location: undefined,
        coaching_notes: undefined,
        coaching_points: [],
        player_groups: [],
        equipment: activity.equipment || [],
        coach_assigned: undefined,
        sort_order: blockManager.blocks.length,
        created_by: undefined,
      });
      setTierSelector(null);
    },
    [tierSelector, addBlock, sessionId, blockManager.blocks.length]
  );

  const handleThemeSave = async () => {
    try {
      await supabase.from("sp_sessions").update({ theme }).eq("id", sessionId);
      setIsEditingTheme(false);
    } catch (err) {
      console.error("Error saving theme:", err);
    }
  };

  const handleSessionMetadataUpdate = useCallback(async (updates: Partial<Session>) => {
    const { error } = await supabase
      .from("sp_sessions")
      .update(updates)
      .eq("id", sessionId);
    if (error) throw error;
    // Update local state
    setSession((prev) => prev ? { ...prev, ...updates } : prev);
    if (updates.theme !== undefined) setTheme(updates.theme || "");
  }, [supabase, sessionId]);

  const getSessionDate = () => {
    if (!session?.date) return "";
    const date = new Date(session.date + "T00:00:00");
    return new Intl.DateTimeFormat("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(date);
  };

  const sessionSquads = session?.squad_ids ? squads.filter((s) => session.squad_ids.includes(s.id)) : [];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500 dark:text-gray-400">Loading session...</div></div>;
  }
  if (error || !session) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-red-500">{error || "Session not found"}</div></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <div className="px-6 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1 text-sm">
                <button
                  onClick={() => router.push("/dashboard/month")}
                  className="text-gray-400 hover:text-rr-blue transition font-medium"
                >
                  Month
                </button>
                <span className="text-gray-300">/</span>
              </nav>
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{getSessionDate()}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatTime(session.start_time)} – {formatTime(session.end_time)}</p>
                </div>
                <SessionMetadataEditor session={session} squads={squads} onUpdate={handleSessionMetadataUpdate} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Toolbar buttons — edit controls hidden for guest_coach and player */}
              <ExportPdfButton session={session} blocks={blockManager.blocks} squads={sessionSquads} />
              {canEdit && (
                <>
                  <button
                    onClick={() => setCopyHourOpen(true)}
                    className="text-xs px-3 py-1.5 bg-rr-blue/10 text-rr-blue font-semibold rounded-lg hover:bg-rr-blue/20 transition"
                  >
                    Copy Hour
                  </button>
                  <button
                    onClick={() => setLibraryOpen(!libraryOpen)}
                    className={cn(
                      "text-xs px-3 py-1.5 font-semibold rounded-lg transition",
                      libraryOpen ? "bg-rr-pink text-white" : "bg-rr-pink/10 text-rr-pink hover:bg-rr-pink/20"
                    )}
                  >
                    {libraryOpen ? "Close Library" : "Activity Library"}
                  </button>
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                  <SaveIndicator status={saveStatus} />
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    {undoRedo.canUndo && <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">⌘Z</span>}
                    {undoRedo.canRedo && <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">⌘⇧Z</span>}
                    {clipboard.hasClipboard && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">⌘V paste</span>}
                  </div>
                </>
              )}
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold",
                session.status === "published" ? "bg-green-100 text-green-800"
                  : session.status === "completed" ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800"
              )}>
                {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {sessionSquads.map((squad) => (
                <SquadBadge key={squad.id} name={squad.name} colour={squad.colour} size="sm" />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500">Theme:</span>
              {isEditingTheme ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={theme} onChange={(e) => setTheme(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-rr-pink dark:bg-gray-700 dark:text-white"
                    placeholder="Session theme" autoFocus onKeyDown={(e) => e.key === "Enter" && handleThemeSave()} />
                  <button onClick={handleThemeSave} className="text-xs px-2 py-1 bg-rr-pink text-white rounded">Save</button>
                  <button onClick={() => { setTheme(session.theme || ""); setIsEditingTheme(false); }} className="text-xs px-2 py-1 bg-gray-200 rounded">Cancel</button>
                </div>
              ) : (
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded" onClick={() => setIsEditingTheme(true)}>
                  {theme || "Click to set theme"}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Grid + Library Panel */}
      <div className="flex-1 overflow-hidden relative">
        {canEdit ? (
          <SessionGrid
            session={session}
            blocks={blockManager.blocks}
            selectedBlockIds={blockManager.selectedBlockIds}
            onAddBlock={addBlock}
            onUpdateBlock={updateBlock}
            onDeleteBlock={deleteBlock}
            onMoveBlock={moveBlock}
            onDuplicateBlock={duplicateBlock}
            onSelectBlocks={blockManager.setSelectedBlockIds}
            hasCollision={blockManager.hasCollision}
          />
        ) : (
          <ReadOnlyGrid session={session} blocks={blockManager.blocks} />
        )}

        {/* Activity Library Panel */}
        <LibraryPanel
          isOpen={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          onDragStart={(activity, e) => {
            e.dataTransfer.setData("application/activity-id", activity.id);
            e.dataTransfer.setData("application/activity-json", JSON.stringify(activity));
            e.dataTransfer.effectAllowed = "copy";
          }}
        />

        {/* Block Detail Panel */}
        {selectedBlock && (
          <BlockDetailPanel
            block={selectedBlock}
            onUpdate={updateBlock}
            onClose={() => blockManager.setSelectedBlockIds([])}
          />
        )}
      </div>

      {/* Copy Hour Dialog */}
      {session && (
        <CopyHourDialog
          isOpen={copyHourOpen}
          onClose={() => setCopyHourOpen(false)}
          sessionStartTime={session.start_time}
          sessionEndTime={session.end_time}
          onCopyHour={handleCopyHour}
        />
      )}

      {/* Tier Selector (from library drop) */}
      {tierSelector && (
        <TierSelector
          activity={tierSelector.activity}
          position={tierSelector.position}
          onSelect={handleTierSelected}
          onCancel={() => setTierSelector(null)}
        />
      )}
    </div>
  );
}
