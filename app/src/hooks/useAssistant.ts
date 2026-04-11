"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Session, SessionBlock, Activity, Squad, Program, Phase, BlockCategory, Tier } from "@/lib/types";
import { CATEGORY_COLOURS } from "@/lib/constants";
import { buildSystemPrompt } from "@/lib/assistant-context";
import { validateToolCall } from "@/lib/assistant-tools";
import { analyzeSession, formatAnalysisForTool } from "@/lib/session-analysis";
import { executeAdminAction, describeAdminAction, validateAdminToolCall } from "@/lib/admin-tools";
import { createClient } from "@/lib/supabase/client";

// shiftDate removed — H5 fix now uses server-side RPC for atomic date shifts

/**
 * An image or PDF attachment on a chat message
 */
export interface Attachment {
  /** Unique ID for this attachment */
  id: string;
  /** Original filename */
  filename: string;
  /** MIME type (image/jpeg, image/png, image/gif, image/webp, application/pdf) */
  mediaType: string;
  /** Base64-encoded file data (only present in current session, not persisted) */
  data?: string;
  /** File size in bytes */
  size: number;
}

/**
 * Chat message in the assistant conversation
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Image/file attachments on this message */
  attachments?: Attachment[];
  /** Tool calls returned by Claude — pending actions to preview/execute */
  toolCalls?: ToolCallAction[];
  /** Whether tool call actions have been applied */
  actionsApplied?: boolean;
  timestamp: Date;
}

/**
 * A parsed tool call from Claude's response, ready for preview/execution
 */
export interface ToolCallAction {
  id: string;
  toolName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>;
  /** Human-readable description of what this action does */
  description: string;
  /** Validation error, if any */
  error?: string;
}

