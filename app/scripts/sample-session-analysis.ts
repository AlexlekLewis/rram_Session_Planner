/**
 * Smoke-test script that runs analyzeSession against a realistic RRA fixture
 * and prints the payload the AI would see from the analyze_session tool.
 *
 * This is NOT a unit test — it's here so a human reviewer can visually
 * inspect the full shape of the tool result. Run with:
 *
 *   cd app && ./node_modules/.bin/sucrase-node scripts/sample-session-analysis.ts
 *
 * The fixture is deliberately "flawed" — it's batting-heavy, has a short
 * warm-up, and skips a cool-down — so the issues[] array has real flags to
 * show.
 */

import { analyzeSession, formatAnalysisForTool } from "../src/lib/session-analysis";
import type { SessionBlock, Session, Phase, Activity } from "../src/lib/types";

function b(overrides: Partial<SessionBlock>): SessionBlock {
  return {
    id: `b-${Math.random().toString(36).slice(2, 8)}`,
    session_id: "s-fri-1700",
    activity_id: undefined,
    name: "Unnamed",
    lane_start: 1,
    lane_end: 1,
    time_start: "17:00",
    time_end: "17:15",
    colour: "#3B82F6",
    category: "batting",
    tier: "P",
    other_location: undefined,
    coaching_notes: undefined,
    coaching_points: [],
    player_groups: [],
    equipment: [],
    coach_assigned: undefined,
    sort_order: 0,
    created_at: "2026-04-11T00:00:00Z",
    updated_at: "2026-04-11T00:00:00Z",
    ...overrides,
  };
}

const session: Session = {
  id: "s-fri-1700",
  program_id: "p-excel-2026",
  phase_id: "ph-explore",
  venue_id: "v-cec",
  date: "2026-04-17",
  start_time: "17:00",
  end_time: "19:00",
  squad_ids: ["sq-1"],
  specialist_coaches: [],
  theme: "Batting intent — short-form focus",
  status: "draft",
  created_at: "2026-04-11T00:00:00Z",
  updated_at: "2026-04-11T00:00:00Z",
};

const phase: Pick<Phase, "name"> = { name: "Explore" };

// Intentionally flawed plan: short warm-up, all-batting, no cool-down, elite
// tier heavy for an Explore-phase session. This is exactly the shape the AI
// should push back on.
const blocks: SessionBlock[] = [
  b({
    id: "w",
    name: "Quick warm-up",
    category: "warmup",
    tier: "R",
    time_start: "17:00",
    time_end: "17:03", // short!
    lane_start: 8,
    lane_end: 8,
    other_location: "Back of nets",
  }),
  b({
    id: "b1",
    name: "360 Drill",
    category: "batting",
    tier: "E", // elite in Explore phase
    time_start: "17:05",
    time_end: "17:30",
    lane_start: 1,
    lane_end: 1,
    coach_assigned: "Alex Lewis",
  }),
  b({
    id: "b2",
    name: "Sweep vs spin",
    category: "batting",
    tier: "E",
    time_start: "17:30",
    time_end: "18:00",
    lane_start: 1,
    lane_end: 1,
  }),
  b({
    id: "b3",
    name: "Power hitting",
    category: "batting",
    tier: "E",
    time_start: "18:00",
    time_end: "18:30",
    lane_start: 1,
    lane_end: 1,
  }),
  b({
    id: "b4",
    name: "Power hitting II",
    category: "batting",
    tier: "E",
    time_start: "18:30",
    time_end: "19:00",
    lane_start: 1,
    lane_end: 1,
  }),
];

const activities: Activity[] = [];

const analysis = analyzeSession({ session, blocks, activities, phase });

console.log("\n========== HEADLINE ==========\n");
console.log(analysis.headline);

console.log("\n========== ISSUES (the anti-sycophancy payload) ==========\n");
for (const issue of analysis.issues) {
  const tag = issue.severity.toUpperCase().padEnd(8);
  console.log(`[${tag}] ${issue.code}: ${issue.message}`);
}

console.log("\n========== FULL TOOL RESULT (what Claude sees) ==========\n");
console.log(formatAnalysisForTool(analysis));
