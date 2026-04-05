"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Session, SessionBlock, Activity, Squad, Program, Phase, BlockCategory, Tier } from "@/lib/types";
import { CATEGORY_COLOURS } from "@/lib/constants";
import { buildSystemPrompt } from "@/lib/assistant-context";
import { validateToolCall } from "@/lib/assistant-tools";
import { createClient } from "@/lib/supabase/client";

/** Shift a YYYY-MM-DD date string by N days */
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Chat message in the assistant conversation
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
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

interface UseAssistantProps {
  session?: Session | null;
  blocks?: SessionBlock[];
  activities: Activity[];
  squads: Squad[];
  sessionId?: string;
  program?: Program | null;
  phases?: Phase[];
  allSessions?: Session[];
  onAddBlock?: (block: Omit<SessionBlock, "id" | "created_at" | "updated_at">) => SessionBlock;
  onUpdateBlock?: (id: string, updates: Partial<SessionBlock>) => void;
  onDeleteBlock?: (id: string) => void;
  onMoveBlock?: (id: string, laneStart: number, laneEnd: number, timeStart: string, timeEnd: string) => void;
  hasCollision?: (position: { laneStart: number; laneEnd: number; timeStart: string; timeEnd: string }, excludeId?: string) => boolean;
  copyHour?: (allBlocks: SessionBlock[], sourceStart: string, sourceEnd: string, targetStart: string) => Omit<SessionBlock, "id" | "created_at" | "updated_at">[];
  onUpdateSession?: (updates: Partial<Session>) => Promise<void>;
  onSessionUpdated?: () => void;
}

export function useAssistant({
  session,
  blocks,
  activities,
  squads,
  sessionId,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlock,
  hasCollision,
  copyHour,
  onUpdateSession,
  onSessionUpdated,
  program,
  phases = [],
  allSessions = [],
}: UseAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageIdCounter = useRef(0);
  const [knowledge, setKnowledge] = useState<{ category: string; title: string; content: string }[]>([]);

  // Load coaching knowledge base on mount
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("sp_coaching_knowledge")
      .select("category, title, content")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setKnowledge(data);
      });
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
      default:
        return `${toolName}`;
    }
  };

  /**
   * Execute a single tool call action against the session grid
   */
  const executeAction = useCallback(
    async (action: ToolCallAction): Promise<string | null> => {
      const { toolName, input } = action;

      // Validate first
      const validationError = validateToolCall(toolName, input);
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
          const toDelete = (blocks || []).filter(
            (b) => b.time_start >= input.time_start && b.time_start < input.time_end
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
            const supabase = createClient();
            const days = input.days;

            // Shift program dates
            if (program) {
              const newStart = shiftDate(program.start_date, days);
              const newEnd = shiftDate(program.end_date, days);
              await supabase.from("sp_programs").update({ start_date: newStart, end_date: newEnd }).eq("id", program.id);
            }

            // Shift all phase dates
            for (const phase of phases) {
              const newStart = shiftDate(phase.start_date, days);
              const newEnd = shiftDate(phase.end_date, days);
              await supabase.from("sp_phases").update({ start_date: newStart, end_date: newEnd }).eq("id", phase.id);
            }

            // Shift all session dates
            for (const sess of allSessions) {
              const newDate = shiftDate(sess.date, days);
              await supabase.from("sp_sessions").update({ date: newDate }).eq("id", sess.id);
            }

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

        default:
          return `Unknown action: ${toolName}`;
      }
    },
    [blocks, sessionId, activities, squads, program, phases, allSessions, onAddBlock, onUpdateBlock, onDeleteBlock, onMoveBlock, hasCollision, copyHour, onUpdateSession, onSessionUpdated]
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
    },
    [messages, executeAction]
  );

  /**
   * Send a message to the AI assistant
   */
  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isLoading) return;

      setError(null);

      // Add user message
      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        content: userText.trim(),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Build API messages from chat history
        const apiMessages = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Build system prompt with full program + session context
        const systemPrompt = buildSystemPrompt({
          session: session || undefined,
          blocks,
          activities,
          squads,
          program: program || undefined,
          phases,
          allSessions,
          knowledge,
        });

        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, systemPrompt }),
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
              const validationError = validateToolCall(block.name, block.input);
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
        setIsLoading(false);
      }
    },
    [messages, isLoading, session, blocks, activities, squads]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    applyActions,
    clearChat,
  };
}
