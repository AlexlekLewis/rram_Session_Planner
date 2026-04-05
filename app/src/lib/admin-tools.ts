/**
 * Claude API Tool Definitions for AI Admin Tools
 *
 * These tools provide diagnostic, correction, and bulk-operation
 * capabilities for program administrators. Write operations use
 * a confirmation/dry_run pattern to prevent accidental data changes.
 *
 * PATTERN: Claude tool-use (verified in Anthropic docs)
 * SOURCE: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolInput = Record<string, any>;

export const ADMIN_TOOLS = [
  // ─── Diagnostic (read-only) ──────────────────────────────────────────

  {
    name: "admin_query_sessions",
    description:
      "Find sessions by criteria. Use when the admin asks 'show me all sessions next week', 'which sessions have no blocks?', or 'find draft sessions for Squad 1'.",
    input_schema: {
      type: "object" as const,
      properties: {
        date_from: {
          type: "string",
          description: "Start of date range (YYYY-MM-DD). Omit for no lower bound.",
        },
        date_to: {
          type: "string",
          description: "End of date range (YYYY-MM-DD). Omit for no upper bound.",
        },
        venue: {
          type: "string",
          description: "Filter by venue name (partial match).",
        },
        has_blocks: {
          type: "boolean",
          description: "true = only sessions with blocks, false = only empty sessions.",
        },
        phase: {
          type: "string",
          description: "Filter by phase name (e.g., 'Explore', 'Establish', 'Excel').",
        },
        squad: {
          type: "string",
          description: "Filter by squad name (e.g., 'Squad 1', 'Squad F').",
        },
        status: {
          type: "string",
          description: "Filter by session status.",
          enum: ["draft", "published", "completed"],
        },
        limit: {
          type: "number",
          description: "Max results to return (default 50).",
        },
      },
      required: [],
    },
  },
  {
    name: "admin_query_players",
    description:
      "Find players by criteria. Use when the admin asks 'which players are missing bowling style?', 'show me all spinners', or 'find inactive players'.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Player name search (partial match, case-insensitive).",
        },
        role: {
          type: "string",
          description: "Filter by playing role.",
          enum: ["batter", "bowler", "all_rounder", "wicketkeeper"],
        },
        squad: {
          type: "string",
          description: "Filter by squad name.",
        },
        bowling_style: {
          type: "string",
          description: "Filter by bowling style (e.g., 'right_arm_fast', 'left_arm_spin').",
        },
        has_issues: {
          type: "string",
          description: "Find players with data quality issues.",
          enum: ["missing_role", "missing_batting_hand", "missing_bowling_style", "missing_squad", "inactive"],
        },
        is_active: {
          type: "boolean",
          description: "Filter by active status. Omit to include all.",
        },
        limit: {
          type: "number",
          description: "Max results to return (default 50).",
        },
      },
      required: [],
    },
  },
  {
    name: "admin_integrity_check",
    description:
      "Run data integrity checks across the database. Returns a report of any issues found. Use when the admin asks 'are there any data problems?' or 'run a health check'.",
    input_schema: {
      type: "object" as const,
      properties: {
        checks: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "orphaned_blocks",
              "missing_venues",
              "duplicate_players",
              "sessions_no_blocks",
              "blocks_outside_session_time",
              "overlapping_blocks",
              "all",
            ],
          },
          description: "Which checks to run. Defaults to 'all' if omitted.",
        },
      },
      required: [],
    },
  },
  {
    name: "admin_list_audit_log",
    description:
      "View recent admin actions for accountability. Use when the admin asks 'what changes were made today?' or 'show the audit trail'.",
    input_schema: {
      type: "object" as const,
      properties: {
        limit: {
          type: "number",
          description: "Number of entries to return (default 20, max 100).",
        },
        action_type: {
          type: "string",
          description: "Filter by action type (e.g., 'update_session', 'bulk_update', 'cleanup').",
        },
        date_from: {
          type: "string",
          description: "Start of date range (YYYY-MM-DD).",
        },
        date_to: {
          type: "string",
          description: "End of date range (YYYY-MM-DD).",
        },
      },
      required: [],
    },
  },

  // ─── Single-record corrections (require confirmation) ────────────────

  {
    name: "admin_update_session",
    description:
      "Update any session (not just the active one) by ID or by date+squad match. Use for corrections like changing a venue, fixing a date, or updating notes. Requires confirmation before applying.",
    input_schema: {
      type: "object" as const,
      properties: {
        session_id: {
          type: "string",
          description: "UUID of the session to update. Provide this OR date+squad to identify the session.",
        },
        match_date: {
          type: "string",
          description: "Date to match (YYYY-MM-DD). Used with match_squad when session_id is not known.",
        },
        match_squad: {
          type: "string",
          description: "Squad name to match. Used with match_date when session_id is not known.",
        },
        updates: {
          type: "object",
          description: "Fields to update. Only include fields that should change.",
          properties: {
            venue: { type: "string", description: "New venue name." },
            date: { type: "string", description: "New date (YYYY-MM-DD)." },
            start_time: { type: "string", description: "New start time (HH:MM)." },
            end_time: { type: "string", description: "New end time (HH:MM)." },
            theme: { type: "string", description: "Session theme/focus." },
            notes: { type: "string", description: "Session notes." },
            status: { type: "string", enum: ["draft", "published", "completed"] },
          },
        },
        confirmed: {
          type: "boolean",
          description: "Set to true to apply the change. First call without this to preview.",
        },
      },
      required: ["updates"],
    },
  },
  {
    name: "admin_update_player",
    description:
      "Fix player data by name or ID. Use when the admin says 'change Jake's bowling style' or 'mark player as inactive'. Requires confirmation before applying.",
    input_schema: {
      type: "object" as const,
      properties: {
        player_id: {
          type: "string",
          description: "UUID of the player. Provide this OR player_name.",
        },
        player_name: {
          type: "string",
          description: "Player name (partial match). Used when player_id is not known.",
        },
        updates: {
          type: "object",
          description: "Fields to update. Only include fields that should change.",
          properties: {
            role: { type: "string", enum: ["batter", "bowler", "all_rounder", "wicketkeeper"] },
            batting_hand: { type: "string", enum: ["left", "right"] },
            bowling_style: { type: "string", description: "e.g., 'right_arm_fast', 'left_arm_spin', 'right_arm_medium'" },
            squad: { type: "string", description: "Squad name to assign." },
            is_active: { type: "boolean" },
            notes: { type: "string" },
          },
        },
        confirmed: {
          type: "boolean",
          description: "Set to true to apply the change. First call without this to preview.",
        },
      },
      required: ["updates"],
    },
  },
  {
    name: "admin_update_venue",
    description:
      "Modify a venue's details. Use when the admin says 'update the lane count at Casey Fields' or 'fix the venue address'. Requires confirmation before applying.",
    input_schema: {
      type: "object" as const,
      properties: {
        venue_id: {
          type: "string",
          description: "UUID of the venue. Provide this OR venue_name.",
        },
        venue_name: {
          type: "string",
          description: "Venue name (partial match). Used when venue_id is not known.",
        },
        updates: {
          type: "object",
          description: "Fields to update. Only include fields that should change.",
          properties: {
            name: { type: "string", description: "New venue name." },
            lanes: { type: "number", description: "Number of lanes/nets available." },
            address: { type: "string", description: "Venue address." },
          },
        },
        confirmed: {
          type: "boolean",
          description: "Set to true to apply the change. First call without this to preview.",
        },
      },
      required: ["updates"],
    },
  },

  // ─── Bulk operations (dry_run pattern) ───────────────────────────────

  {
    name: "admin_bulk_update_sessions",
    description:
      "Update multiple sessions matching a filter. Runs in dry_run mode by default — shows what would change without applying. Use when the admin says 'change all draft sessions to published' or 'update venue for all sessions next week'.",
    input_schema: {
      type: "object" as const,
      properties: {
        filter: {
          type: "object",
          description: "Criteria to match sessions.",
          properties: {
            date_from: { type: "string", description: "YYYY-MM-DD" },
            date_to: { type: "string", description: "YYYY-MM-DD" },
            venue: { type: "string" },
            squad: { type: "string" },
            status: { type: "string", enum: ["draft", "published", "completed"] },
            phase: { type: "string" },
          },
        },
        updates: {
          type: "object",
          description: "Fields to set on all matching sessions.",
          properties: {
            venue: { type: "string" },
            theme: { type: "string" },
            status: { type: "string", enum: ["draft", "published", "completed"] },
            notes: { type: "string" },
          },
        },
        dry_run: {
          type: "boolean",
          description: "If true (default), only preview changes without applying. Set to false to execute.",
        },
      },
      required: ["filter", "updates"],
    },
  },
  {
    name: "admin_cleanup_orphans",
    description:
      "Find and optionally delete orphaned blocks — blocks whose parent session no longer exists, or blocks with invalid references. Dry run by default.",
    input_schema: {
      type: "object" as const,
      properties: {
        dry_run: {
          type: "boolean",
          description: "If true (default), only list orphans without deleting. Set to false to delete them.",
        },
        include_details: {
          type: "boolean",
          description: "If true, include full block data in the report (default false).",
        },
      },
      required: [],
    },
  },
  {
    name: "admin_shift_phase_sessions",
    description:
      "Move all sessions within a specific phase by N days. Dry run by default. Use when the admin says 'push Explore phase back by 3 days' or 'move all Establish sessions forward a week'.",
    input_schema: {
      type: "object" as const,
      properties: {
        phase_name: {
          type: "string",
          description: "Name of the phase whose sessions to shift (e.g., 'Explore', 'Establish', 'Excel').",
        },
        days: {
          type: "number",
          description: "Number of days to shift. Positive = forward, negative = backward.",
        },
        dry_run: {
          type: "boolean",
          description: "If true (default), only preview the shift without applying. Set to false to execute.",
        },
      },
      required: ["phase_name", "days"],
    },
  },
];

/**
 * Validate admin tool call parameters before execution.
 * Returns null if valid, error message string if invalid.
 */
