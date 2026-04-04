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
    if (input.time_end <= input.time_start) return `time_end (${input.time_end}) must be after time_start (${input.time_start})`;
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
