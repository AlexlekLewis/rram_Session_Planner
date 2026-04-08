/**
 * Claude API Tool Definitions for the AI Coaching Assistant
 *
 * These tools map directly to the existing useSessionBlocks API.
 * The AI returns tool_use blocks, the frontend validates parameters,
 * then calls the SAME functions the manual UI uses.
 *
 * PATTERN: Claude tool-use (verified in Anthropic docs)
 * SOURCE: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
 */

export const ASSISTANT_TOOLS = [
  {
    name: "add_block",
    description:
      "Add an activity block to the session grid. Use this when the coach asks to place a drill, warm-up, water break, or any activity at a specific time and lane position. Always check for collisions first.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Display name for the block (e.g., '360 Drill', 'Water Break', 'Daily Vitamins')",
        },
        lane_start: {
          type: "number",
          description: "Starting lane (1-8). Lanes: 1=Machine 1, 2=Machine 2, 3=Machine 3, 4=Lane 4, 5=Lane 5, 6=Lane 6, 7=Lane 7, 8=Other Location",
          minimum: 1,
          maximum: 8,
        },
        lane_end: {
          type: "number",
          description: "Ending lane (1-8, must be >= lane_start). Use same as lane_start for single-lane blocks.",
          minimum: 1,
          maximum: 8,
        },
        time_start: {
          type: "string",
          description: "Start time in HH:MM 24-hour format (e.g., '17:00' for 5pm). Must align to 5-minute increments.",
        },
        time_end: {
          type: "string",
          description: "End time in HH:MM 24-hour format (e.g., '17:15'). Must be after time_start.",
        },
        category: {
          type: "string",
          description: "Activity category for colour coding",
          enum: [
            "batting", "batting_power", "pace_bowling", "spin_bowling",
            "wicketkeeping", "fielding", "fitness", "mental", "tactical",
            "warmup", "cooldown", "transition", "other",
          ],
        },
        tier: {
          type: "string",
          description: "R=Regression (simplified), P=Progression (added complexity), E=Elite (match pace), G=Gamify (competition mode)",
          enum: ["R", "P", "E", "G"],
        },
        coach_assigned: {
          type: "string",
          description: "Name of the coach running this block (e.g., 'Alex Lewis', 'Jarryd Rodgers')",
        },
        coaching_notes: {
          type: "string",
          description: "Coaching notes or focus points for this specific block",
        },
        other_location: {
          type: "string",
          description: "Only used when lane 8 (Other Location) is included. Describes where: 'Back of nets', 'Upstairs lecture room', 'Outside — running'",
        },
        activity_id: {
          type: "string",
          description: "UUID of an existing activity from the library. If provided, the block links to that activity's coaching data.",
        },
      },
      required: ["name", "lane_start", "lane_end", "time_start", "time_end", "category", "tier"],
    },
  },
  {
    name: "update_block",
    description: "Modify properties of an existing block on the grid. Use when the coach wants to change a block's name, tier, coach, notes, or other properties without moving it.",
    input_schema: {
      type: "object" as const,
      properties: {
        block_id: {
          type: "string",
          description: "The UUID of the block to update",
        },
        updates: {
          type: "object",
          description: "Properties to update. Only include fields that should change.",
          properties: {
            name: { type: "string" },
            category: { type: "string", enum: ["batting", "batting_power", "pace_bowling", "spin_bowling", "wicketkeeping", "fielding", "fitness", "mental", "tactical", "warmup", "cooldown", "transition", "other"] },
            tier: { type: "string", enum: ["R", "P", "E", "G"] },
            coach_assigned: { type: "string" },
            coaching_notes: { type: "string" },
            other_location: { type: "string" },
          },
        },
      },
      required: ["block_id", "updates"],
    },
  },
  {
    name: "move_block",
    description: "Move an existing block to a new position (new lanes and/or new time). The block keeps its size.",
    input_schema: {
      type: "object" as const,
      properties: {
        block_id: { type: "string", description: "UUID of the block to move" },
        lane_start: { type: "number", minimum: 1, maximum: 8 },
        lane_end: { type: "number", minimum: 1, maximum: 8 },
        time_start: { type: "string", description: "New start time HH:MM" },
        time_end: { type: "string", description: "New end time HH:MM" },
      },
      required: ["block_id", "lane_start", "lane_end", "time_start", "time_end"],
    },
  },
  {
    name: "delete_block",
    description: "Remove a block from the grid. Use when the coach asks to remove, clear, or delete a specific activity.",
    input_schema: {
      type: "object" as const,
      properties: {
        block_id: { type: "string", description: "UUID of the block to delete" },
      },
      required: ["block_id"],
    },
  },
  {
    name: "clear_time_range",
    description: "Delete ALL blocks within a time range. Use when the coach says 'clear everything after 6pm' or 'remove the second hour'.",
    input_schema: {
      type: "object" as const,
      properties: {
        time_start: { type: "string", description: "Start of range to clear (HH:MM)" },
        time_end: { type: "string", description: "End of range to clear (HH:MM)" },
      },
      required: ["time_start", "time_end"],
    },
  },
  {
    name: "copy_hour",
    description: "Copy all blocks from one time range to another. Essential for group rotations where Hour 1 activities repeat in Hour 2.",
    input_schema: {
      type: "object" as const,
      properties: {
        source_start: { type: "string", description: "Start of source range (HH:MM)" },
        source_end: { type: "string", description: "End of source range (HH:MM)" },
        target_start: { type: "string", description: "Start of target range (HH:MM)" },
      },
      required: ["source_start", "source_end", "target_start"],
    },
  },
  {
    name: "search_activities",
    description: "Search the activity library. Use when the coach asks 'what drills do we have for spin?' or 'find batting activities'. Returns matching activities the coach can choose from.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search term (matched against name, category, tags, description)" },
        category: { type: "string", description: "Filter by category", enum: ["batting", "batting_power", "pace_bowling", "spin_bowling", "wicketkeeping", "fielding", "fitness", "mental", "tactical", "warmup", "cooldown"] },
        tier: { type: "string", description: "Filter by tier availability", enum: ["R", "P", "E", "G"] },
      },
      required: [],
    },
  },
  {
    name: "get_session_summary",
    description: "Get a summary of the current session state. Use when the coach asks 'what have we got so far?' or 'show me the plan'.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "update_session",
    description: "Update session metadata — date, time, theme, status, squad assignments, specialist coaches. Use when the coach wants to change the session date, adjust times, update the theme, or change which squads are assigned.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "New date in YYYY-MM-DD format (e.g., '2026-04-21')" },
        start_time: { type: "string", description: "New start time HH:MM (e.g., '17:00')" },
        end_time: { type: "string", description: "New end time HH:MM (e.g., '19:00')" },
        theme: { type: "string", description: "Session theme/focus (e.g., 'Power Hitting Focus')" },
        status: { type: "string", description: "Session status", enum: ["draft", "published", "completed"] },
        notes: { type: "string", description: "Session notes" },
      },
      required: [],
    },
  },
  {
    name: "create_activity",
    description: "Create a new activity in the library with full R/P/E/G tier data. Use when the coach wants to design a new drill. Walk through each tier with the coach before creating.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Activity name" },
        category: { type: "string", enum: ["batting", "batting_power", "pace_bowling", "spin_bowling", "wicketkeeping", "fielding", "fitness", "mental", "tactical", "warmup", "cooldown"] },
        sub_category: { type: "string", description: "Skill focus area (e.g., 'Batting Zones', 'Footwork / Power')" },
        description: { type: "string", description: "Brief overview of the activity" },
        default_duration_mins: { type: "number", description: "Default duration in minutes" },
        default_lanes: { type: "number", description: "Default number of lanes needed" },
        regression: {
          type: "object",
          description: "Regression tier (simplified, underarm feeds, isolated skills)",
          properties: {
            description: { type: "string" },
            coaching_points: { type: "array", items: { type: "string" } },
            equipment: { type: "array", items: { type: "string" } },
          },
        },
        progression: {
          type: "object",
          description: "Progression tier (side-arm/machine, added complexity)",
          properties: {
            description: { type: "string" },
            coaching_points: { type: "array", items: { type: "string" } },
            equipment: { type: "array", items: { type: "string" } },
          },
        },
        elite: {
          type: "object",
          description: "Elite tier (match pace 120-140kph, kinetic chain, self-coaching)",
          properties: {
            description: { type: "string" },
            coaching_points: { type: "array", items: { type: "string" } },
            equipment: { type: "array", items: { type: "string" } },
          },
        },
        gamify: {
          type: "object",
          description: "Gamify tier (competition, points, consequences)",
          properties: {
            description: { type: "string" },
            scoring_rules: { type: "string" },
            consequence: { type: "string" },
          },
        },
      },
      required: ["name", "category", "description"],
    },
  },
  {
    name: "shift_program_dates",
    description: "Shift the entire program (all phases and sessions) by a number of days. Use when the coach says 'move everything forward/back by a week' or 'the program starts a week later'.",
    input_schema: {
      type: "object" as const,
      properties: {
        days: { type: "number", description: "Number of days to shift. Positive = forward, negative = backward. E.g., 7 = push everything one week later." },
      },
      required: ["days"],
    },
  },
  {
    name: "update_program",
    description: "Update program-level details — name, start date, end date, description.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string" },
        start_date: { type: "string", description: "YYYY-MM-DD" },
        end_date: { type: "string", description: "YYYY-MM-DD" },
        description: { type: "string" },
      },
      required: [],
    },
  },
  {
    name: "update_phase",
    description: "Update a program phase — name, dates, goals, description.",
    input_schema: {
      type: "object" as const,
      properties: {
        phase_name: { type: "string", description: "Current name of the phase to update (e.g., 'Explore', 'Establish', 'Excel')" },
        name: { type: "string", description: "New name (if renaming)" },
        start_date: { type: "string", description: "YYYY-MM-DD" },
        end_date: { type: "string", description: "YYYY-MM-DD" },
        goals: { type: "array", items: { type: "string" }, description: "Phase goals" },
        description: { type: "string" },
      },
      required: ["phase_name"],
    },
  },
  {
    name: "create_session",
    description: "Create a new training session on a specific date and time with squad assignments.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "Session date YYYY-MM-DD" },
        start_time: { type: "string", description: "Start time HH:MM" },
        end_time: { type: "string", description: "End time HH:MM" },
        squad_names: { type: "array", items: { type: "string" }, description: "Squad names (e.g., ['Squad 1', 'Squad F'])" },
        theme: { type: "string" },
      },
      required: ["date", "start_time", "end_time"],
    },
  },
  {
    name: "list_sessions",
    description: "List all sessions in the program with dates, times, squads, and status. Use when the coach asks 'show me the schedule' or 'what sessions do we have?'",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
  {
    name: "remember",
    description: "Store something in the coaching knowledge base for permanent memory. Use when the coach tells you something important to remember — their preferences, decisions about the program, notes about players, feedback on drills, or any coaching philosophy. This is your long-term memory.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          description: "Type of knowledge",
          enum: ["coaching_philosophy", "player_note", "drill_feedback", "session_template", "program_decision", "preference", "rule", "learning"],
        },
        title: { type: "string", description: "Short title (what this memory is about)" },
        content: { type: "string", description: "Full detail to remember" },
        tags: { type: "array", items: { type: "string" }, description: "Searchable tags" },
      },
      required: ["category", "title", "content"],
    },
  },
  {
    name: "recall",
    description: "Search the coaching knowledge base for previously stored memories. Use when you need to check what was decided before, what the coach's preferences are, or any notes about players or drills.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "What to search for" },
        category: { type: "string", description: "Filter by category", enum: ["coaching_philosophy", "player_note", "drill_feedback", "session_template", "program_decision", "preference", "rule", "learning"] },
      },
      required: [],
    },
  },
  {
    name: "forget",
    description: "Remove or deactivate a knowledge base entry. Use when the coach says something is no longer relevant or was wrong.",
    input_schema: {
      type: "object" as const,
      properties: {
        knowledge_id: { type: "string", description: "UUID of the knowledge entry to deactivate" },
      },
      required: ["knowledge_id"],
    },
  },
  // ============================================================================
  // Coach Management Tools
  // ============================================================================
  {
    name: "list_coaches",
    description: "List all coaches in the current program with their roles, specialities, and availability. Use when the coach asks 'who are my coaches', 'show the coaching team', or 'who's available'.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: {
          type: "string",
          description: "Optional date (YYYY-MM-DD) to check availability for. If not provided, shows coaches without availability info.",
        },
      },
      required: [],
    },
  },
  {
    name: "set_coach_availability",
    description: "Set a coach's availability for a specific session. Sessions are identified by date and optionally time range. Use when someone says 'I'm available Tuesday 5-7pm', 'Mark Sarah as unavailable for the 7pm session', or 'I can do the early session but not the late one'.",
    input_schema: {
      type: "object" as const,
      properties: {
        coach_name: {
          type: "string",
          description: "Display name of the coach (e.g., 'Sarah Mitchell', 'Alex Lewis'). Use 'me' or the current user's name for self.",
        },
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format",
        },
        start_time: {
          type: "string",
          description: "Optional session start time in HH:MM format (e.g., '17:00') to target a specific session when multiple exist on the same date. If omitted, sets for all sessions on that date.",
        },
        status: {
          type: "string",
          description: "Availability status",
          enum: ["available", "unavailable", "tentative"],
        },
        notes: {
          type: "string",
          description: "Optional notes (e.g., 'arriving late', 'can only do first hour')",
        },
      },
      required: ["coach_name", "date", "status"],
    },
  },
  {
    name: "roster_coach",
    description: "Add a coach to a session's roster. Use when someone says 'add Jarryd to Tuesday's session', 'roster Matt for the 15th', or 'I'll be at the session'.",
    input_schema: {
      type: "object" as const,
      properties: {
        coach_name: {
          type: "string",
          description: "Display name of the coach to roster",
        },
        session_date: {
          type: "string",
          description: "Date of the session (YYYY-MM-DD). If multiple sessions on the same date, uses the first one.",
        },
        session_id: {
          type: "string",
          description: "Optional specific session UUID. Use this instead of session_date when you know the exact session.",
        },
        role: {
          type: "string",
          description: "Coach's role for this session",
          enum: ["head_coach", "assistant_coach", "guest_coach"],
        },
      },
      required: ["coach_name"],
    },
  },
  {
    name: "unroster_coach",
    description: "Remove a coach from a session's roster. Use when someone says 'remove Sarah from Tuesday's session' or 'I can't make it to the session'.",
    input_schema: {
      type: "object" as const,
      properties: {
        coach_name: {
          type: "string",
          description: "Display name of the coach to remove",
        },
        session_date: {
          type: "string",
          description: "Date of the session (YYYY-MM-DD)",
        },
        session_id: {
          type: "string",
          description: "Optional specific session UUID",
        },
      },
      required: ["coach_name"],
    },
  },
  {
    name: "update_coach_profile",
    description: "Update a coach's profile information. Use when someone says 'change Sarah's speciality to batting', 'update my phone number', or 'set Matt's display name'.",
    input_schema: {
      type: "object" as const,
      properties: {
        coach_name: {
          type: "string",
          description: "Current display name of the coach to update",
        },
        display_name: {
          type: "string",
          description: "New display name",
        },
        phone: {
          type: "string",
          description: "Phone number",
        },
        speciality: {
          type: "string",
          description: "Coaching speciality (e.g., 'Batting', 'Pace Bowling', 'Fielding & Wicketkeeping')",
        },
      },
      required: ["coach_name"],
    },
  },
  {
    name: "get_session_roster",
    description: "Get the list of coaches rostered to a specific session, with their availability status. Use when someone asks 'who's coaching on Tuesday' or 'which coaches are on for the next session'.",
    input_schema: {
      type: "object" as const,
      properties: {
        session_date: {
          type: "string",
          description: "Date of the session (YYYY-MM-DD)",
        },
        session_id: {
          type: "string",
          description: "Optional specific session UUID",
        },
      },
      required: [],
    },
  },
];