/** Live session data provided via ref-based context (read on-demand, not reactive) */
interface ActiveSessionData {
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

interface UseAssistantProps {
  /** Getter for live session data (ref-based, avoids re-render loops) */
  getActiveSession: () => ActiveSessionData | null;
  activities: Activity[];
  squads: Squad[];
  program?: Program | null;
  phases?: Phase[];
  allSessions?: Session[];
  onSessionUpdated?: () => void;
  isAdmin?: boolean;
}

/** Thread summary for the thread selector */
export interface ThreadSummary {
  id: string;
  title: string | null;
  session_id: string | null;
  updated_at: string;
}

// Module-level flag for user-initiated new chat (survives re-mounts intentionally)
let _userStartedNewChat = false;

export function useAssistant({
  getActiveSession,
  activities,
  squads,
  onSessionUpdated,
  program,
  phases = [],
  allSessions = [],
  isAdmin = false,
}: UseAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageIdCounter = useRef(0);
  const [knowledge, setKnowledge] = useState<{ category: string; title: string; content: string }[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const supabaseRef = useRef(createClient());
  const initialLoadDoneRef = useRef(false);
  const threadCreationPromiseRef = useRef<Promise<string | null> | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;
  const isLoadingRef = useRef(false);

  // Load coaching knowledge base on mount
  useEffect(() => {
    const supabase = supabaseRef.current;
    supabase
      .from("sp_coaching_knowledge")
      .select("category, title, content")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }: { data: { category: string; title: string; content: string }[] | null }) => {
        if (data) setKnowledge(data);
      });
  }, []);

  /** Load messages for a specific thread */
  const loadThread = useCallback(async (id: string) => {
    const supabase = supabaseRef.current;
    const { data } = await supabase
      .from("sp_assistant_messages")
      .select("id, role, content, tool_calls, attachments, actions_applied, created_at")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loaded: ChatMessage[] = data.map((m: any) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        attachments: m.attachments && Array.isArray(m.attachments) && m.attachments.length > 0
          ? m.attachments.map((a: { id: string; filename: string; mediaType: string; size: number }) => ({
              id: a.id,
              filename: a.filename,
              mediaType: a.mediaType,
              size: a.size,
              // No base64 data — it's not persisted
            }))
          : undefined,
        toolCalls: m.tool_calls && Array.isArray(m.tool_calls) && m.tool_calls.length > 0
          ? m.tool_calls.map((tc: { id: string; toolName: string; input: Record<string, unknown>; description: string; error?: string }) => ({
              id: tc.id,
              toolName: tc.toolName,
              input: tc.input,
              description: tc.description,
              error: tc.error,
            }))
          : undefined,
        actionsApplied: m.actions_applied,
        timestamp: new Date(m.created_at),
      }));
      setMessages(loaded);
      setThreadId(id);
    }
  }, []);

  // Load thread list on mount
  const loadThreads = useCallback(async () => {
    const supabase = supabaseRef.current;
    const { data } = await supabase
      .from("sp_assistant_threads")
      .select("id, title, session_id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(15);
    if (data) setThreads(data as ThreadSummary[]);
  }, []);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  // Load the most recent thread on mount (resume last conversation)
  useEffect(() => {
    if (threads.length > 0 && !initialLoadDoneRef.current && !_userStartedNewChat) {
      initialLoadDoneRef.current = true;
      loadThread(threads[0].id);
    }
  }, [threads, loadThread]);

  /** Create a new thread in the DB */
  const createThread = useCallback(async (firstMessage: string): Promise<string | null> => {
    const supabase = supabaseRef.current;
    const active = getActiveSession();
    const { data: userData } = await supabase.auth.getUser();
    const title = firstMessage.length > 50 ? firstMessage.slice(0, 50) + "..." : firstMessage;
    const { data, error } = await supabase
      .from("sp_assistant_threads")
      .insert({
        user_id: userData.user?.id,
        title,
        session_id: active?.sessionId || null,
      })
      .select("id")
      .single();
    if (error || !data) return null;
    return data.id;
  }, [getActiveSession]);

  /** Save a message to the DB */
  const saveMessage = useCallback(async (tId: string, msg: ChatMessage) => {
    const supabase = supabaseRef.current;
    // Strip base64 data from attachments before persisting (too large for DB)
    const attachmentsMeta = msg.attachments?.map(a => ({
      id: a.id,
      filename: a.filename,
      mediaType: a.mediaType,
      size: a.size,
    })) || [];
    const { data, error: msgInsertError } = await supabase.from("sp_assistant_messages").insert({
      thread_id: tId,
      role: msg.role,
      content: msg.content,
      tool_calls: msg.toolCalls || [],
      attachments: attachmentsMeta.length > 0 ? attachmentsMeta : [],
      actions_applied: msg.actionsApplied || false,
    }).select("id").single();
    if (msgInsertError) console.error("Failed to save assistant message:", msgInsertError.message);
    // Update the client-side message ID to match the DB UUID
    if (data) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, id: data.id } : m));
    }
  }, []);

  /** Switch to an existing thread */
  const switchThread = useCallback(async (id: string) => {
    _userStartedNewChat = false;
    await loadThread(id);
  }, [loadThread]);

  /** Start a new chat (clears current, new thread created lazily on first send) */
  const startNewChat = useCallback(() => {
    _userStartedNewChat = true;
    setThreadId(null);
    setMessages([]);
    setError(null);
  }, []);

  const genId = () => `msg_${Date.now()}_${++messageIdCounter.current}`;

  /**
   * Describe a tool call action in human-readable terms
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const describeAction = (toolName: string, input: Record<string, any>): string => {
    switch (toolName) {
      case "add_block":
        return `Add "${input.name}" at ${input.time_start}-${input.time_end} in lane${input.lane_start === input.lane_end ? "" : "s"} ${input.lane_start}${input.lane_end !== input.lane_start ? `-${input.lane_end}` : ""} (${input.category}, Tier ${input.tier})`;
      case "update_block": {
        const changes = Object.keys(input.updates || {}).join(", ");
        return `Update block: change ${changes}`;
      }
      case "move_block":
        return `Move block to ${input.time_start}-${input.time_end}, lanes ${input.lane_start}-${input.lane_end}`;
      case "delete_block":
        return `Delete block`;
      case "clear_time_range":
        return `Clear all blocks from ${input.time_start} to ${input.time_end}`;
      case "copy_hour":
        return `Copy blocks from ${input.source_start}-${input.source_end} to ${input.target_start}`;
      case "search_activities":
        return `Search activities: "${input.query || ""}" ${input.category ? `in ${input.category}` : ""}`;
      case "get_session_summary":
        return `Get session summary`;
      case "analyze_session":
        return `Analyse session: balance, warm-up, lane usage, tier mix, issues`;
      case "update_session": {
        const changes = Object.keys(input).filter(k => input[k] !== undefined).join(", ");
        return `Update session: ${changes}`;
      }
      case "create_activity":
        return `Create new activity: "${input.name}" (${input.category})`;
      case "shift_program_dates":
        return `Shift entire program by ${input.days} days (${input.days > 0 ? "forward" : "backward"})`;
      case "update_program":
        return `Update program: ${Object.keys(input).filter(k => input[k]).join(", ")}`;
      case "update_phase":
        return `Update phase "${input.phase_name}": ${Object.keys(input).filter(k => k !== "phase_name" && input[k]).join(", ")}`;
      case "create_session":
        return `Create session on ${input.date} ${input.start_time}-${input.end_time}`;
      case "list_sessions":
        return `List all sessions`;
      case "remember":
        return `Remember: "${input.title}" (${input.category})`;
      case "recall":
        return `Recall: ${input.query || input.category || "all memories"}`;
      case "forget":
        return `Forget knowledge entry`;
      case "list_coaches":
        return `List coaches${input.date ? ` (availability for ${input.date})` : ""}`;
      case "set_coach_availability":
        return `Set ${input.coach_name} as ${input.status} on ${input.date}`;
      case "roster_coach":
        return `Roster ${input.coach_name} to session${input.session_date ? ` on ${input.session_date}` : ""}`;
      case "unroster_coach":
        return `Remove ${input.coach_name} from session${input.session_date ? ` on ${input.session_date}` : ""}`;
      case "update_coach_profile": {
        const fields = [input.display_name && "name", input.phone && "phone", input.speciality && "speciality"].filter(Boolean).join(", ");
        return `Update ${input.coach_name}'s profile: ${fields}`;
      }
      case "get_session_roster":
        return `Get coaching roster${input.session_date ? ` for ${input.session_date}` : " for current session"}`;
      default:
        // Check if it's an admin tool
        if (toolName.startsWith("admin_")) {
          return describeAdminAction(toolName, input);
        }
        return `${toolName}`;
    }
  };

  /**
   * Execute a single tool call action against the session grid.
   * Reads live session data via getActiveSession() so it always has the latest blocks/callbacks.
   */
  const executeAction = useCallback(
    async (action: ToolCallAction): Promise<string | null> => {
      const { toolName, input } = action;
      // Read live session data from the ref-based context
      const active = getActiveSession();
      const sessionId = active?.sessionId;
      const session = active?.session;
      const blocks = active?.blocks;
      const onAddBlock = active?.onAddBlock;
      const onUpdateBlock = active?.onUpdateBlock;
      const onDeleteBlock = active?.onDeleteBlock;
      const onMoveBlock = active?.onMoveBlock;
      const hasCollision = active?.hasCollision;
      const copyHour = active?.copyHour;
      const onUpdateSession = active?.onUpdateSession;

      // Validate first (check both standard and admin tools)
      const validationError = toolName.startsWith("admin_")
        ? validateAdminToolCall(toolName, input)
        : validateToolCall(toolName, input);
      if (validationError) return validationError;

      switch (toolName) {
        case "add_block": {
          if (!sessionId || !onAddBlock || !hasCollision) return "Navigate to a session first to place blocks on the grid.";
          // Check collision
          const collision = hasCollision({
            laneStart: input.lane_start,
            laneEnd: input.lane_end,
            timeStart: input.time_start,
            timeEnd: input.time_end,
          });
          if (collision) {
            return `Cannot place "${input.name}" — there's already a block at that position. Try a different time or lane.`;
          }

          onAddBlock({
            session_id: sessionId,
            activity_id: input.activity_id || undefined,
            name: input.name,
            lane_start: input.lane_start,
            lane_end: input.lane_end,
            time_start: input.time_start,
            time_end: input.time_end,
            colour: CATEGORY_COLOURS[input.category as BlockCategory] || "#D4D4D8",
            category: input.category as BlockCategory,
            tier: input.tier as Tier,
            other_location: input.other_location,
            coaching_notes: input.coaching_notes,
            coaching_points: [],
            player_groups: [],
            equipment: [],
            coach_assigned: input.coach_assigned,
            sort_order: (blocks || []).length,
            created_by: undefined,
          });
          return null; // Success
        }

        case "update_block": {
          if (!onUpdateBlock) return "Navigate to a session first.";
          const block = (blocks || []).find((b) => b.id === input.block_id);
          if (!block) return `Block not found: ${input.block_id}`;
          onUpdateBlock(input.block_id, input.updates);
          return null;
        }

        case "move_block": {
          if (!onMoveBlock || !hasCollision) return "Navigate to a session first.";
          const block = (blocks || []).find((b) => b.id === input.block_id);
          if (!block) return `Block not found: ${input.block_id}`;
          const collision = hasCollision(
            { laneStart: input.lane_start, laneEnd: input.lane_end, timeStart: input.time_start, timeEnd: input.time_end },
            input.block_id
          );
          if (collision) return `Cannot move — destination is occupied.`;
          onMoveBlock(input.block_id, input.lane_start, input.lane_end, input.time_start, input.time_end);
          return null;
        }

        case "delete_block": {
          if (!onDeleteBlock) return "Navigate to a session first.";
          const block = (blocks || []).find((b) => b.id === input.block_id);
          if (!block) return `Block not found: ${input.block_id}`;
          onDeleteBlock(input.block_id);
          return null;
        }

        case "clear_time_range": {
          const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
          const rangeStartMins = toMins(input.time_start);
          const rangeEndMins = toMins(input.time_end);
          const toDelete = (blocks || []).filter(
            (b) => { const bm = toMins(b.time_start); return bm >= rangeStartMins && bm < rangeEndMins; }
          );
          if (!onDeleteBlock) return "Navigate to a session first.";
          toDelete.forEach((b) => onDeleteBlock(b.id));
          return null;
        }

        case "copy_hour": {
          if (!copyHour || !onAddBlock || !sessionId) return "Navigate to a session first.";
          const copied = copyHour(blocks || [], input.source_start, input.source_end, input.target_start);
          copied.forEach((b) => onAddBlock({ ...b, session_id: sessionId }));
          return null;
        }

        case "search_activities": {
          // Search is informational — returns results to the AI, not an action
          const query = (input.query || "").toLowerCase();
          const results = activities.filter((a) => {
            if (input.category && a.category !== input.category) return false;
            if (query && !a.name.toLowerCase().includes(query) && !a.category.includes(query)) return false;
            return true;
          });
          return `Found ${results.length} activities: ${results.slice(0, 10).map((a) => a.name).join(", ")}${results.length > 10 ? "..." : ""}`;
        }

        case "get_session_summary": {
          if (!blocks || blocks.length === 0) return "The session grid is empty.";
          const sorted = [...blocks].sort((a, b) => a.time_start.localeCompare(b.time_start));
          return `Session has ${blocks.length} blocks from ${sorted[0]?.time_start} to ${sorted[sorted.length - 1]?.time_end}.`;
        }

        case "analyze_session": {
          // Structured deterministic critique — the model cites numbers from
          // this payload instead of hand-waving. See session-analysis.ts and
          // docs/AI_CAPABILITIES_REPORT.md V1 "Session balance feedback" +
          // "Push back on poor session design".
          if (!session) {
            return "Navigate to a session first to analyse it — there's no active session on screen.";
          }
          const activePhase =
            phases.find((p) => p.id === session.phase_id) || null;
          const analysis = analyzeSession({
            session,
            blocks: blocks || [],
            activities,
            phase: activePhase,
          });
          return formatAnalysisForTool(analysis);
        }

        case "update_session": {
          try {
            // Build updates object from input, filtering out undefined values
            const updates: Partial<Session> = {};
            if (input.date) updates.date = input.date;
            if (input.start_time) updates.start_time = input.start_time;
            if (input.end_time) updates.end_time = input.end_time;
            if (input.theme !== undefined) updates.theme = input.theme;
            if (input.status) updates.status = input.status;
            if (input.notes !== undefined) updates.notes = input.notes;

            // Execute via the session page's update handler
            if (!onUpdateSession) return "Navigate to a session first to modify session metadata.";
            await onUpdateSession(updates);
            if (onSessionUpdated) onSessionUpdated();
            return null; // Success
          } catch (err) {
            return `Failed to update session: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "create_activity": {
          try {
            const supabase = createClient();
            const { error } = await supabase.from("sp_activities").insert({
              name: input.name,
              category: input.category,
              sub_category: input.sub_category || null,
              description: input.description,
              default_duration_mins: input.default_duration_mins || 15,
              default_lanes: input.default_lanes || 1,
              regression: input.regression || {},
              progression: input.progression || {},
              elite: input.elite || {},
              gamify: input.gamify || {},
              is_global: true,
            });
            if (error) return `Failed to create activity: ${error.message}`;
            return null; // Success
          } catch (err) {
            return `Failed to create activity: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "shift_program_dates": {
          try {
            if (!program) return "No program loaded.";
            const supabase = createClient();
            const { error } = await supabase.rpc("shift_program_dates", {
              p_program_id: program.id,
              p_days: input.days,
            });
            if (error) return `Failed to shift dates: ${error.message}`;
            if (onSessionUpdated) onSessionUpdated();
            return null;
          } catch (err) {
            return `Failed to shift dates: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "update_program": {
          try {
            if (!program) return "No program loaded.";
            const supabase = createClient();
            const updates: Record<string, string> = {};
            if (input.name) updates.name = input.name;
            if (input.start_date) updates.start_date = input.start_date;
            if (input.end_date) updates.end_date = input.end_date;
            if (input.description) updates.description = input.description;
            const { error } = await supabase.from("sp_programs").update(updates).eq("id", program.id);
            if (error) return `Failed: ${error.message}`;
            if (onSessionUpdated) onSessionUpdated();
            return null;
          } catch (err) {
            return `Failed: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "update_phase": {
          try {
            const supabase = createClient();
            const phase = phases.find((p) => p.name.toLowerCase() === input.phase_name.toLowerCase());
            if (!phase) return `Phase "${input.phase_name}" not found. Available: ${phases.map((p) => p.name).join(", ")}`;
            const updates: Record<string, unknown> = {};
            if (input.name) updates.name = input.name;
            if (input.start_date) updates.start_date = input.start_date;
            if (input.end_date) updates.end_date = input.end_date;
            if (input.goals) updates.goals = input.goals;
            if (input.description) updates.description = input.description;
            const { error } = await supabase.from("sp_phases").update(updates).eq("id", phase.id);
            if (error) return `Failed: ${error.message}`;
            if (onSessionUpdated) onSessionUpdated();
            return null;
          } catch (err) {
            return `Failed: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "create_session": {
          try {
            const supabase = createClient();
            // Resolve squad names to IDs
            const squadIds = (input.squad_names || [])
              .map((name: string) => squads.find((s) => s.name.toLowerCase() === name.toLowerCase())?.id)
              .filter(Boolean);
            const { error } = await supabase.from("sp_sessions").insert({
              program_id: program?.id,
              phase_id: phases.find((p) => input.date >= p.start_date && input.date <= p.end_date)?.id || null,
              venue_id: "a1b2c3d4-0003-4000-8000-000000000001", // CEC Bundoora
              date: input.date,
              start_time: input.start_time,
              end_time: input.end_time,
              squad_ids: squadIds,
              theme: input.theme || null,
              status: "draft",
            });
            if (error) return `Failed: ${error.message}`;
            if (onSessionUpdated) onSessionUpdated();
            return null;
          } catch (err) {
            return `Failed: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "list_sessions": {
          if (allSessions.length === 0) return "No sessions scheduled.";
          return allSessions
            .map((s) => {
              const sSquads = squads.filter((sq) => s.squad_ids?.includes(sq.id)).map((sq) => sq.name).join(", ");
              return `${s.date} ${s.start_time}-${s.end_time} | ${sSquads || "No squad"} | "${s.theme || "No theme"}" [${s.status}]`;
            })
            .join("\n");
        }

        case "remember": {
          try {
            const supabase = createClient();
            const { error } = await supabase.from("sp_coaching_knowledge").insert({
              category: input.category,
              title: input.title,
              content: input.content,
              tags: input.tags || [],
              source: `AI Coach conversation on ${(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; })()}`,
            });
            if (error) return `Failed to remember: ${error.message}`;
            return null;
          } catch (err) {
            return `Failed: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "recall": {
          try {
            const supabase = createClient();
            let query = supabase.from("sp_coaching_knowledge").select("*").eq("is_active", true);
            if (input.category) query = query.eq("category", input.category);
            const { data, error } = await query.order("created_at", { ascending: false }).limit(20);
            if (error) return `Failed to recall: ${error.message}`;
            if (!data || data.length === 0) return "No memories found matching that query.";

            const searchLower = (input.query || "").toLowerCase();
            const filtered = searchLower
              ? data.filter((k: { title: string; content: string }) =>
                  k.title.toLowerCase().includes(searchLower) ||
                  k.content.toLowerCase().includes(searchLower)
                )
              : data;

            if (filtered.length === 0) return "No memories found matching that query.";

            return filtered
              .map((k: { id: string; category: string; title: string; content: string; created_at: string }) =>
                `[${k.category}] "${k.title}": ${k.content} (saved ${k.created_at.split("T")[0]}, id: ${k.id})`
              )
              .join("\n\n");
          } catch (err) {
            return `Failed: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "forget": {
          try {
            const supabase = createClient();
            const { error } = await supabase
              .from("sp_coaching_knowledge")
              .update({ is_active: false })
              .eq("id", input.knowledge_id);
            if (error) return `Failed: ${error.message}`;
            return null;
          } catch (err) {
            return `Failed: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        // ====================================================================
        // Coach Management Tools
        // ====================================================================
        case "list_coaches": {
          try {
            const supabase = createClient();
            const programId = program?.id;
            if (!programId) return "No active program.";

            const { data: coaches, error } = await supabase
              .from("sp_program_members")
              .select("*")
              .eq("program_id", programId)
              .eq("status", "active")
              .in("role", ["head_coach", "assistant_coach", "guest_coach"])
              .order("role");
            if (error) return `Failed: ${error.message}`;
            if (!coaches || coaches.length === 0) return "No coaches found in this program.";

            let availData: Record<string, string> = {};
            if (input.date) {
              // Resolve date to session IDs (availability is keyed by session_id, not date)
              const { data: dateSessions } = await supabase
                .from("sp_sessions")
                .select("id")
                .eq("program_id", programId)
                .eq("date", input.date);
              const dateSessionIds = (dateSessions || []).map((s: { id: string }) => s.id);
              if (dateSessionIds.length > 0) {
                const { data: avail } = await supabase
                  .from("sp_coach_availability")
                  .select("user_id, status")
                  .eq("program_id", programId)
                  .in("session_id", dateSessionIds);
                if (avail) {
                  availData = Object.fromEntries(avail.map((a: { user_id: string; status: string }) => [a.user_id, a.status]));
                }
              }
            }

            return coaches
              .map((c: { display_name: string; role: string; speciality: string; user_id: string; phone: string }) => {
                const avail = input.date ? (availData[c.user_id] || "not set") : "";
                return `• ${c.display_name || "Unnamed"} — ${c.role.replace("_", " ")}${c.speciality ? ` (${c.speciality})` : ""}${c.phone ? ` | ${c.phone}` : ""}${avail ? ` | ${avail}` : ""}`;
              })
              .join("\n");
          } catch (err) {
            return `Failed: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "set_coach_availability": {
          try {
            const supabase = createClient();
            const programId = program?.id;
            if (!programId) return "No active program.";

            // Find coach by name
            const { data: coaches } = await supabase
              .from("sp_program_members")
              .select("user_id, display_name")
              .eq("program_id", programId)
              .eq("status", "active")
              .in("role", ["head_coach", "assistant_coach", "guest_coach"]);

            const coach = coaches?.find((c: { display_name: string }) =>
              c.display_name?.toLowerCase().includes(input.coach_name.toLowerCase())
            );
            if (!coach) return `Coach "${input.coach_name}" not found. Available coaches: ${coaches?.map((c: { display_name: string }) => c.display_name).join(", ")}`;

            // Find matching sessions on that date
            let sessionsQuery = supabase
              .from("sp_sessions")
              .select("id, start_time, end_time")
              .eq("program_id", programId)
              .eq("date", input.date);

            if (input.start_time) {
              sessionsQuery = sessionsQuery.eq("start_time", input.start_time);
            }

            const { data: sessions } = await sessionsQuery;
            if (!sessions || sessions.length === 0) return `No sessions found on ${input.date}${input.start_time ? ` at ${input.start_time}` : ""}.`;

            // Set availability for each matching session
            const results = await Promise.all(
              sessions.map((s: { id: string }) =>
                supabase
                  .from("sp_coach_availability")
                  .upsert(
                    { program_id: programId, session_id: s.id, user_id: coach.user_id, status: input.status, notes: input.notes || null },
                    { onConflict: "session_id,user_id" }
                  )
              )
            );
            const failed = results.find((r) => r.error);
            if (failed?.error) return `Failed: ${failed.error.message}`;
            return null;
          } catch (err) {
            return `Failed: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "roster_coach": {
          try {
            const supabase = createClient();
            const programId = program?.id;
            if (!programId) return "No active program.";

            // Find coach
            const { data: coaches } = await supabase
              .from("sp_program_members")
              .select("user_id, display_name")
              .eq("program_id", programId)
              .eq("status", "active")
              .in("role", ["head_coach", "assistant_coach", "guest_coach"]);

            const coach = coaches?.find((c: { display_name: string }) =>
              c.display_name?.toLowerCase().includes(input.coach_name.toLowerCase())
            );
            if (!coach) return `Coach "${input.coach_name}" not found.`;

            // Find session
            let targetSessionId = input.session_id;
            if (!targetSessionId && input.session_date) {
              const { data: sessions } = await supabase
                .from("sp_sessions")
                .select("id")
                .eq("program_id", programId)
                .eq("date", input.session_date)
                .limit(1);
              targetSessionId = sessions?.[0]?.id;
            }
            if (!targetSessionId) {
              // Fall back to active session
              const active = getActiveSession();
              targetSessionId = active?.sessionId;
            }
            if (!targetSessionId) return "No session found. Specify a session_date or navigate to a session.";

            const { error } = await supabase
              .from("sp_session_coaches")
              .upsert(
                { session_id: targetSessionId, user_id: coach.user_id, role: input.role || "assistant_coach" },
                { onConflict: "session_id,user_id" }
              );
            if (error) return `Failed: ${error.message}`;
            return null;
          } catch (err) {
            return `Failed: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "unroster_coach": {
          try {
            const supabase = createClient();
            const programId = program?.id;
            if (!programId) return "No active program.";

            // Find coach
            const { data: coaches } = await supabase
              .from("sp_program_members")
              .select("user_id, display_name")
              .eq("program_id", programId)
              .eq("status", "active")
              .in("role", ["head_coach", "assistant_coach", "guest_coach"]);

            const coach = coaches?.find((c: { display_name: string }) =>
              c.display_name?.toLowerCase().includes(input.coach_name.toLowerCase())
            );
            if (!coach) return `Coach "${input.coach_name}" not found.`;

            // Find session
            let targetSessionId = input.session_id;
            if (!targetSessionId && input.session_date) {
              const { data: sessions } = await supabase
                .from("sp_sessions")
                .select("id")
                .eq("program_id", programId)
                .eq("date", input.session_date)
                .limit(1);
              targetSessionId = sessions?.[0]?.id;
            }
            if (!targetSessionId) {
              const active = getActiveSession();
              targetSessionId = active?.sessionId;
            }
            if (!targetSessionId) return "No session found.";

            const { error } = await supabase
              .from("sp_session_coaches")
              .delete()
              .eq("session_id", targetSessionId)
              .eq("user_id", coach.user_id);
            if (error) return `Failed: ${error.message}`;
            return null;
          } catch (err) {
            return `Failed: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "update_coach_profile": {
          try {
            const supabase = createClient();
            const programId = program?.id;
            if (!programId) return "No active program.";

            // Find coach
            const { data: coaches } = await supabase
              .from("sp_program_members")
              .select("id, display_name")
              .eq("program_id", programId)
              .eq("status", "active")
              .in("role", ["head_coach", "assistant_coach", "guest_coach"]);

            const coach = coaches?.find((c: { display_name: string }) =>
              c.display_name?.toLowerCase().includes(input.coach_name.toLowerCase())
            );
            if (!coach) return `Coach "${input.coach_name}" not found.`;

            const updates: Record<string, string> = {};
            if (input.display_name) updates.display_name = input.display_name;
            if (input.phone) updates.phone = input.phone;
            if (input.speciality) updates.speciality = input.speciality;

            if (Object.keys(updates).length === 0) return "No updates provided.";

            const { error } = await supabase
              .from("sp_program_members")
              .update(updates)
              .eq("id", coach.id);
            if (error) return `Failed: ${error.message}`;
            return null;
          } catch (err) {
            return `Failed: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        case "get_session_roster": {
          try {
            const supabase = createClient();
            const programId = program?.id;
            if (!programId) return "No active program.";

            // Find session
            let targetSessionId = input.session_id;
            let sessionDate = input.session_date;
            if (!targetSessionId && sessionDate) {
              const { data: sessions } = await supabase
                .from("sp_sessions")
                .select("id, date, start_time, end_time")
                .eq("program_id", programId)
                .eq("date", sessionDate)
                .limit(1);
              if (sessions?.[0]) {
                targetSessionId = sessions[0].id;
              }
            }
            if (!targetSessionId) {
              const active = getActiveSession();
              targetSessionId = active?.sessionId;
              sessionDate = active?.session?.date;
            }
            if (!targetSessionId) return "No session found. Specify a session_date or navigate to a session.";

            // Get rostered coaches
            const { data: roster } = await supabase
              .from("sp_session_coaches")
              .select("user_id, role, confirmed")
              .eq("session_id", targetSessionId);

            // Get all coaches for names
            const { data: coaches } = await supabase
              .from("sp_program_members")
              .select("user_id, display_name, speciality")
              .eq("program_id", programId)
              .eq("status", "active")
              .in("role", ["head_coach", "assistant_coach", "guest_coach"]);

            // Get availability for the session
            let availData: Record<string, string> = {};
            if (targetSessionId) {
              const { data: avail } = await supabase
                .from("sp_coach_availability")
                .select("user_id, status")
                .eq("program_id", programId)
                .eq("session_id", targetSessionId);
              if (avail) {
                availData = Object.fromEntries(avail.map((a: { user_id: string; status: string }) => [a.user_id, a.status]));
              }
            }

            const coachMap = Object.fromEntries(
              (coaches || []).map((c: { user_id: string; display_name: string; speciality: string }) => [c.user_id, c])
            );

            if (!roster || roster.length === 0) {
              const availCoaches = (coaches || [])
                .map((c: { user_id: string; display_name: string }) => {
                  const avail = availData[c.user_id] || "not set";
                  return `  • ${c.display_name || "Unnamed"} — ${avail}`;
                })
                .join("\n");
              return `No coaches rostered for this session.\n\nAvailable coaches:\n${availCoaches}`;
            }

            return roster
              .map((r: { user_id: string; role: string; confirmed: boolean }) => {
                const c = coachMap[r.user_id] || { display_name: "Unknown", speciality: "" };
                const avail = availData[r.user_id] || "not set";
                return `• ${c.display_name} — ${r.role.replace("_", " ")}${c.speciality ? ` (${c.speciality})` : ""} | availability: ${avail}${r.confirmed ? " ✓" : ""}`;
              })
              .join("\n");
          } catch (err) {
            return `Failed: ${err instanceof Error ? err.message : "Unknown error"}`;
          }
        }

        default: {
          // Check if it's an admin tool
          if (toolName.startsWith("admin_") && isAdmin) {
            const supabase = createClient();
            const result = await executeAdminAction(toolName, input, supabase);

            // Audit log all admin actions
            try {
              const { data: { user } } = await supabase.auth.getUser();
              await supabase.from("sp_admin_audit_log").insert({
                user_id: user?.id,
                tool_name: toolName,
                input,
                result: result || "success",
                thread_id: threadId,
              });
            } catch {
              console.warn("Failed to log admin action to audit trail");
            }

            // Refresh data after mutations
            if (!toolName.includes("query") && !toolName.includes("integrity") && !toolName.includes("list_audit")) {
              if (onSessionUpdated) onSessionUpdated();
            }

            return result;
          }
          return `Unknown action: ${toolName}`;
        }
      }
    },
    [getActiveSession, activities, squads, program, phases, allSessions, onSessionUpdated, isAdmin, threadId]
  );

  /**
   * Apply all actions from a message
   */
  const applyActions = useCallback(
    async (messageId: string) => {
      const msg = messages.find((m) => m.id === messageId);
      if (!msg || !msg.toolCalls || msg.actionsApplied) return;

      for (const action of msg.toolCalls) {
        if (action.error) continue;
        const error = await executeAction(action);
        if (error) {
          console.warn(`Action failed: ${action.description} — ${error}`);
        }
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, actionsApplied: true } : m))
      );

      // Persist actions_applied to DB
      if (threadId) {
        await supabaseRef.current
          .from("sp_assistant_messages")
          .update({ actions_applied: true })
          .eq("id", messageId);
      }
    },
    [messages, executeAction, threadId]
  );

  /**
   * Send a message to the AI assistant
   */
  const sendMessage = useCallback(
    async (userText: string, attachments?: Attachment[]) => {
      if ((!userText.trim() && (!attachments || attachments.length === 0)) || isLoadingRef.current) return;

      setError(null);

      // Add user message
      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        content: userText.trim() || (attachments?.length ? `[Attached ${attachments.length} file${attachments.length > 1 ? "s" : ""}]` : ""),
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      isLoadingRef.current = true;

      try {
        // Create thread lazily on first message (with race-condition guard)
        let currentThreadId = threadId;
        if (!currentThreadId) {
          if (threadCreationPromiseRef.current) {
            // Another sendMessage call is already creating a thread — wait for it
            currentThreadId = await threadCreationPromiseRef.current;
          } else {
            const promise = createThread(userText.trim() || "Image attachment");
            threadCreationPromiseRef.current = promise;
            try {
              currentThreadId = await promise;
              if (currentThreadId) setThreadId(currentThreadId);
            } finally {
              threadCreationPromiseRef.current = null;
            }
          }
        }

        // Save user message to DB (attachments metadata only, no base64)
        if (currentThreadId) {
          await saveMessage(currentThreadId, userMsg);
        }

        // Build API messages from chat history
        // For the current message, include image content blocks if attachments exist
        const apiMessages = [...messagesRef.current, userMsg].map((m) => {
          // If this message has attachments with base64 data, send as multi-block content
          if (m.attachments && m.attachments.some(a => a.data)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const contentBlocks: any[] = [];
            for (const att of m.attachments) {
              if (att.data) {
                if (att.mediaType === "application/pdf") {
                  contentBlocks.push({
                    type: "document",
                    source: {
                      type: "base64",
                      media_type: att.mediaType,
                      data: att.data,
                    },
                  });
                } else {
                  contentBlocks.push({
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: att.mediaType,
                      data: att.data,
                    },
                  });
                }
              }
            }
            if (m.content && m.content !== `[Attached ${m.attachments.length} file${m.attachments.length > 1 ? "s" : ""}]`) {
              contentBlocks.push({ type: "text", text: m.content });
            } else if (contentBlocks.length > 0) {
              contentBlocks.push({ type: "text", text: "Please analyze this image and provide any relevant coaching insights." });
            }
            return { role: m.role, content: contentBlocks };
          }
          return { role: m.role, content: m.content };
        });

        // Read live session data from the ref-based context at send time
        const activeAtSend = getActiveSession();

        // Build system prompt with full program + session context
        const systemPrompt = buildSystemPrompt({
          session: activeAtSend?.session || undefined,
          blocks: activeAtSend?.blocks,
          activities,
          squads,
          program: program || undefined,
          phases,
          allSessions,
          knowledge,
          isAdmin,
        });

        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, systemPrompt, isAdmin }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `API error: ${response.status}`);
        }

        const data = await response.json();

        // Parse Claude's response — may contain text and/or tool_use blocks
        let textContent = "";
        const toolCalls: ToolCallAction[] = [];

        if (data.content) {
          for (const block of data.content) {
            if (block.type === "text") {
              textContent += block.text;
            } else if (block.type === "tool_use") {
              const validationError = block.name.startsWith("admin_")
                ? validateAdminToolCall(block.name, block.input)
                : validateToolCall(block.name, block.input);
              toolCalls.push({
                id: block.id,
                toolName: block.name,
                input: block.input,
                description: describeAction(block.name, block.input),
                error: validationError || undefined,
              });
            }
          }
        }

        // H2 fix: Auto-execute informational tools and get follow-up response
        const INFORMATIONAL_TOOLS = new Set([
          "recall", "search_activities", "get_session_summary", "analyze_session",
          "list_sessions", "list_coaches", "get_session_roster",
        ]);

        if (data.stop_reason === "tool_use" && toolCalls.length > 0) {
          const allInformational = toolCalls.every(tc => INFORMATIONAL_TOOLS.has(tc.toolName) && !tc.error);

          if (allInformational) {
            // Execute all informational tools
            const toolResults = [];
            for (const tc of toolCalls) {
              const result = await executeAction(tc);
              toolResults.push({
                type: "tool_result" as const,
                tool_use_id: tc.id,
                content: typeof result === "string" ? result : "Action completed successfully.",
              });
            }

            // Build follow-up messages with tool results
            const followUpApiMessages = [
              ...apiMessages,
              { role: "assistant" as const, content: data.content },
              ...toolResults.map(tr => ({ role: "user" as const, content: [tr] })),
            ];

            try {
              const followUpResponse = await fetch("/api/assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: followUpApiMessages, systemPrompt, isAdmin }),
              });

              if (followUpResponse.ok) {
                const followUpData = await followUpResponse.json();
                // Replace text content with follow-up response
                textContent = "";
                toolCalls.length = 0; // Clear informational tool calls

                if (followUpData.content) {
                  for (const block of followUpData.content) {
                    if (block.type === "text") {
                      textContent += block.text;
                    } else if (block.type === "tool_use") {
                      const validationError = block.name.startsWith("admin_")
                ? validateAdminToolCall(block.name, block.input)
                : validateToolCall(block.name, block.input);
                      toolCalls.push({
                        id: block.id,
                        toolName: block.name,
                        input: block.input,
                        description: describeAction(block.name, block.input),
                        error: validationError || undefined,
                      });
                    }
                  }
                }
              }
            } catch {
              // If follow-up fails, show original informational tool results as text
              textContent = toolCalls.map(tc => `${tc.toolName}: ${tc.description}`).join("\n");
              toolCalls.length = 0;
            }
          }
        }

        // Add assistant message
        const assistantMsg: ChatMessage = {
          id: genId(),
          role: "assistant",
          content: textContent || (toolCalls.length > 0 ? "Here's what I'd suggest:" : "I'm not sure how to help with that."),
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          actionsApplied: false,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Save assistant message to DB
        if (currentThreadId) {
          await saveMessage(currentThreadId, assistantMsg);
          // Update thread timestamp + refresh thread list
          await supabaseRef.current
            .from("sp_assistant_threads")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", currentThreadId);
          loadThreads();
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Something went wrong";
        setError(errorMsg);
        // Add error as assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: genId(),
            role: "assistant",
            content: `Sorry, I encountered an error: ${errorMsg}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getActiveSession, activities, squads, threadId, createThread, saveMessage, loadThreads, knowledge, program, phases, allSessions, isAdmin]
  );

  const clearChat = useCallback(() => {
    startNewChat();
  }, [startNewChat]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    applyActions,
    clearChat,
    // Thread management
    threads,
    threadId,
    switchThread,
    startNewChat,
  };
}
