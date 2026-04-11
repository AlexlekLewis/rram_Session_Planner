/**
 * Session Intelligence — deterministic analysis of a session's block plan.
 *
 * This module is the backing compute behind the AI assistant's `analyze_session`
 * tool and the "push back on poor session design" anti-sycophancy rule from
 * docs/AI_CAPABILITIES_REPORT.md. The existing `get_session_summary` returned
 * only "N blocks from HH:MM to HH:MM", which gave the model nothing substantive
 * to cite when the capability report requires:
 *
 *   - "Session balance feedback — Alerts if a session is too batting-heavy or
 *     missing warm-up/cool-down"
 *   - "Push back on poor session design — Must explain WHY, not just say no"
 *
 * By surfacing concrete numbers (category share, warm-up duration, tier
 * distribution, lane utilisation, coaching-framework coverage, dead time), the
 * model can make specific, auditable critiques instead of hand-waving.
 *
 * DESIGN CONSTRAINTS
 * - Pure functions only. No React, no network, no I/O. Deterministic given
 *   the same inputs so we can unit-test it cheaply.
 * - No new types leaking out — consumes the existing `SessionBlock`,
 *   `Activity`, `Session`, `Phase` shapes from `./types`.
 * - No mutation. All inputs are read-only.
 * - Safe on empty/malformed input (empty block list, missing phase, unknown
 *   category). The assistant often calls this mid-design, so partial plans
 *   must still produce useful output.
 *
 * USAGE
 *   import { analyzeSession } from "@/lib/session-analysis";
 *   const analysis = analyzeSession({ session, blocks, activities, phase });
 *   // analysis.issues[] is the anti-sycophancy payload the model cites
 */

import {
  Activity,
  BlockCategory,
  Phase,
  Session,
  SessionBlock,
  Tier,
} from "./types";
import { CATEGORY_LABELS, TOTAL_LANES } from "./constants";

// ============================================================================
// Public schema
// ============================================================================

export type IssueSeverity = "critical" | "warning" | "info";

/** A single flag the model can surface to the coach, with a specific number. */
export interface SessionIssue {
  severity: IssueSeverity;
  code: string;
  message: string;
}

export interface CategoryShare {
  category: BlockCategory;
  label: string;
  blocks: number;
  minutes: number;
  share: number; // 0..1
}

export interface TierShare {
  tier: Tier;
  blocks: number;
  minutes: number;
  share: number; // 0..1
}

export interface LaneUsage {
  lane: number;
  blocks: number;
  minutes: number;
  utilisation: number; // 0..1 of session duration
}

export interface CoachingFrameworkCoverage {
  /** Blocks whose activity names a GFR focus. */
  gfrBlocks: number;
  /** Blocks whose activity names a kinetic-chain focus. */
  kineticChainBlocks: number;
  /** Blocks whose activity names an intent-clarity focus. */
  intentClarityBlocks: number;
  /** Blocks whose activity has NO framework focus set at all. */
  unmappedBlocks: number;
}

export interface SessionAnalysis {
  /** Total planned duration of the session in minutes (end_time - start_time). */
  sessionDurationMins: number;
  /** Total block-minutes (sum of each block's duration, ignoring lanes). */
  blockMinutes: number;
  /** Number of distinct lanes actually touched by at least one block. */
  lanesUsed: number;
  /** How many blocks in the plan. */
  blockCount: number;
  /** First block start time (HH:MM) or null if empty. */
  firstBlockStart: string | null;
  /** Last block end time (HH:MM) or null if empty. */
  lastBlockEnd: string | null;
  /** Contiguous empty time between session start/end and blocks, in minutes. */
  deadTimeMins: number;
  /** Category share table, sorted by minutes descending. */
  byCategory: CategoryShare[];
  /** Tier share table, in fixed R/P/E/G order. */
  byTier: TierShare[];
  /** Per-lane usage, including lanes with 0 blocks. */
  byLane: LaneUsage[];
  /** Warm-up / cool-down summary. */
  warmup: { present: boolean; minutes: number };
  cooldown: { present: boolean; minutes: number };
  /** Coach assignment coverage. */
  blocksWithCoach: number;
  blocksWithoutCoach: number;
  /** Coaching-framework coverage via joined activities. */
  frameworkCoverage: CoachingFrameworkCoverage;
  /** Top N flags the model should cite when replying. */
  issues: SessionIssue[];
  /** One-line human-friendly headline derived from the above. */
  headline: string;
}

