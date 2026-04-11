/**
 * Unit tests for session-analysis.ts
 *
 * Uses Node's built-in node:test so we don't add a test-runner dependency to
 * the project. Run with:
 *
 *   cd app && ./node_modules/.bin/sucrase-node --import node:test src/lib/session-analysis.test.ts
 *
 * Or via the wrapper script at app/scripts/test-session-analysis.sh.
 *
 * These tests cover the pure functions. They intentionally do NOT exercise
 * the React / Supabase layers — those are out of scope for unit tests.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeSession,
  blockDurationMins,
  detectIssues,
  formatAnalysisForTool,
  toMinutes,
} from "./session-analysis";
import type { SessionBlock, Session, Phase, Activity } from "./types";

// ============================================================================
// Fixtures
// ============================================================================

function makeBlock(overrides: Partial<SessionBlock> = {}): SessionBlock {
  return {
    id: overrides.id || `b-${Math.random().toString(36).slice(2, 8)}`,
    session_id: "s1",
    activity_id: undefined,
    name: "Test Block",
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
    created_by: undefined,
    created_at: "2026-04-11T00:00:00Z",
    updated_at: "2026-04-11T00:00:00Z",
    ...overrides,
  };
}

function makeSession(
  overrides: Partial<Session> = {}
): Pick<Session, "id" | "start_time" | "end_time"> & Session {
  return {
    id: "s1",
    program_id: "p1",
    phase_id: undefined,
    venue_id: undefined,
    date: "2026-04-15",
    start_time: "17:00",
    end_time: "19:00",
    squad_ids: [],
    specialist_coaches: [],
    theme: undefined,
    status: "draft",
    notes: undefined,
    created_at: "2026-04-11T00:00:00Z",
    updated_at: "2026-04-11T00:00:00Z",
    ...overrides,
  };
}

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: overrides.id || `a-${Math.random().toString(36).slice(2, 8)}`,
    name: "Test Activity",
    category: "batting",
    sub_category: undefined,
    description: undefined,
    regression: {},
    progression: {},
    elite: {},
    gamify: {},
    default_duration_mins: 15,
    default_lanes: 1,
    equipment: [],
    tags: [],
    youtube_reference: undefined,
    constraints_cla: undefined,
    coaching_framework: {},
    max_balls_per_batter: undefined,
    between_sets_activity: undefined,
    created_by: undefined,
    is_global: true,
    created_at: "2026-04-11T00:00:00Z",
    updated_at: "2026-04-11T00:00:00Z",
    ...overrides,
  };
}

// ============================================================================
// toMinutes
// ============================================================================

test("toMinutes parses HH:MM", () => {
  assert.equal(toMinutes("17:00"), 17 * 60);
  assert.equal(toMinutes("17:30"), 17 * 60 + 30);
  assert.equal(toMinutes("00:00"), 0);
  assert.equal(toMinutes("23:45"), 23 * 60 + 45);
});

test("toMinutes is safe on bad input", () => {
  assert.equal(toMinutes(undefined), 0);
  assert.equal(toMinutes(null), 0);
  assert.equal(toMinutes(""), 0);
  assert.equal(toMinutes("not a time"), 0);
  assert.equal(toMinutes("17"), 0);
  assert.equal(toMinutes("17:aa"), 0);
});

test("blockDurationMins clamps negative / equal durations to 0", () => {
  assert.equal(blockDurationMins({ time_start: "17:00", time_end: "17:15" }), 15);
  assert.equal(blockDurationMins({ time_start: "17:15", time_end: "17:00" }), 0);
  assert.equal(blockDurationMins({ time_start: "17:00", time_end: "17:00" }), 0);
});

// ============================================================================
// analyzeSession — empty grid
// ============================================================================

test("empty grid returns EMPTY_SESSION critical issue and full dead time", () => {
  const a = analyzeSession({ session: makeSession(), blocks: [] });
  assert.equal(a.blockCount, 0);
  assert.equal(a.blockMinutes, 0);
  assert.equal(a.sessionDurationMins, 120);
  assert.equal(a.deadTimeMins, 120);
  assert.equal(a.issues.length, 1);
  assert.equal(a.issues[0].code, "EMPTY_SESSION");
  assert.equal(a.issues[0].severity, "critical");
  assert.match(a.headline, /empty/i);
});

test("safe on missing session", () => {
  const a = analyzeSession({ session: null, blocks: [] });
  assert.equal(a.sessionDurationMins, 0);
  assert.equal(a.blockCount, 0);
});

// ============================================================================
// analyzeSession — well-balanced session (should have NO critical issues)
// ============================================================================

test("balanced session with warm-up, cool-down, and variety has no critical issues", () => {
  const blocks = [
    makeBlock({ id: "w", category: "warmup", time_start: "17:00", time_end: "17:15" }),
    makeBlock({ id: "b1", category: "batting", time_start: "17:15", time_end: "17:45", lane_start: 1, lane_end: 3 }),
    makeBlock({ id: "bo", category: "pace_bowling", time_start: "17:15", time_end: "17:45", lane_start: 4, lane_end: 5 }),
    makeBlock({ id: "f", category: "fielding", time_start: "17:45", time_end: "18:15", lane_start: 1, lane_end: 7 }),
    makeBlock({ id: "b2", category: "batting_power", time_start: "18:15", time_end: "18:45", lane_start: 1, lane_end: 3 }),
    makeBlock({ id: "c", category: "cooldown", time_start: "18:45", time_end: "19:00" }),
  ];
  const a = analyzeSession({ session: makeSession(), blocks });

  // Presence checks
  assert.equal(a.warmup.present, true);
  assert.equal(a.warmup.minutes, 15);
  assert.equal(a.cooldown.present, true);
  assert.equal(a.cooldown.minutes, 15);

  // No critical issues
  const critical = a.issues.filter((i) => i.severity === "critical");
  assert.deepEqual(critical, []);
});

// ============================================================================
// analyzeSession — missing warm-up / cool-down flags
// ============================================================================

test("missing warm-up produces a critical NO_WARMUP issue", () => {
  const blocks = [
    makeBlock({ id: "b1", category: "batting", time_start: "17:00", time_end: "17:30" }),
    makeBlock({ id: "b2", category: "batting", time_start: "17:30", time_end: "18:00" }),
    makeBlock({ id: "c", category: "cooldown", time_start: "18:00", time_end: "18:15" }),
  ];
  const a = analyzeSession({ session: makeSession(), blocks });

  const critical = a.issues.filter((i) => i.severity === "critical");
  assert.ok(
    critical.some((i) => i.code === "NO_WARMUP"),
    `expected NO_WARMUP in critical issues, got ${JSON.stringify(a.issues)}`
  );
});

test("missing cool-down produces a warning NO_COOLDOWN issue", () => {
  const blocks = [
    makeBlock({ id: "w", category: "warmup", time_start: "17:00", time_end: "17:15" }),
    makeBlock({ id: "b", category: "batting", time_start: "17:15", time_end: "17:45" }),
  ];
  const a = analyzeSession({ session: makeSession(), blocks });
  assert.ok(
    a.issues.some((i) => i.code === "NO_COOLDOWN" && i.severity === "warning"),
    `expected NO_COOLDOWN warning, got ${JSON.stringify(a.issues)}`
  );
});

// ============================================================================
// analyzeSession — category balance (batting-heavy)
// ============================================================================

test("batting-heavy session flags CATEGORY_DOMINANT with percentage", () => {
  // 105 min of pure "batting" vs 15 min warm-up → ~87.5% batting → should flag.
  // Keep all batting in one category so byCategory[0].share crosses the 65%
  // threshold (batting_power is a separate category in the aggregation).
  const blocks = [
    makeBlock({ id: "w", category: "warmup", time_start: "17:00", time_end: "17:15" }),
    makeBlock({ id: "b1", category: "batting", time_start: "17:15", time_end: "17:50" }),
    makeBlock({ id: "b2", category: "batting", time_start: "17:50", time_end: "18:25" }),
    makeBlock({ id: "b3", category: "batting", time_start: "18:25", time_end: "19:00" }),
  ];
  const a = analyzeSession({ session: makeSession(), blocks });
  const top = a.byCategory[0];
  assert.equal(top.category, "batting");
  assert.ok(top.share > 0.65, `expected >65% share, got ${top.share}`);
  assert.ok(a.issues.some((i) => i.code === "CATEGORY_DOMINANT"));
});

// ============================================================================
// analyzeSession — lane utilisation
// ============================================================================

test("low lane utilisation produces a LOW_LANE_UTILISATION info issue", () => {
  // Everything in lane 1 only — should flag
  const blocks = [
    makeBlock({ id: "w", category: "warmup", time_start: "17:00", time_end: "17:15", lane_start: 1, lane_end: 1 }),
    makeBlock({ id: "b1", category: "batting", time_start: "17:15", time_end: "17:45", lane_start: 1, lane_end: 1 }),
    makeBlock({ id: "b2", category: "batting", time_start: "17:45", time_end: "18:15", lane_start: 1, lane_end: 1 }),
    makeBlock({ id: "c", category: "cooldown", time_start: "18:15", time_end: "18:30", lane_start: 1, lane_end: 1 }),
  ];
  const a = analyzeSession({ session: makeSession(), blocks });
  assert.equal(a.lanesUsed, 1);
  assert.ok(a.issues.some((i) => i.code === "LOW_LANE_UTILISATION"));
});

// ============================================================================
// analyzeSession — dead time
// ============================================================================

test("leading dead time > 20% is flagged as HIGH_DEAD_TIME", () => {
  // Session 17:00-19:00, but first block starts at 17:40 → 40 min leading dead
  const blocks = [
    makeBlock({ id: "w", category: "warmup", time_start: "17:40", time_end: "17:55" }),
    makeBlock({ id: "b", category: "batting", time_start: "17:55", time_end: "18:40" }),
    makeBlock({ id: "c", category: "cooldown", time_start: "18:40", time_end: "19:00" }),
  ];
  const a = analyzeSession({ session: makeSession(), blocks });
  assert.ok(a.deadTimeMins >= 40);
  assert.ok(a.issues.some((i) => i.code === "HIGH_DEAD_TIME"));
});

// ============================================================================
// analyzeSession — phase-aware tier check
// ============================================================================

test("Elite-heavy session in Explore phase flags ELITE_HEAVY_IN_EXPLORE", () => {
  const blocks = [
    makeBlock({ id: "w", category: "warmup", tier: "R", time_start: "17:00", time_end: "17:15" }),
    makeBlock({ id: "b1", category: "batting", tier: "E", time_start: "17:15", time_end: "17:45" }),
    makeBlock({ id: "b2", category: "batting", tier: "E", time_start: "17:45", time_end: "18:15" }),
    makeBlock({ id: "b3", category: "pace_bowling", tier: "E", time_start: "18:15", time_end: "18:45" }),
    makeBlock({ id: "c", category: "cooldown", tier: "R", time_start: "18:45", time_end: "19:00" }),
  ];
  const phase: Pick<Phase, "name"> = { name: "Explore" };
  const a = analyzeSession({ session: makeSession(), blocks, phase });
  assert.ok(a.issues.some((i) => i.code === "ELITE_HEAVY_IN_EXPLORE"));
});

test("Elite-heavy session in Excel phase does NOT flag ELITE_HEAVY_IN_EXPLORE", () => {
  const blocks = [
    makeBlock({ id: "w", category: "warmup", tier: "R", time_start: "17:00", time_end: "17:15" }),
    makeBlock({ id: "b1", category: "batting", tier: "E", time_start: "17:15", time_end: "17:45" }),
    makeBlock({ id: "b2", category: "batting", tier: "E", time_start: "17:45", time_end: "18:15" }),
    makeBlock({ id: "c", category: "cooldown", tier: "R", time_start: "18:45", time_end: "19:00" }),
  ];
  const a = analyzeSession({ session: makeSession(), blocks, phase: { name: "Excel" } });
  assert.ok(!a.issues.some((i) => i.code === "ELITE_HEAVY_IN_EXPLORE"));
});

// ============================================================================
// analyzeSession — coaching framework coverage via joined activity
// ============================================================================

test("framework coverage counts activities with GFR/KC/IC focus", () => {
  const gfrActivity = makeActivity({
    id: "act-gfr",
    coaching_framework: { gfr_focus: "Ground-up force" },
  });
  const kcActivity = makeActivity({
    id: "act-kc",
    coaching_framework: { kinetic_chain_focus: "Hip-shoulder separation" },
  });
  const noneActivity = makeActivity({ id: "act-none", coaching_framework: {} });

  const blocks = [
    makeBlock({ id: "w", category: "warmup", time_start: "17:00", time_end: "17:15" }),
    makeBlock({ id: "b1", category: "batting", activity_id: "act-gfr", time_start: "17:15", time_end: "17:45" }),
    makeBlock({ id: "b2", category: "batting", activity_id: "act-kc", time_start: "17:45", time_end: "18:15" }),
    makeBlock({ id: "b3", category: "batting", activity_id: "act-none", time_start: "18:15", time_end: "18:45" }),
    makeBlock({ id: "c", category: "cooldown", time_start: "18:45", time_end: "19:00" }),
  ];
  const a = analyzeSession({
    session: makeSession(),
    blocks,
    activities: [gfrActivity, kcActivity, noneActivity],
  });
  assert.equal(a.frameworkCoverage.gfrBlocks, 1);
  assert.equal(a.frameworkCoverage.kineticChainBlocks, 1);
  // The warmup, cooldown, and act-none block are all "unmapped"
  assert.ok(a.frameworkCoverage.unmappedBlocks >= 3);
});

// ============================================================================
// analyzeSession — coach coverage
// ============================================================================

test("no coach assignments triggers NO_COACH_ASSIGNED info issue", () => {
  const blocks = [
    makeBlock({ id: "w", category: "warmup", time_start: "17:00", time_end: "17:15" }),
    makeBlock({ id: "b", category: "batting", time_start: "17:15", time_end: "17:45" }),
    makeBlock({ id: "c", category: "cooldown", time_start: "17:45", time_end: "18:00" }),
  ];
  const a = analyzeSession({ session: makeSession(), blocks });
  assert.ok(a.issues.some((i) => i.code === "NO_COACH_ASSIGNED"));
});

test("partial coach coverage (>=50% missing) triggers PARTIAL_COACH_COVERAGE", () => {
  const blocks = [
    makeBlock({ id: "w", category: "warmup", time_start: "17:00", time_end: "17:15", coach_assigned: "Alex" }),
    makeBlock({ id: "b1", category: "batting", time_start: "17:15", time_end: "17:45" }),
    makeBlock({ id: "b2", category: "pace_bowling", time_start: "17:45", time_end: "18:15", coach_assigned: "Jarryd" }),
    makeBlock({ id: "b3", category: "fielding", time_start: "18:15", time_end: "18:45" }),
    makeBlock({ id: "c", category: "cooldown", time_start: "18:45", time_end: "19:00" }),
  ];
  const a = analyzeSession({ session: makeSession(), blocks });
  assert.equal(a.blocksWithCoach, 2);
  assert.equal(a.blocksWithoutCoach, 3);
  assert.ok(a.issues.some((i) => i.code === "PARTIAL_COACH_COVERAGE"));
});

// ============================================================================
// detectIssues — unit-level direct invocation
// ============================================================================

test("detectIssues with tiny block count does not crash", () => {
  const issues = detectIssues({
    sessionDurationMins: 120,
    blockMinutes: 10,
    warmupPresent: false,
    warmupMinutes: 0,
    cooldownPresent: false,
    cooldownMinutes: 0,
    byCategory: [
      { category: "batting", label: "Batting", blocks: 1, minutes: 10, share: 1 },
    ],
    lanesUsed: 1,
    deadTimeMins: 0,
    blocksWithoutCoach: 1,
    blockCount: 1,
    frameworkUnmapped: 1,
    byTier: [],
  });
  // No CATEGORY_DOMINANT at this size (blockMinutes < 30)
  assert.ok(!issues.some((i) => i.code === "CATEGORY_DOMINANT"));
  // But NO_WARMUP still fires
  assert.ok(issues.some((i) => i.code === "NO_WARMUP"));
});

// ============================================================================
// formatAnalysisForTool produces valid JSON with the expected fields
// ============================================================================

test("formatAnalysisForTool returns JSON the AI can parse", () => {
  const a = analyzeSession({
    session: makeSession(),
    blocks: [
      makeBlock({ id: "w", category: "warmup", time_start: "17:00", time_end: "17:15" }),
      makeBlock({ id: "b", category: "batting", time_start: "17:15", time_end: "17:45" }),
      makeBlock({ id: "c", category: "cooldown", time_start: "17:45", time_end: "18:00" }),
    ],
  });
  const json = formatAnalysisForTool(a);
  const parsed = JSON.parse(json);
  assert.ok(typeof parsed.headline === "string");
  assert.ok(Array.isArray(parsed.byCategory));
  assert.ok(Array.isArray(parsed.byTier));
  assert.ok(Array.isArray(parsed.byLane));
  assert.ok(parsed.byLane.length === 8, "byLane should include all 8 lanes");
  assert.ok(Array.isArray(parsed.issues));
  // warmup object shape
  assert.equal(typeof parsed.warmup.present, "boolean");
  assert.equal(typeof parsed.warmup.minutes, "number");
});