/**
 * Validate tool call parameters before execution.
 * Returns null if valid, error message string if invalid.
 */
export function validateToolCall(
  toolName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>
): string | null {
  // Time format validation
  const timeRegex = /^\d{2}:\d{2}$/;

  if (toolName === "add_block") {
    if (!timeRegex.test(input.time_start)) return `Invalid time_start: ${input.time_start}. Must be HH:MM format.`;
    if (!timeRegex.test(input.time_end)) return `Invalid time_end: ${input.time_end}. Must be HH:MM format.`;
    const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    if (toMins(input.time_end) <= toMins(input.time_start)) return `time_end (${input.time_end}) must be after time_start (${input.time_start})`;
    if (input.lane_start < 1 || input.lane_start > 8) return `lane_start must be 1-8, got ${input.lane_start}`;
    if (input.lane_end < input.lane_start || input.lane_end > 8) return `lane_end must be >= lane_start and <= 8, got ${input.lane_end}`;

    // Check 5-minute alignment
    const [, sm] = input.time_start.split(":").map(Number);
    const [, em] = input.time_end.split(":").map(Number);
    if (sm % 5 !== 0) return `time_start minutes must be divisible by 5, got ${sm}`;
    if (em % 5 !== 0) return `time_end minutes must be divisible by 5, got ${em}`;
  }

  if (toolName === "move_block") {
    if (!input.block_id) return "block_id is required";
    if (!timeRegex.test(input.time_start)) return `Invalid time_start format`;
    if (!timeRegex.test(input.time_end)) return `Invalid time_end format`;
  }

  if (toolName === "delete_block") {
    if (!input.block_id) return "block_id is required";
  }

  if (toolName === "clear_time_range") {
    if (!timeRegex.test(input.time_start)) return `Invalid time_start format`;
    if (!timeRegex.test(input.time_end)) return `Invalid time_end format`;
  }

  return null; // Valid
}
