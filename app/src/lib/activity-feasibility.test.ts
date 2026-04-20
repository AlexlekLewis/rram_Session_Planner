/**
 * Unit tests for activity-feasibility.ts
 *
 * Run with:
 *   cd app && ./node_modules/.bin/sucrase-node src/lib/activity-feasibility.test.ts
 */

import test from "node:test";
import assert from "node:assert/strict";

import { checkActivityAgainstVenue, auditLibraryForVenue } from "./activity-feasibility";
import type { Activity, Venue } from "./types";

// ============================================================================
// Fixtures
// ============================================================================

const indoorVenue: Venue = {
  id: "venue-cec",
  name: "Cutting Edge Cricket Centre",
  short_name: "CEC",
  lanes: [],
  venue_type: "indoor",
  surface_types: ["artificial_mat"],
  ceiling_height_m: 4.5,
  max_carry_m: 25,
  max_run_distance_m: 22,
  has_bowling_machines: true,
  bowling_machine_count: 3,
  weather_protection: "fully_enclosed",
  lighting: "artificial",
  safety_features: { padded_walls: true, netting: true, mats_available: true, first_aid: true },
  created_at: "2026-01-01",
};

const outdoorVenue: Venue = {
  id: "venue-oval",
  name: "Open Oval",
  lanes: [],
  venue_type: "outdoor",
  surface_types: ["grass"],
  ceiling_height_m: null,
  max_carry_m: 80,
  max_run_distance_m: 100,
  has_bowling_machines: false,
  bowling_machine_count: 0,
  weather_protection: "open",
  lighting: "natural",
  safety_features: {},
  created_at: "2026-01-01",
};

function baseActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "a1",
    name: "Test Drill",
    category: "batting",
    regression: {},
    progression: {},
    elite: {},
    gamify: {},
    default_duration_mins: 15,
    default_lanes: 1,
    equipment: [],
    tags: [],
    coaching_framework: {},
    is_global: true,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

test("activity with no constraints is feasible at any venue", () => {
  const activity = baseActivity();
  const result = checkActivityAgainstVenue(activity, indoorVenue);
  assert.equal(result.verdict, "feasible");
  assert.equal(result.issues.length, 0);
});

test("outdoor-only activity blocks at indoor venue", () => {
  const activity = baseActivity({ environment_required: "outdoor_only" });
  const result = checkActivityAgainstVenue(activity, indoorVenue);
  assert.equal(result.verdict, "infeasible");
  const blocker = result.issues.find((i) => i.field === "environment_required");
  assert.ok(blocker);
  assert.equal(blocker?.severity, "blocker");
});

test("outdoor-only activity runs fine at outdoor venue", () => {
  const activity = baseActivity({ environment_required: "outdoor_only" });
  const result = checkActivityAgainstVenue(activity, outdoorVenue);
  assert.equal(result.verdict, "feasible");
});

test("high-ball drill (needs 6m ceiling) blocks at CEC (4.5m)", () => {
  const activity = baseActivity({ name: "Lofted Drives", min_ceiling_m: 6 });
  const result = checkActivityAgainstVenue(activity, indoorVenue);
  assert.equal(result.verdict, "infeasible");
  const blocker = result.issues.find((i) => i.field === "min_ceiling_m");
  assert.ok(blocker);
  assert.match(blocker!.message, /6m ceiling.*4\.5m/);
});

test("power drill needing 40m carry blocks at CEC (25m carry)", () => {
  const activity = baseActivity({ name: "Long Straight Drives", min_carry_m: 40 });
  const result = checkActivityAgainstVenue(activity, indoorVenue);
  assert.equal(result.verdict, "infeasible");
  const blocker = result.issues.find((i) => i.field === "min_carry_m");
  assert.ok(blocker);
});

test("grass-only drill blocks at artificial-mat venue", () => {
  const activity = baseActivity({ name: "Sliding Stop", required_surfaces: ["grass"] });
  const result = checkActivityAgainstVenue(activity, indoorVenue);
  assert.equal(result.verdict, "infeasible");
  const blocker = result.issues.find((i) => i.field === "required_surfaces");
  assert.ok(blocker);
});

test("required safety kit missing from venue is a warning (partial), not a blocker", () => {
  const barebones: Venue = { ...indoorVenue, safety_features: {} };
  const activity = baseActivity({ safety_equipment_required: { mats: true } });
  const result = checkActivityAgainstVenue(activity, barebones);
  assert.equal(result.verdict, "partial");
  const warning = result.issues.find((i) => i.field === "safety_equipment_required");
  assert.equal(warning?.severity, "warning");
});

test("run distance below activity requirement produces a warning, not a block", () => {
  const activity = baseActivity({ name: "Long Sprints", min_run_distance_m: 40 });
  const result = checkActivityAgainstVenue(activity, indoorVenue);
  assert.equal(result.verdict, "partial");
});

test("activity summary contains drill + venue name", () => {
  const activity = baseActivity({ name: "Power Hitting", min_carry_m: 40 });
  const result = checkActivityAgainstVenue(activity, indoorVenue);
  assert.match(result.summary, /Power Hitting/);
  assert.match(result.summary, /Cutting Edge/);
});

test("library audit sorts activities into feasible/partial/infeasible buckets", () => {
  const library: Activity[] = [
    baseActivity({ id: "ok", name: "Ground Defence" }),
    baseActivity({ id: "partial", name: "Sprint Fitness", min_run_distance_m: 40 }),
    baseActivity({ id: "bad", name: "High Catches", min_ceiling_m: 8 }),
  ];
  const audit = auditLibraryForVenue(library, indoorVenue);
  assert.equal(audit.total, 3);
  assert.equal(audit.feasible.length, 1);
  assert.equal(audit.partial.length, 1);
  assert.equal(audit.infeasible.length, 1);
  assert.equal(audit.infeasible[0].activity_name, "High Catches");
});

test("indoor venue with no bowling machine triggers info (not blocker) for machine-assuming drill", () => {
  const noMachine: Venue = { ...indoorVenue, has_bowling_machines: false };
  const activity = baseActivity({ category: "batting" });
  const result = checkActivityAgainstVenue(activity, noMachine);
  assert.equal(result.verdict, "feasible"); // info-only doesn't block
  const info = result.issues.find((i) => i.field === "has_bowling_machines");
  assert.equal(info?.severity, "info");
});