export function validateAdminToolCall(
  toolName: string,
  input: ToolInput
): string | null {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^\d{2}:\d{2}$/;

  // ─── Diagnostic tools ────────────────────────────────────────────────

  if (toolName === "admin_query_sessions") {
    if (input.date_from && !dateRegex.test(input.date_from))
      return `Invalid date_from: ${input.date_from}. Must be YYYY-MM-DD.`;
    if (input.date_to && !dateRegex.test(input.date_to))
      return `Invalid date_to: ${input.date_to}. Must be YYYY-MM-DD.`;
    if (input.date_from && input.date_to && input.date_from > input.date_to)
      return `date_from (${input.date_from}) must be before date_to (${input.date_to}).`;
    if (input.limit !== undefined && (typeof input.limit !== "number" || input.limit < 1))
      return `limit must be a positive number, got ${input.limit}.`;
  }

  if (toolName === "admin_query_players") {
    if (input.limit !== undefined && (typeof input.limit !== "number" || input.limit < 1))
      return `limit must be a positive number, got ${input.limit}.`;
  }

  if (toolName === "admin_list_audit_log") {
    if (input.date_from && !dateRegex.test(input.date_from))
      return `Invalid date_from: ${input.date_from}. Must be YYYY-MM-DD.`;
    if (input.date_to && !dateRegex.test(input.date_to))
      return `Invalid date_to: ${input.date_to}. Must be YYYY-MM-DD.`;
    if (input.limit !== undefined && (typeof input.limit !== "number" || input.limit < 1 || input.limit > 100))
      return `limit must be 1-100, got ${input.limit}.`;
  }

  // ─── Single-record corrections ───────────────────────────────────────

  if (toolName === "admin_update_session") {
    if (!input.session_id && !input.match_date && !input.match_squad)
      return "Provide session_id OR match_date+match_squad to identify the session.";
    if (!input.updates || typeof input.updates !== "object" || Object.keys(input.updates).length === 0)
      return "updates object is required and must contain at least one field.";
    if (input.updates.date && !dateRegex.test(input.updates.date))
      return `Invalid updates.date: ${input.updates.date}. Must be YYYY-MM-DD.`;
    if (input.updates.start_time && !timeRegex.test(input.updates.start_time))
      return `Invalid updates.start_time: ${input.updates.start_time}. Must be HH:MM.`;
    if (input.updates.end_time && !timeRegex.test(input.updates.end_time))
      return `Invalid updates.end_time: ${input.updates.end_time}. Must be HH:MM.`;
    if (input.match_date && !dateRegex.test(input.match_date))
      return `Invalid match_date: ${input.match_date}. Must be YYYY-MM-DD.`;
  }

  if (toolName === "admin_update_player") {
    if (!input.player_id && !input.player_name)
      return "Provide player_id OR player_name to identify the player.";
    if (!input.updates || typeof input.updates !== "object" || Object.keys(input.updates).length === 0)
      return "updates object is required and must contain at least one field.";
  }

  if (toolName === "admin_update_venue") {
    if (!input.venue_id && !input.venue_name)
      return "Provide venue_id OR venue_name to identify the venue.";
    if (!input.updates || typeof input.updates !== "object" || Object.keys(input.updates).length === 0)
      return "updates object is required and must contain at least one field.";
    if (input.updates.lanes !== undefined && (typeof input.updates.lanes !== "number" || input.updates.lanes < 1))
      return `lanes must be a positive number, got ${input.updates.lanes}.`;
  }

  // ─── Bulk operations ─────────────────────────────────────────────────

  if (toolName === "admin_bulk_update_sessions") {
    if (!input.filter || typeof input.filter !== "object")
      return "filter object is required.";
    if (!input.updates || typeof input.updates !== "object" || Object.keys(input.updates).length === 0)
      return "updates object is required and must contain at least one field.";
    if (input.filter.date_from && !dateRegex.test(input.filter.date_from))
      return `Invalid filter.date_from: ${input.filter.date_from}. Must be YYYY-MM-DD.`;
    if (input.filter.date_to && !dateRegex.test(input.filter.date_to))
      return `Invalid filter.date_to: ${input.filter.date_to}. Must be YYYY-MM-DD.`;
  }

  if (toolName === "admin_shift_phase_sessions") {
    if (!input.phase_name || typeof input.phase_name !== "string")
      return "phase_name is required.";
    if (input.days === undefined || typeof input.days !== "number")
      return "days is required and must be a number.";
    if (input.days === 0)
      return "days cannot be 0 — nothing to shift.";
  }

  return null; // Valid
}

