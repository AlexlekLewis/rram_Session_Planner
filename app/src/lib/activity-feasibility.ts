/**
 * Activity feasibility checker.
 *
 * Pure, deterministic — given an activity's stored constraints and a
 * venue's environment profile, return a structured verdict the AI can
 * quote. No Supabase calls, no React — so it is safe to unit-test and
 * cheap to call in a library-wide audit loop.
 *
 * Verdict levels:
 *   - feasible:    every hard constraint is satisfied
 *   - partial:     runs at a lower tier or with a workaround
 *   - infeasible:  physically cannot run here — do not recommend
 */

import { Activity, Venue } from "./types";

export type FeasibilityVerdict = "feasible" | "partial" | "infeasible";

export interface FeasibilityIssue {
  severity: "blocker" | "warning" | "info";
  field: string;
  message: string;
  suggestion?: string;
}

export interface FeasibilityResult {
  activity_id: string;
  activity_name: string;
  venue_id: string;
  venue_name: string;
  verdict: FeasibilityVerdict;
  issues: FeasibilityIssue[];
  summary: string;
}

function toLowerSet(xs: string[] | undefined): Set<string> {
  return new Set((xs || []).map((x) => x.toLowerCase()));
}

export function checkActivityAgainstVenue(activity: Activity, venue: Venue): FeasibilityResult {
  const issues: FeasibilityIssue[] = [];

  // 1. Environment — indoor vs outdoor
  if (activity.environment_required === "outdoor_only" && venue.venue_type === "indoor") {
    issues.push({
      severity: "blocker",
      field: "environment_required",
      message: `Activity requires outdoor, venue is indoor.`,
      suggestion: "Swap to an indoor-compatible drill or move this block to an outdoor session.",
    });
  }
  if (activity.environment_required === "indoor_ok" && venue.venue_type === "outdoor" && venue.weather_protection === "open") {
    issues.push({
      severity: "info",
      field: "environment_required",
      message: `Activity designed for indoor; venue is an open outdoor space.`,
      suggestion: "Confirm weather will cooperate or move to the covered area.",
    });
  }

  // 2. Ceiling height
  if (
    typeof activity.min_ceiling_m === "number" &&
    typeof venue.ceiling_height_m === "number" &&
    activity.min_ceiling_m > venue.ceiling_height_m
  ) {
    issues.push({
      severity: "blocker",
      field: "min_ceiling_m",
      message: `Needs ${activity.min_ceiling_m}m ceiling, venue has ${venue.ceiling_height_m}m.`,
      suggestion: "Run the Regression tier with underarm feeds and no lofted shots, or pick a ground-ball variant.",
    });
  }

  // 3. Carry distance
  if (
    typeof activity.min_carry_m === "number" &&
    typeof venue.max_carry_m === "number" &&
    activity.min_carry_m > venue.max_carry_m
  ) {
    issues.push({
      severity: "blocker",
      field: "min_carry_m",
      message: `Needs ${activity.min_carry_m}m carry, venue maxes out at ${venue.max_carry_m}m.`,
      suggestion: "Switch to a power-restricted variant (knocked-down targets, placement over power).",
    });
  }

  // 4. Run distance
  if (
    typeof activity.min_run_distance_m === "number" &&
    typeof venue.max_run_distance_m === "number" &&
    activity.min_run_distance_m > venue.max_run_distance_m
  ) {
    issues.push({
      severity: "warning",
      field: "min_run_distance_m",
      message: `Needs ${activity.min_run_distance_m}m run, venue has ${venue.max_run_distance_m}m.`,
      suggestion: "Shorten the run, run shuttles, or use a treadmill equivalent.",
    });
  }

  // 5. Surface compatibility
  const required = toLowerSet(activity.required_surfaces);
  const available = toLowerSet(venue.surface_types);
  if (required.size > 0) {
    const requiredList = Array.from(required);
    const availableList = Array.from(available);
    const overlap = requiredList.some((s) => available.has(s));
    if (!overlap) {
      issues.push({
        severity: "blocker",
        field: "required_surfaces",
        message: `Needs surface ${requiredList.join("/")}, venue offers ${availableList.join("/") || "none configured"}.`,
        suggestion: "Pick a drill rated for the venue surface. Sliding/diving drills need grass or synthetic turf.",
      });
    }
  }

  // 6. Safety equipment
  const reqSafety = activity.safety_equipment_required || {};
  const venueSafety = venue.safety_features || {};
  const missingSafety = Object.entries(reqSafety)
    .filter(([k, v]) => v === true && venueSafety[k] !== true)
    .map(([k]) => k);
  if (missingSafety.length > 0) {
    issues.push({
      severity: "warning",
      field: "safety_equipment_required",
      message: `Activity requires safety gear not confirmed at venue: ${missingSafety.join(", ")}.`,
      suggestion: "Bring the missing kit before running, or confirm with the head coach.",
    });
  }

  // 7. Bowling machines (inferred from category hint)
  if (
    (activity.category === "batting" || activity.category === "batting_power" || activity.category === "pace_bowling") &&
    !venue.has_bowling_machines &&
    typeof venue.has_bowling_machines === "boolean"
  ) {
    issues.push({
      severity: "info",
      field: "has_bowling_machines",
      message: `Venue has no bowling machine. Activity assumes machine pace by default.`,
      suggestion: "Substitute side-arm or coach-fed. Note the tier downgrade this forces.",
    });
  }

  const verdict: FeasibilityVerdict = issues.some((i) => i.severity === "blocker")
    ? "infeasible"
    : issues.some((i) => i.severity === "warning")
    ? "partial"
    : "feasible";

  const summary = buildSummary(activity, venue, verdict, issues);

  return {
    activity_id: activity.id,
    activity_name: activity.name,
    venue_id: venue.id,
    venue_name: venue.name,
    verdict,
    issues,
    summary,
  };
}