export interface AnalyzeSessionInput {
  session: Pick<Session, "start_time" | "end_time"> | null | undefined;
  blocks: SessionBlock[] | null | undefined;
  activities?: Activity[] | null;
  phase?: Pick<Phase, "name"> | null;
}

// ============================================================================
// Time helpers (kept local so this module has no deep dep chain)
// ============================================================================

/** HH:MM → minutes since 00:00. Safe on malformed input (returns 0). */
export function toMinutes(time: string | undefined | null): number {
  if (!time || typeof time !== "string") return 0;
  const parts = time.split(":");
  if (parts.length < 2) return 0;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** Duration of a single block in minutes. Negative/invalid durations clamp to 0. */
export function blockDurationMins(block: Pick<SessionBlock, "time_start" | "time_end">): number {
  const start = toMinutes(block.time_start);
  const end = toMinutes(block.time_end);
  const d = end - start;
  return d > 0 ? d : 0;
}

/** Number of lanes a block spans (inclusive). Clamped to >= 1. */
function blockLaneSpan(block: Pick<SessionBlock, "lane_start" | "lane_end">): number {
  const span = block.lane_end - block.lane_start + 1;
  return span > 0 ? span : 1;
}

// ============================================================================
// Core analysis
// ============================================================================

const ZERO_FRAMEWORK_COVERAGE: CoachingFrameworkCoverage = {
  gfrBlocks: 0,
  kineticChainBlocks: 0,
  intentClarityBlocks: 0,
  unmappedBlocks: 0,
};

/**
 * Compute a full SessionAnalysis snapshot. Safe on empty/partial input.
 *
 * The returned object is intended to be serialised as the `tool_result` body
 * the AI assistant reads when it calls the `analyze_session` tool. Every
 * number is something the model can cite verbatim.
 */
export function analyzeSession(input: AnalyzeSessionInput): SessionAnalysis {
  const blocks = (input.blocks || []).filter(Boolean);
  const activities = input.activities || [];
  const activityById = new Map(activities.map((a) => [a.id, a]));

  const sessionStart = input.session ? toMinutes(input.session.start_time) : 0;
  const sessionEnd = input.session ? toMinutes(input.session.end_time) : 0;
  const sessionDurationMins = sessionEnd > sessionStart ? sessionEnd - sessionStart : 0;

  // ---------------------------------------------------------
  // Empty session — short-circuit with a useful analysis
  // ---------------------------------------------------------
  if (blocks.length === 0) {
    return {
      sessionDurationMins,
      blockMinutes: 0,
      lanesUsed: 0,
      blockCount: 0,
      firstBlockStart: null,
      lastBlockEnd: null,
      deadTimeMins: sessionDurationMins,
      byCategory: [],
      byTier: buildTierShares([], 0),
      byLane: buildEmptyLaneTable(),
      warmup: { present: false, minutes: 0 },
      cooldown: { present: false, minutes: 0 },
      blocksWithCoach: 0,
      blocksWithoutCoach: 0,
      frameworkCoverage: { ...ZERO_FRAMEWORK_COVERAGE },
      issues: [
        {
          severity: "critical",
          code: "EMPTY_SESSION",
          message: "The grid is empty — nothing to analyse yet.",
        },
      ],
      headline: "Grid is empty — no plan to analyse yet.",
    };
  }

  // ---------------------------------------------------------
  // Aggregates over the block set
  // ---------------------------------------------------------
  let blockMinutes = 0;
  const categoryMinutes = new Map<BlockCategory, { mins: number; blocks: number }>();
  const tierMinutes = new Map<Tier, { mins: number; blocks: number }>();
  const laneMinutes = new Map<number, { mins: number; blocks: number }>();

  let warmupMinutes = 0;
  let cooldownMinutes = 0;
  let warmupPresent = false;
  let cooldownPresent = false;
  let blocksWithCoach = 0;
  let blocksWithoutCoach = 0;

  const framework: CoachingFrameworkCoverage = { ...ZERO_FRAMEWORK_COVERAGE };

  for (const block of blocks) {
    const durMins = blockDurationMins(block);
    blockMinutes += durMins;

    // Category
    const catBucket = categoryMinutes.get(block.category) || { mins: 0, blocks: 0 };
    catBucket.mins += durMins;
    catBucket.blocks += 1;
    categoryMinutes.set(block.category, catBucket);

    // Tier
    const tierBucket = tierMinutes.get(block.tier) || { mins: 0, blocks: 0 };
    tierBucket.mins += durMins;
    tierBucket.blocks += 1;
    tierMinutes.set(block.tier, tierBucket);

    // Lanes the block occupies
    for (let lane = block.lane_start; lane <= block.lane_end; lane += 1) {
      const lb = laneMinutes.get(lane) || { mins: 0, blocks: 0 };
      lb.mins += durMins;
      lb.blocks += 1;
      laneMinutes.set(lane, lb);
    }

    // Warm-up / cool-down
    if (block.category === "warmup") {
      warmupPresent = true;
      warmupMinutes += durMins;
    } else if (block.category === "cooldown") {
      cooldownPresent = true;
      cooldownMinutes += durMins;
    }

    // Coach coverage
    if (block.coach_assigned && block.coach_assigned.trim().length > 0) {
      blocksWithCoach += 1;
    } else {
      blocksWithoutCoach += 1;
    }

    // Coaching framework coverage via the joined activity
    const activity = block.activity_id ? activityById.get(block.activity_id) : undefined;
    const cf = activity?.coaching_framework;
    const hasGfr = !!cf?.gfr_focus?.trim();
    const hasKc = !!cf?.kinetic_chain_focus?.trim();
    const hasIc = !!cf?.intent_clarity?.trim();
    if (hasGfr) framework.gfrBlocks += 1;
    if (hasKc) framework.kineticChainBlocks += 1;
    if (hasIc) framework.intentClarityBlocks += 1;
    if (!hasGfr && !hasKc && !hasIc) framework.unmappedBlocks += 1;
  }

  // ---------------------------------------------------------
  // Shape the aggregates into the public schema
  // ---------------------------------------------------------
  const byCategory: CategoryShare[] = Array.from(categoryMinutes.entries())
    .map(([category, { mins, blocks: blockCount }]) => ({
      category,
      label: CATEGORY_LABELS[category] || category,
      blocks: blockCount,
      minutes: mins,
      share: blockMinutes > 0 ? mins / blockMinutes : 0,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  const byTier = buildTierShares(blocks, blockMinutes);

  const byLane: LaneUsage[] = buildEmptyLaneTable().map((row) => {
    const used = laneMinutes.get(row.lane);
    if (!used) return row;
    return {
      ...row,
      blocks: used.blocks,
      minutes: used.mins,
      utilisation: sessionDurationMins > 0 ? used.mins / sessionDurationMins : 0,
    };
  });

  // Start/end and dead time
  const sorted = [...blocks].sort((a, b) => a.time_start.localeCompare(b.time_start));
  const firstBlockStart = sorted[0]?.time_start || null;
  const lastBlockEnd = sorted.reduce<string | null>((acc, b) => {
    if (!acc || b.time_end.localeCompare(acc) > 0) return b.time_end;
    return acc;
  }, null);

  const firstStartMins = firstBlockStart ? toMinutes(firstBlockStart) : sessionStart;
  const lastEndMins = lastBlockEnd ? toMinutes(lastBlockEnd) : sessionEnd;
  const leadingDead = Math.max(0, firstStartMins - sessionStart);
  const trailingDead = Math.max(0, sessionEnd - lastEndMins);
  const deadTimeMins = leadingDead + trailingDead;

  const lanesUsed = Array.from(laneMinutes.keys()).length;

  // ---------------------------------------------------------
  // Issue detection — the anti-sycophancy payload
  // ---------------------------------------------------------
  const issues = detectIssues({
    sessionDurationMins,
    blockMinutes,
    warmupPresent,
    warmupMinutes,
    cooldownPresent,
    cooldownMinutes,
    byCategory,
    lanesUsed,
    deadTimeMins,
    blocksWithoutCoach,
    blockCount: blocks.length,
    frameworkUnmapped: framework.unmappedBlocks,
    phaseName: input.phase?.name,
    byTier,
  });

  // ---------------------------------------------------------
  // Headline for chat — short, loaded with numbers
  // ---------------------------------------------------------
  const topCat = byCategory[0];
  const headline = buildHeadline({
    blockCount: blocks.length,
    sessionDurationMins,
    blockMinutes,
    topCategoryLabel: topCat?.label,
    topCategoryShare: topCat?.share ?? 0,
    warmupPresent,
    cooldownPresent,
    issuesCritical: issues.filter((i) => i.severity === "critical").length,
    issuesWarning: issues.filter((i) => i.severity === "warning").length,
  });

  return {
    sessionDurationMins,
    blockMinutes,
    lanesUsed,
    blockCount: blocks.length,
    firstBlockStart,
    lastBlockEnd,
    deadTimeMins,
    byCategory,
    byTier,
    byLane,
    warmup: { present: warmupPresent, minutes: warmupMinutes },
    cooldown: { present: cooldownPresent, minutes: cooldownMinutes },
    blocksWithCoach,
    blocksWithoutCoach,
    frameworkCoverage: framework,
    issues,
    headline,
  };
}

// ============================================================================
// Issue detection (kept as a separate pure function so it's unit-testable)
// ============================================================================

interface IssueInput {
  sessionDurationMins: number;
  blockMinutes: number;
  warmupPresent: boolean;
  warmupMinutes: number;
  cooldownPresent: boolean;
  cooldownMinutes: number;
  byCategory: CategoryShare[];
  lanesUsed: number;
  deadTimeMins: number;
  blocksWithoutCoach: number;
  blockCount: number;
  frameworkUnmapped: number;
  phaseName?: string;
  byTier: TierShare[];
}

/**
 * Generate the prioritised issue list. Keep this deterministic and cheap.
 * Order of pushes = priority the model should cite.
 *
 * Thresholds were picked from the RRA coaching framework (max 3 balls per
 * batter + running 3s between sets), the 8-lane venue layout, and the
 * capability report's explicit anti-sycophancy examples.
 */
export function detectIssues(input: IssueInput): SessionIssue[] {
  const issues: SessionIssue[] = [];

  // ---------------- Warm-up / cool-down ----------------
  // Capability report explicitly names "missing warm-up/cool-down" as a V1
  // flag. These are the most common bad-design smells on a young-players
  // grid — lead with them.
  if (!input.warmupPresent) {
    issues.push({
      severity: "critical",
      code: "NO_WARMUP",
      message:
        "No warm-up block on the grid. Every session for young players should open with a warm-up (8–15 min is typical).",
    });
  } else if (input.warmupMinutes < 5) {
    issues.push({
      severity: "warning",
      code: "SHORT_WARMUP",
      message: `Warm-up is only ${input.warmupMinutes} minutes — consider extending to at least 8–10 minutes.`,
    });
  }

  if (!input.cooldownPresent) {
    issues.push({
      severity: "warning",
      code: "NO_COOLDOWN",
      message:
        "No cool-down block on the grid. A short recovery/debrief window helps the session land properly.",
    });
  }

  // ---------------- Category balance ----------------
  // "Too batting-heavy" is the canonical example in the report. Flag when
  // any single category owns more than 65% of the block minutes.
  const top = input.byCategory[0];
  if (top && top.share > 0.65 && input.blockMinutes > 30) {
    const pct = Math.round(top.share * 100);
    issues.push({
      severity: "warning",
      code: "CATEGORY_DOMINANT",
      message: `${top.label} is ${pct}% of the session (${top.minutes} min). Consider mixing in another category for variety and workload management.`,
    });
  }

  // No batting at all in a cricket session is weird enough to flag.
  const battingShare =
    (input.byCategory.find((c) => c.category === "batting")?.share ?? 0) +
    (input.byCategory.find((c) => c.category === "batting_power")?.share ?? 0);
  if (input.blockMinutes >= 30 && battingShare === 0) {
    issues.push({
      severity: "info",
      code: "NO_BATTING",
      message:
        "No batting blocks in this session. That's fine if it's intentional (e.g. an S&C day or pure fielding session) — flag if not.",
    });
  }

  // ---------------- Lane utilisation ----------------
  if (input.lanesUsed > 0 && input.lanesUsed < 3 && input.blockMinutes > 30) {
    issues.push({
      severity: "info",
      code: "LOW_LANE_UTILISATION",
      message: `Only ${input.lanesUsed} of ${TOTAL_LANES} lanes are used — you may be leaving capacity on the table for rotations.`,
    });
  }

  // ---------------- Dead time ----------------
  if (input.sessionDurationMins > 0) {
    const deadShare = input.deadTimeMins / input.sessionDurationMins;
    if (deadShare > 0.2 && input.deadTimeMins >= 15) {
      issues.push({
        severity: "warning",
        code: "HIGH_DEAD_TIME",
        message: `There are ${input.deadTimeMins} minutes of unscheduled time at the start/end of the session (${Math.round(deadShare * 100)}% of the window).`,
      });
    }
  }

  // ---------------- Coach coverage ----------------
  if (input.blockCount > 0 && input.blocksWithoutCoach === input.blockCount) {
    issues.push({
      severity: "info",
      code: "NO_COACH_ASSIGNED",
      message:
        "None of the blocks have a coach assigned yet. Assigning the specialist to each block sharpens accountability.",
    });
  } else if (
    input.blockCount >= 4 &&
    input.blocksWithoutCoach / input.blockCount >= 0.5
  ) {
    issues.push({
      severity: "info",
      code: "PARTIAL_COACH_COVERAGE",
      message: `${input.blocksWithoutCoach} of ${input.blockCount} blocks have no coach assigned.`,
    });
  }

  // ---------------- Tier appropriateness ----------------
  // The Explore phase should lean R/P (discovery, baselines). A session full
  // of Elite-tier work in Explore is almost certainly over-reaching.
  if (input.phaseName && /explore/i.test(input.phaseName)) {
    const eliteShare = input.byTier.find((t) => t.tier === "E")?.share ?? 0;
    if (eliteShare >= 0.5 && input.blockMinutes > 20) {
      issues.push({
        severity: "warning",
        code: "ELITE_HEAVY_IN_EXPLORE",
        message: `Elite-tier work is ${Math.round(eliteShare * 100)}% of the session but this is an Explore-phase session. Consider dropping to Regression/Progression for at least part of the time.`,
      });
    }
  }

  // ---------------- Framework coverage ----------------
  // If >70% of blocks have no coaching framework metadata we can't check
  // kinetic-chain focus, so we tell the coach the analysis is partial.
  if (input.blockCount >= 4 && input.frameworkUnmapped / input.blockCount >= 0.7) {
    issues.push({
      severity: "info",
      code: "FRAMEWORK_UNMAPPED",
      message:
        "Most blocks have no coaching-framework focus set on the underlying activity, so I can't cross-check GFR/kinetic-chain coverage.",
    });
  }

  return issues;
}

// ============================================================================
// Small helpers
// ============================================================================

function buildTierShares(blocks: SessionBlock[], totalMins: number): TierShare[] {
  const tiers: Tier[] = ["R", "P", "E", "G"];
  const bucket = new Map<Tier, { mins: number; blocks: number }>();

  for (const block of blocks) {
    const t = block.tier as Tier;
    if (!tiers.includes(t)) continue;
    const b = bucket.get(t) || { mins: 0, blocks: 0 };
    b.mins += blockDurationMins(block);
    b.blocks += 1;
    bucket.set(t, b);
  }

  return tiers.map((tier) => {
    const b = bucket.get(tier) || { mins: 0, blocks: 0 };
    return {
      tier,
      blocks: b.blocks,
      minutes: b.mins,
      share: totalMins > 0 ? b.mins / totalMins : 0,
    };
  });
}

function buildEmptyLaneTable(): LaneUsage[] {
  const rows: LaneUsage[] = [];
  for (let lane = 1; lane <= TOTAL_LANES; lane += 1) {
    rows.push({ lane, blocks: 0, minutes: 0, utilisation: 0 });
  }
  return rows;
}

interface HeadlineInput {
  blockCount: number;
  sessionDurationMins: number;
  blockMinutes: number;
  topCategoryLabel?: string;
  topCategoryShare: number;
  warmupPresent: boolean;
  cooldownPresent: boolean;
  issuesCritical: number;
  issuesWarning: number;
}

function buildHeadline(h: HeadlineInput): string {
  const parts: string[] = [];
  parts.push(`${h.blockCount} blocks / ${h.blockMinutes} min planned`);
  if (h.sessionDurationMins > 0) {
    parts.push(`in a ${h.sessionDurationMins}-min window`);
  }
  if (h.topCategoryLabel) {
    parts.push(`top category: ${h.topCategoryLabel} (${Math.round(h.topCategoryShare * 100)}%)`);
  }
  const wu = h.warmupPresent ? "warm-up ✓" : "no warm-up";
  const cd = h.cooldownPresent ? "cool-down ✓" : "no cool-down";
  parts.push(`${wu}, ${cd}`);
  if (h.issuesCritical > 0 || h.issuesWarning > 0) {
    parts.push(`${h.issuesCritical} critical / ${h.issuesWarning} warning`);
  }
  return parts.join(" · ");
}

// ============================================================================
// Serialisation for the AI tool result
// ============================================================================

/**
 * Compact, token-efficient JSON for the `analyze_session` tool result.
 *
 * We include the full numbers but drop zero-share category rows to keep the
 * payload small — the model typically only cares about the categories that
 * actually appear. Lane rows are kept in full so the model can spot an
 * entirely unused lane.
 */
export function formatAnalysisForTool(analysis: SessionAnalysis): string {
  const compact = {
    headline: analysis.headline,
    sessionDurationMins: analysis.sessionDurationMins,
    blockCount: analysis.blockCount,
    blockMinutes: analysis.blockMinutes,
    firstBlockStart: analysis.firstBlockStart,
    lastBlockEnd: analysis.lastBlockEnd,
    deadTimeMins: analysis.deadTimeMins,
    lanesUsed: analysis.lanesUsed,
    byCategory: analysis.byCategory.map((c) => ({
      category: c.category,
      label: c.label,
      blocks: c.blocks,
      minutes: c.minutes,
      sharePct: Math.round(c.share * 100),
    })),
    byTier: analysis.byTier.map((t) => ({
      tier: t.tier,
      blocks: t.blocks,
      minutes: t.minutes,
      sharePct: Math.round(t.share * 100),
    })),
    byLane: analysis.byLane.map((l) => ({
      lane: l.lane,
      blocks: l.blocks,
      minutes: l.minutes,
      utilisationPct: Math.round(l.utilisation * 100),
    })),
    warmup: analysis.warmup,
    cooldown: analysis.cooldown,
    coachCoverage: {
      assigned: analysis.blocksWithCoach,
      missing: analysis.blocksWithoutCoach,
    },
    frameworkCoverage: analysis.frameworkCoverage,
    issues: analysis.issues,
  };
  return JSON.stringify(compact, null, 2);
}

// Re-export helper for tests
export const __test__ = {
  blockLaneSpan,
  buildTierShares,
  buildHeadline,
  buildEmptyLaneTable,
};
