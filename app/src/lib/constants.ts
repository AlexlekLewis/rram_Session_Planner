// ============================================================================
// RRA Session Planner — Constants
// ============================================================================

import { BlockCategory, LaneConfig } from "./types";

// ============================================================================
// Lane Configuration (CEC Bundoora)
// ============================================================================

export const LANES: LaneConfig[] = [
  { id: 1, label: "Machine 1", type: "bowling_machine", short: "M1" },
  { id: 2, label: "Machine 2", type: "bowling_machine", short: "M2" },
  { id: 3, label: "Machine 3", type: "bowling_machine", short: "M3" },
  { id: 4, label: "Lane 4", type: "long_lane", short: "L4" },
  { id: 5, label: "Lane 5", type: "long_lane", short: "L5" },
  { id: 6, label: "Lane 6", type: "long_lane", short: "L6" },
  { id: 7, label: "Lane 7", type: "long_lane", short: "L7" },
  { id: 8, label: "Other Location", type: "other", short: "OTH" },
];

export const TOTAL_LANES = 8;

// ============================================================================
// Time Configuration
// ============================================================================

export const TIME_INCREMENT_MINUTES = 5;
export const MAJOR_GRIDLINE_MINUTES = 15;
export const ROW_HEIGHT_PX = 32;
export const DEFAULT_SESSION_DURATION_HOURS = 2;

/** Generate time slots from start to end in 5-min increments */
export function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes < endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    currentMinutes += TIME_INCREMENT_MINUTES;
  }

  return slots;
}

/** Format 24h time to 12h display */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")}${period}`;
}

/** Format 24h time to compact 12h display (e.g. "5pm", "5:30pm") */
export function formatTimeShort(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  if (m === 0) return `${displayH}${period}`;
  return `${displayH}:${m.toString().padStart(2, "0")}${period}`;
}

/** Check if a time slot is on a major gridline (15-min) */
export function isMajorGridline(time: string): boolean {
  const [, m] = time.split(":").map(Number);
  return m % MAJOR_GRIDLINE_MINUTES === 0;
}

/** Get time slot index */
export function getTimeIndex(time: string, startTime: string): number {
  const [h, m] = time.split(":").map(Number);
  const [sh, sm] = startTime.split(":").map(Number);
  return ((h * 60 + m) - (sh * 60 + sm)) / TIME_INCREMENT_MINUTES;
}

/** Get number of rows a block spans */
export function getBlockRowSpan(timeStart: string, timeEnd: string): number {
  const [sh, sm] = timeStart.split(":").map(Number);
  const [eh, em] = timeEnd.split(":").map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / TIME_INCREMENT_MINUTES;
}

// ============================================================================
// Category Colours
// ============================================================================

export const CATEGORY_COLOURS: Record<BlockCategory, string> = {
  batting: "#3B82F6",
  batting_power: "#6366F1",
  pace_bowling: "#EF4444",
  spin_bowling: "#EC4899",
  wicketkeeping: "#06B6D4",
  fielding: "#22C55E",
  fitness: "#A855F7",
  mental: "#8B5CF6",
  tactical: "#F59E0B",
  warmup: "#14B8A6",
  cooldown: "#64748B",
  transition: "#9CA3AF",
  other: "#D4D4D8",
};

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  batting: "Batting",
  batting_power: "Batting (Power)",
  pace_bowling: "Pace Bowling",
  spin_bowling: "Spin Bowling",
  wicketkeeping: "Wicketkeeping",
  fielding: "Fielding",
  fitness: "Fitness / S&C",
  mental: "Mental Performance",
  tactical: "Tactical / Game Sim",
  warmup: "Warmup / Daily Vitamins",
  cooldown: "Cooldown / Recovery",
  transition: "Water / Transition",
  other: "Other",
};

export const ALL_CATEGORIES: BlockCategory[] = [
  "batting",
  "batting_power",
  "pace_bowling",
  "spin_bowling",
  "wicketkeeping",
  "fielding",
  "fitness",
  "mental",
  "tactical",
  "warmup",
  "cooldown",
  "transition",
  "other",
];

// ============================================================================
// Tier Configuration
// ============================================================================

export const TIER_LABELS = {
  R: "Regression",
  P: "Progression",
  E: "Elite",
  G: "Gamify",
} as const;

export const TIER_COLOURS = {
  R: "#22C55E",
  P: "#3B82F6",
  E: "#A855F7",
  G: "#F59E0B",
} as const;

// ============================================================================
// Squad Configuration
// ============================================================================

export const SQUAD_COLOURS = {
  "Squad F": "#E11F8F",
  "Squad 1": "#1226AA",
  "Squad 2": "#16A34A",
  "Squad 3": "#F97316",
} as const;

// ============================================================================
// Auto-Save
// ============================================================================

export const SAVE_DEBOUNCE_MS = 500;
export const UNDO_STACK_SIZE = 50;