function buildSummary(activity: Activity, venue: Venue, verdict: FeasibilityVerdict, issues: FeasibilityIssue[]): string {
  if (verdict === "feasible") {
    return `"${activity.name}" runs as-is at ${venue.name}.`;
  }
  const blockers = issues.filter((i) => i.severity === "blocker");
  const warnings = issues.filter((i) => i.severity === "warning");
  const parts: string[] = [];
  if (blockers.length > 0) parts.push(`${blockers.length} blocker(s)`);
  if (warnings.length > 0) parts.push(`${warnings.length} warning(s)`);
  return `"${activity.name}" at ${venue.name} — ${verdict} (${parts.join(", ")}).`;
}

export interface LibraryAuditSummary {
  venue_id: string;
  venue_name: string;
  total: number;
  feasible: FeasibilityResult[];
  partial: FeasibilityResult[];
  infeasible: FeasibilityResult[];
}

export function auditLibraryForVenue(activities: Activity[], venue: Venue): LibraryAuditSummary {
  const summary: LibraryAuditSummary = {
    venue_id: venue.id,
    venue_name: venue.name,
    total: activities.length,
    feasible: [],
    partial: [],
    infeasible: [],
  };

  for (const activity of activities) {
    const result = checkActivityAgainstVenue(activity, venue);
    if (result.verdict === "feasible") summary.feasible.push(result);
    else if (result.verdict === "partial") summary.partial.push(result);
    else summary.infeasible.push(result);
  }

  return summary;
}

export function formatFeasibilityForTool(result: FeasibilityResult): string {
  const payload = {
    activity: result.activity_name,
    venue: result.venue_name,
    verdict: result.verdict,
    issues: result.issues,
    summary: result.summary,
  };
  return JSON.stringify(payload, null, 2);
}

export function formatLibraryAuditForTool(audit: LibraryAuditSummary): string {
  const payload = {
    venue: audit.venue_name,
    total_activities: audit.total,
    counts: {
      feasible: audit.feasible.length,
      partial: audit.partial.length,
      infeasible: audit.infeasible.length,
    },
    feasible: audit.feasible.map((r) => r.activity_name),
    partial: audit.partial.map((r) => ({
      activity: r.activity_name,
      issues: r.issues.map((i) => `${i.severity}: ${i.message}`),
    })),
    infeasible: audit.infeasible.map((r) => ({
      activity: r.activity_name,
      blockers: r.issues.filter((i) => i.severity === "blocker").map((i) => i.message),
      suggestions: r.issues.filter((i) => i.suggestion).map((i) => i.suggestion),
    })),
  };
  return JSON.stringify(payload, null, 2);
}