/**
 * Return a human-readable description of an admin tool action.
 * Used in preview cards before confirmation.
 */
export function describeAdminAction(
  toolName: string,
  input: ToolInput
): string {
  switch (toolName) {
    // ─── Diagnostic ──────────────────────────────────────────────────────

    case "admin_query_sessions": {
      const parts: string[] = ["Search sessions"];
      if (input.date_from || input.date_to)
        parts.push(`${input.date_from || "start"} to ${input.date_to || "end"}`);
      if (input.venue) parts.push(`at ${input.venue}`);
      if (input.squad) parts.push(`for ${input.squad}`);
      if (input.phase) parts.push(`in ${input.phase} phase`);
      if (input.status) parts.push(`(${input.status})`);
      if (input.has_blocks === true) parts.push("with blocks");
      if (input.has_blocks === false) parts.push("with no blocks");
      return parts.join(" ");
    }

    case "admin_query_players": {
      const parts: string[] = ["Search players"];
      if (input.name) parts.push(`matching "${input.name}"`);
      if (input.role) parts.push(`role: ${input.role}`);
      if (input.squad) parts.push(`in ${input.squad}`);
      if (input.has_issues) parts.push(`with issue: ${input.has_issues}`);
      if (input.is_active === false) parts.push("(inactive only)");
      return parts.join(" ");
    }

    case "admin_integrity_check": {
      const checks = input.checks?.length ? input.checks.join(", ") : "all";
      return `Run integrity checks: ${checks}`;
    }

    case "admin_list_audit_log": {
      const limit = input.limit || 20;
      const parts = [`Show last ${limit} audit log entries`];
      if (input.action_type) parts.push(`for ${input.action_type}`);
      if (input.date_from) parts.push(`from ${input.date_from}`);
      return parts.join(" ");
    }

    // ─── Single-record corrections ─────────────────────────────────────

    case "admin_update_session": {
      const target = input.session_id
        ? `session ${input.session_id.slice(0, 8)}...`
        : `session on ${input.match_date || "?"} for ${input.match_squad || "?"}`;
      const fields = input.updates ? Object.keys(input.updates).join(", ") : "nothing";
      const confirmed = input.confirmed ? " [APPLYING]" : " [PREVIEW]";
      return `Update ${target} — changing: ${fields}${confirmed}`;
    }

    case "admin_update_player": {
      const target = input.player_id
        ? `player ${input.player_id.slice(0, 8)}...`
        : `player "${input.player_name || "?"}"`;
      const fields = input.updates ? Object.keys(input.updates).join(", ") : "nothing";
      const confirmed = input.confirmed ? " [APPLYING]" : " [PREVIEW]";
      return `Update ${target} — changing: ${fields}${confirmed}`;
    }

    case "admin_update_venue": {
      const target = input.venue_id
        ? `venue ${input.venue_id.slice(0, 8)}...`
        : `venue "${input.venue_name || "?"}"`;
      const fields = input.updates ? Object.keys(input.updates).join(", ") : "nothing";
      const confirmed = input.confirmed ? " [APPLYING]" : " [PREVIEW]";
      return `Update ${target} — changing: ${fields}${confirmed}`;
    }

    // ─── Bulk operations ───────────────────────────────────────────────

    case "admin_bulk_update_sessions": {
      const filterParts: string[] = [];
      if (input.filter?.date_from || input.filter?.date_to)
        filterParts.push(`${input.filter.date_from || "start"}-${input.filter.date_to || "end"}`);
      if (input.filter?.squad) filterParts.push(input.filter.squad);
      if (input.filter?.status) filterParts.push(input.filter.status);
      if (input.filter?.phase) filterParts.push(input.filter.phase);
      const fields = input.updates ? Object.keys(input.updates).join(", ") : "nothing";
      const mode = input.dry_run === false ? "[EXECUTING]" : "[DRY RUN]";
      return `Bulk update sessions (${filterParts.join(", ") || "all"}) — setting: ${fields} ${mode}`;
    }

    case "admin_cleanup_orphans": {
      const mode = input.dry_run === false ? "[EXECUTING DELETE]" : "[DRY RUN]";
      return `Find orphaned blocks ${mode}`;
    }

    case "admin_shift_phase_sessions": {
      const direction = input.days > 0 ? "forward" : "back";
      const absDays = Math.abs(input.days);
      const mode = input.dry_run === false ? "[EXECUTING]" : "[DRY RUN]";
      return `Shift all ${input.phase_name} sessions ${direction} by ${absDays} day${absDays !== 1 ? "s" : ""} ${mode}`;
    }

    default:
      return `Unknown admin action: ${toolName}`;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

/**
 * Execute an admin tool action against the database.
 * Returns null on success, or a string result/error message.
 * Diagnostic tools return data as formatted strings (informational).
 * Mutation tools return null on success.
 */
export async function executeAdminAction(
  toolName: string,
  input: ToolInput,
  supabase: SupabaseClient
): Promise<string | null> {
  switch (toolName) {
    // ─── Diagnostic ──────────────────────────────────────────────────────

    case "admin_query_sessions": {
      let query = supabase.from("sp_sessions").select("id, date, start_time, end_time, theme, status, squad_ids, venue_id, phase_id");
      if (input.date_from) query = query.gte("date", input.date_from);
      if (input.date_to) query = query.lte("date", input.date_to);
      if (input.status) query = query.eq("status", input.status);
      query = query.order("date").limit(input.limit || 50);

      const { data, error } = await query;
      if (error) return `Query failed: ${error.message}`;
      if (!data || data.length === 0) return "No sessions found matching the criteria.";

      // If has_blocks filter, we need to check blocks
      if (input.has_blocks !== undefined) {
        const sessionIds = data.map((s: { id: string }) => s.id);
        const { data: blocks } = await supabase
          .from("sp_session_blocks")
          .select("session_id")
          .in("session_id", sessionIds);
        const sessionsWithBlocks = new Set((blocks || []).map((b: { session_id: string }) => b.session_id));
        const filtered = input.has_blocks
          ? data.filter((s: { id: string }) => sessionsWithBlocks.has(s.id))
          : data.filter((s: { id: string }) => !sessionsWithBlocks.has(s.id));
        return `Found ${filtered.length} sessions:\n${filtered.map((s: { date: string; start_time: string; end_time: string; theme?: string; status: string; id: string }) =>
          `- ${s.date} ${s.start_time}-${s.end_time} | "${s.theme || "No theme"}" | ${s.status} | ID: ${s.id}`
        ).join("\n")}`;
      }

      return `Found ${data.length} sessions:\n${data.map((s: { date: string; start_time: string; end_time: string; theme?: string; status: string; id: string }) =>
        `- ${s.date} ${s.start_time}-${s.end_time} | "${s.theme || "No theme"}" | ${s.status} | ID: ${s.id}`
      ).join("\n")}`;
    }

    case "admin_query_players": {
      let query = supabase.from("sp_players").select("id, first_name, last_name, role, batting_hand, bowling_style, is_active, squad_ids, notes");
      if (input.role) query = query.eq("role", input.role);
      if (input.bowling_style) query = query.eq("bowling_style", input.bowling_style);
      if (input.is_active !== undefined) query = query.eq("is_active", input.is_active);
      query = query.order("last_name").limit(input.limit || 50);

      const { data, error } = await query;
      if (error) return `Query failed: ${error.message}`;
      if (!data || data.length === 0) return "No players found matching the criteria.";

      let results = data;

      // Name filter (client-side partial match)
      if (input.name) {
        const search = input.name.toLowerCase();
        results = results.filter((p: { first_name: string; last_name: string }) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(search)
        );
      }

      // Issue filter
      if (input.has_issues) {
        switch (input.has_issues) {
          case "missing_role":
            results = results.filter((p: { role?: string }) => !p.role);
            break;
          case "missing_batting_hand":
            results = results.filter((p: { batting_hand?: string }) => !p.batting_hand);
            break;
          case "missing_bowling_style":
            results = results.filter((p: { bowling_style?: string }) => !p.bowling_style);
            break;
          case "missing_squad":
            results = results.filter((p: { squad_ids?: string[] }) => !p.squad_ids || p.squad_ids.length === 0);
            break;
          case "inactive":
            results = results.filter((p: { is_active?: boolean }) => p.is_active === false);
            break;
        }
      }

      return `Found ${results.length} players:\n${results.map((p: { first_name: string; last_name: string; role?: string; batting_hand?: string; bowling_style?: string; is_active?: boolean; id: string }) =>
        `- ${p.first_name} ${p.last_name} | ${p.role || "no role"} | ${p.batting_hand || "?"}-hand | ${p.bowling_style || "no bowling"} | ${p.is_active !== false ? "active" : "INACTIVE"} | ID: ${p.id}`
      ).join("\n")}`;
    }

    case "admin_integrity_check": {
      const checks = input.checks?.includes("all") || !input.checks?.length
        ? ["orphaned_blocks", "sessions_no_blocks", "duplicate_players", "overlapping_blocks"]
        : input.checks;

      const issues: string[] = [];

      if (checks.includes("orphaned_blocks")) {
        const { data } = await supabase
          .from("sp_session_blocks")
          .select("id, session_id, name")
          .is("session_id", null);
        const orphanedNull = data || [];

        // Also check for blocks referencing deleted sessions
        const { data: allBlocks, error: allBlocksError } = await supabase.from("sp_session_blocks").select("id, session_id, name");
        if (allBlocksError) throw new Error(`Failed to fetch blocks: ${allBlocksError.message}`);
        const { data: allSessions, error: allSessionsError } = await supabase.from("sp_sessions").select("id");
        if (allSessionsError) throw new Error(`Failed to fetch sessions: ${allSessionsError.message}`);
        const sessionIds = new Set((allSessions || []).map((s: { id: string }) => s.id));
        const orphanedRef = (allBlocks || []).filter((b: { session_id: string | null }) =>
          b.session_id && !sessionIds.has(b.session_id)
        );

        const total = orphanedNull.length + orphanedRef.length;
        if (total > 0) issues.push(`ORPHANED BLOCKS: ${total} blocks with no valid session (${orphanedNull.length} null session_id, ${orphanedRef.length} reference deleted sessions)`);
      }

      if (checks.includes("sessions_no_blocks")) {
        const { data: sessions, error: sessionsError } = await supabase.from("sp_sessions").select("id, date, theme");
        if (sessionsError) throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
        const { data: blocks, error: blocksError } = await supabase.from("sp_session_blocks").select("session_id");
        if (blocksError) throw new Error(`Failed to fetch blocks: ${blocksError.message}`);
        const sessionsWithBlocks = new Set((blocks || []).map((b: { session_id: string }) => b.session_id));
        const empty = (sessions || []).filter((s: { id: string }) => !sessionsWithBlocks.has(s.id));
        if (empty.length > 0) issues.push(`EMPTY SESSIONS: ${empty.length} sessions have no blocks assigned`);
      }

      if (checks.includes("duplicate_players")) {
        const { data: players, error: playersError } = await supabase.from("sp_players").select("first_name, last_name");
        if (playersError) throw new Error(`Failed to fetch players: ${playersError.message}`);
        const names = (players || []).map((p: { first_name: string; last_name: string }) => `${p.first_name} ${p.last_name}`.toLowerCase());
        const counts: Record<string, number> = {};
        names.forEach((n: string) => { counts[n] = (counts[n] || 0) + 1; });
        const dupes = Object.entries(counts).filter(([, c]) => c > 1);
        if (dupes.length > 0) issues.push(`DUPLICATE PLAYERS: ${dupes.length} names appear more than once: ${dupes.map(([n, c]) => `"${n}" (${c}x)`).join(", ")}`);
      }

      if (checks.includes("overlapping_blocks")) {
        const { data: blocks, error: blocksErr } = await supabase.from("sp_session_blocks").select("id, session_id, lane_start, lane_end, time_start, time_end, name");
        if (blocksErr) throw new Error(`Failed to fetch blocks: ${blocksErr.message}`);
        const bySession: Record<string, typeof blocks> = {};
        (blocks || []).forEach((b: { session_id: string }) => {
          if (!bySession[b.session_id]) bySession[b.session_id] = [];
          bySession[b.session_id].push(b);
        });

        let overlapCount = 0;
        for (const sessionBlocks of Object.values(bySession)) {
          for (let i = 0; i < sessionBlocks.length; i++) {
            for (let j = i + 1; j < sessionBlocks.length; j++) {
              const a = sessionBlocks[i];
              const b = sessionBlocks[j];
              const lanesOverlap = a.lane_start <= b.lane_end && b.lane_start <= a.lane_end;
              const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
              const timesOverlap = toMins(a.time_start) < toMins(b.time_end) && toMins(b.time_start) < toMins(a.time_end);
              if (lanesOverlap && timesOverlap) overlapCount++;
            }
          }
        }
        if (overlapCount > 0) issues.push(`OVERLAPPING BLOCKS: ${overlapCount} block pairs overlap in time and lanes`);
      }

      if (issues.length === 0) return "All integrity checks passed. No issues found.";
      return `Found ${issues.length} issue(s):\n${issues.map(i => `- ${i}`).join("\n")}`;
    }

    case "admin_list_audit_log": {
      let query = supabase
        .from("sp_admin_audit_log")
        .select("id, tool_name, input, result, affected_records, created_at")
        .order("created_at", { ascending: false })
        .limit(Math.min(input.limit || 20, 100));

      if (input.action_type) query = query.ilike("tool_name", `%${input.action_type}%`);
      if (input.date_from) query = query.gte("created_at", input.date_from);
      if (input.date_to) query = query.lte("created_at", input.date_to + "T23:59:59Z");

      const { data, error } = await query;
      if (error) return `Query failed: ${error.message}`;
      if (!data || data.length === 0) return "No audit log entries found.";

      return `Last ${data.length} admin actions:\n${data.map((e: { tool_name: string; result?: string; affected_records?: number; created_at: string }) =>
        `- ${new Date(e.created_at).toLocaleString("en-AU")} | ${e.tool_name} | ${e.result || "success"} | ${e.affected_records || 0} records`
      ).join("\n")}`;
    }

    // ─── Single-record corrections ─────────────────────────────────────

    case "admin_update_session": {
      // Find the session
      let sessionId = input.session_id;
      if (!sessionId && input.match_date) {
        const { data } = await supabase
          .from("sp_sessions")
          .select("id, date, theme, status")
          .eq("date", input.match_date)
          .limit(5);
        if (!data || data.length === 0) return `No session found on ${input.match_date}`;
        if (data.length > 1) {
          return `Multiple sessions on ${input.match_date}. Please use session_id:\n${data.map((s: { id: string; theme?: string; status: string }) =>
            `- ID: ${s.id} | "${s.theme || "No theme"}" | ${s.status}`
          ).join("\n")}`;
        }
        sessionId = data[0].id;
      }
      if (!sessionId) return "Provide session_id or match_date to identify the session.";

      // Preview mode
      if (!input.confirmed) {
        const { data: current } = await supabase.from("sp_sessions").select("*").eq("id", sessionId).single();
        if (!current) return `Session ${sessionId} not found.`;
        const changes = Object.entries(input.updates || {}).map(([k, v]) => {
          const oldVal = current[k as keyof typeof current];
          return `  ${k}: "${oldVal}" → "${v}"`;
        }).join("\n");
        return `Preview changes to session ${current.date} "${current.theme || "No theme"}":\n${changes}\n\nCall again with confirmed: true to apply.`;
      }

      // Apply
      const updates: Record<string, unknown> = {};
      if (input.updates.date) updates.date = input.updates.date;
      if (input.updates.start_time) updates.start_time = input.updates.start_time;
      if (input.updates.end_time) updates.end_time = input.updates.end_time;
      if (input.updates.theme) updates.theme = input.updates.theme;
      if (input.updates.notes !== undefined) updates.notes = input.updates.notes;
      if (input.updates.status) updates.status = input.updates.status;

      const { error } = await supabase.from("sp_sessions").update(updates).eq("id", sessionId);
      if (error) return `Update failed: ${error.message}`;
      return null; // Success
    }

    case "admin_update_player": {
      // Find the player
      let playerId = input.player_id;
      if (!playerId && input.player_name) {
        const { data, error: playersErr } = await supabase.from("sp_players").select("id, first_name, last_name, role");
        if (playersErr) return `Failed to query players: ${playersErr.message}`;
        const search = input.player_name.toLowerCase();
        const matches = (data || []).filter((p: { first_name: string; last_name: string }) =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(search)
        );
        if (matches.length === 0) return `No player found matching "${input.player_name}"`;
        if (matches.length > 1) {
          return `Multiple players match "${input.player_name}". Please use player_id:\n${matches.slice(0, 10).map((p: { id: string; first_name: string; last_name: string; role?: string }) =>
            `- ID: ${p.id} | ${p.first_name} ${p.last_name} | ${p.role || "no role"}`
          ).join("\n")}`;
        }
        playerId = matches[0].id;
      }
      if (!playerId) return "Provide player_id or player_name to identify the player.";

      // Preview mode
      if (!input.confirmed) {
        const { data: current } = await supabase.from("sp_players").select("*").eq("id", playerId).single();
        if (!current) return `Player ${playerId} not found.`;
        const changes = Object.entries(input.updates || {}).map(([k, v]) => {
          const oldVal = current[k as keyof typeof current];
          return `  ${k}: "${oldVal}" → "${v}"`;
        }).join("\n");
        return `Preview changes to ${current.first_name} ${current.last_name}:\n${changes}\n\nCall again with confirmed: true to apply.`;
      }

      // Apply
      const updates: Record<string, unknown> = {};
      if (input.updates.role) updates.role = input.updates.role;
      if (input.updates.batting_hand) updates.batting_hand = input.updates.batting_hand;
      if (input.updates.bowling_style) updates.bowling_style = input.updates.bowling_style;
      if (input.updates.is_active !== undefined) updates.is_active = input.updates.is_active;
      if (input.updates.notes !== undefined) updates.notes = input.updates.notes;

      const { error } = await supabase.from("sp_players").update(updates).eq("id", playerId);
      if (error) return `Update failed: ${error.message}`;
      return null; // Success
    }

    case "admin_update_venue": {
      let venueId = input.venue_id;
      if (!venueId && input.venue_name) {
        const { data, error: venuesErr } = await supabase.from("sp_venues").select("id, name");
        if (venuesErr) return `Failed to query venues: ${venuesErr.message}`;
        const search = input.venue_name.toLowerCase();
        const matches = (data || []).filter((v: { name: string }) => v.name.toLowerCase().includes(search));
        if (matches.length === 0) return `No venue found matching "${input.venue_name}"`;
        if (matches.length > 1) {
          return `Multiple venues match. Please use venue_id:\n${matches.map((v: { id: string; name: string }) =>
            `- ID: ${v.id} | ${v.name}`
          ).join("\n")}`;
        }
        venueId = matches[0].id;
      }
      if (!venueId) return "Provide venue_id or venue_name to identify the venue.";

      if (!input.confirmed) {
        const { data: current } = await supabase.from("sp_venues").select("*").eq("id", venueId).single();
        if (!current) return `Venue ${venueId} not found.`;
        const changes = Object.entries(input.updates || {}).map(([k, v]) => {
          const oldVal = current[k as keyof typeof current];
          return `  ${k}: "${oldVal}" → "${v}"`;
        }).join("\n");
        return `Preview changes to "${current.name}":\n${changes}\n\nCall again with confirmed: true to apply.`;
      }

      const updates: Record<string, unknown> = {};
      if (input.updates.name) updates.name = input.updates.name;
      if (input.updates.lanes) updates.lanes = input.updates.lanes;
      if (input.updates.address) updates.address = input.updates.address;

      const { error } = await supabase.from("sp_venues").update(updates).eq("id", venueId);
      if (error) return `Update failed: ${error.message}`;
      return null;
    }

    // ─── Bulk operations ───────────────────────────────────────────────

    case "admin_bulk_update_sessions": {
      let query = supabase.from("sp_sessions").select("id, date, theme, status");
      if (input.filter?.date_from) query = query.gte("date", input.filter.date_from);
      if (input.filter?.date_to) query = query.lte("date", input.filter.date_to);
      if (input.filter?.status) query = query.eq("status", input.filter.status);

      const { data: matching, error: qErr } = await query;
      if (qErr) return `Query failed: ${qErr.message}`;
      if (!matching || matching.length === 0) return "No sessions match the filter criteria.";

      // Dry run — just show what would change
      if (input.dry_run !== false) {
        return `DRY RUN: Would update ${matching.length} sessions:\n${matching.slice(0, 15).map((s: { date: string; theme?: string; status: string }) =>
          `- ${s.date} | "${s.theme || "No theme"}" | ${s.status}`
        ).join("\n")}${matching.length > 15 ? `\n... and ${matching.length - 15} more` : ""}\n\nChanges: ${JSON.stringify(input.updates)}\nCall again with dry_run: false to apply.`;
      }

      // Execute
      const ids = matching.map((s: { id: string }) => s.id);
      const updates: Record<string, unknown> = {};
      if (input.updates.theme) updates.theme = input.updates.theme;
      if (input.updates.status) updates.status = input.updates.status;
      if (input.updates.notes !== undefined) updates.notes = input.updates.notes;

      const { error } = await supabase.from("sp_sessions").update(updates).in("id", ids);
      if (error) return `Bulk update failed: ${error.message}`;
      return null; // Success — onSessionUpdated will refresh
    }

    case "admin_cleanup_orphans": {
      // Find orphaned blocks
      const { data: allBlocks, error: allBlocksErr } = await supabase.from("sp_session_blocks").select("id, session_id, name, time_start, time_end");
      if (allBlocksErr) return `Failed to fetch blocks: ${allBlocksErr.message}`;
      const { data: allSessions, error: allSessionsErr } = await supabase.from("sp_sessions").select("id");
      if (allSessionsErr) return `Failed to fetch sessions: ${allSessionsErr.message}`;
      const sessionIds = new Set((allSessions || []).map((s: { id: string }) => s.id));
      const orphans = (allBlocks || []).filter((b: { session_id: string | null }) =>
        !b.session_id || !sessionIds.has(b.session_id)
      );

      if (orphans.length === 0) return "No orphaned blocks found. Database is clean.";

      // Dry run
      if (input.dry_run !== false) {
        return `DRY RUN: Found ${orphans.length} orphaned blocks:\n${orphans.slice(0, 20).map((b: { name: string; session_id: string | null; id: string }) =>
          `- "${b.name}" | session: ${b.session_id || "NULL"} | ID: ${b.id}`
        ).join("\n")}${orphans.length > 20 ? `\n... and ${orphans.length - 20} more` : ""}\n\nCall again with dry_run: false to delete them.`;
      }

      // Delete
      const orphanIds = orphans.map((b: { id: string }) => b.id);
      const { error } = await supabase.from("sp_session_blocks").delete().in("id", orphanIds);
      if (error) return `Cleanup failed: ${error.message}`;
      return null;
    }

    case "admin_shift_phase_sessions": {
      // Find the phase
      const { data: phases, error: phasesErr } = await supabase.from("sp_phases").select("id, name");
      if (phasesErr) return `Failed to fetch phases: ${phasesErr.message}`;
      const phase = (phases || []).find((p: { name: string }) =>
        p.name.toLowerCase() === input.phase_name.toLowerCase()
      );
      if (!phase) return `Phase "${input.phase_name}" not found. Available: ${(phases || []).map((p: { name: string }) => p.name).join(", ")}`;

      // Find sessions in that phase
      const { data: sessions } = await supabase
        .from("sp_sessions")
        .select("id, date, theme")
        .eq("phase_id", phase.id)
        .order("date");

      if (!sessions || sessions.length === 0) return `No sessions found in ${input.phase_name} phase.`;

      // Dry run
      if (input.dry_run !== false) {
        const preview = sessions.slice(0, 15).map((s: { date: string; theme?: string }) => {
          const d = new Date(s.date + "T00:00:00");
          d.setDate(d.getDate() + input.days);
          const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return `- ${s.date} → ${newDate} | "${s.theme || "No theme"}"`;
        }).join("\n");
        return `DRY RUN: Would shift ${sessions.length} ${input.phase_name} sessions by ${input.days} days:\n${preview}${sessions.length > 15 ? `\n... and ${sessions.length - 15} more` : ""}\n\nCall again with dry_run: false to apply.`;
      }

      // Execute — update each session date
      for (const s of sessions) {
        const d = new Date(s.date + "T00:00:00");
        d.setDate(d.getDate() + input.days);
        const newDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        await supabase.from("sp_sessions").update({ date: newDate }).eq("id", s.id);
      }

      // Also shift the phase dates
      const { data: phaseData, error: phaseDataErr } = await supabase.from("sp_phases").select("start_date, end_date").eq("id", phase.id).single();
      if (phaseDataErr) return `Failed to fetch phase dates: ${phaseDataErr.message}`;
      if (phaseData) {
        const newStart = new Date(phaseData.start_date + "T00:00:00");
        newStart.setDate(newStart.getDate() + input.days);
        const newEnd = new Date(phaseData.end_date + "T00:00:00");
        newEnd.setDate(newEnd.getDate() + input.days);
        await supabase.from("sp_phases").update({
          start_date: `${newStart.getFullYear()}-${String(newStart.getMonth() + 1).padStart(2, "0")}-${String(newStart.getDate()).padStart(2, "0")}`,
          end_date: `${newEnd.getFullYear()}-${String(newEnd.getMonth() + 1).padStart(2, "0")}-${String(newEnd.getDate()).padStart(2, "0")}`,
        }).eq("id", phase.id);
      }

      return null;
    }

    default:
      return `Unknown admin action: ${toolName}`;
  }
}
