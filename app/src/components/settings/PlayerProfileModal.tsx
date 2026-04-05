"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Player,
  Squad,
  PlayerActivitySummary,
  BlockCategory,
  PlayerRole,
} from "@/lib/types";
import { CATEGORY_COLOURS, CATEGORY_LABELS } from "@/lib/constants";
import { X, Activity, TrendingUp, Calendar } from "lucide-react";

// ---------------------------------------------------------------------------
// Helper maps
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<PlayerRole, string> = {
  batsman: "Batsman",
  bowler: "Bowler",
  all_rounder: "All-Rounder",
  wicketkeeper: "Wicketkeeper",
  wicketkeeper_batsman: "WK-Batsman",
};

const BOWLING_STYLE_LABELS: Record<string, string> = {
  right_arm_fast: "Right Arm Fast",
  right_arm_medium: "Right Arm Medium",
  right_arm_offspin: "Right Arm Offspin",
  right_arm_legspin: "Right Arm Legspin",
  left_arm_fast: "Left Arm Fast",
  left_arm_medium: "Left Arm Medium",
  left_arm_orthodox: "Left Arm Orthodox",
  left_arm_wrist: "Left Arm Wrist",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecentAssignment {
  id: string;
  category: BlockCategory | null;
  activity_name: string | null;
  duration_mins: number | null;
  balls_bowled: number | null;
  session_date: string;
}

interface WeeklyBowlingLoad {
  week_label: string;
  total_balls: number;
}

interface PlayerProfileModalProps {
  player: Player;
  squads: Squad[];
  onClose: () => void;
  supabase: ReturnType<typeof createClient>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlayerProfileModal({
  player,
  squads,
  onClose,
  supabase,
}: PlayerProfileModalProps) {
  const [activityData, setActivityData] = useState<PlayerActivitySummary[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<RecentAssignment[]>([]);
  const [weeklyBowling, setWeeklyBowling] = useState<WeeklyBowlingLoad[]>([]);
  const [loading, setLoading] = useState(true);

  const isBowler =
    player.role === "bowler" ||
    player.role === "all_rounder" ||
    !!player.bowling_style;

  // ------ data fetching ----------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      // 1. Activity summary from view
      const activityPromise = supabase
        .from("v_player_activity_summary")
        .select("*")
        .eq("player_id", player.id);

      // 2. Recent assignments (last 5) joined with session date
      const recentPromise = supabase
        .from("sp_player_block_assignments")
        .select(
          "id, category, activity_name, duration_mins, balls_bowled, session_id, sp_sessions(date)"
        )
        .eq("player_id", player.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // 3. Bowling load — all bowling assignments for weekly grouping
      const bowlingPromise = isBowler
        ? supabase
            .from("sp_player_block_assignments")
            .select("balls_bowled, created_at, sp_sessions(date)")
            .eq("player_id", player.id)
            .in("category", ["pace_bowling", "spin_bowling"])
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: null, error: null });

      const [activityRes, recentRes, bowlingRes] = await Promise.all([
        activityPromise,
        recentPromise,
        bowlingPromise,
      ]);

      if (cancelled) return;

      // Process activity data
      if (activityRes.data) {
        setActivityData(activityRes.data as PlayerActivitySummary[]);
      }

      // Process recent assignments
      if (recentRes.data) {
        const mapped: RecentAssignment[] = (recentRes.data as unknown[]).map(
          (row: unknown) => {
            const r = row as Record<string, unknown>;
            const sessionJoin = r.sp_sessions as
              | { date: string }
              | { date: string }[]
              | null;
            const sessionDate = Array.isArray(sessionJoin)
              ? sessionJoin[0]?.date ?? ""
              : sessionJoin?.date ?? "";
            return {
              id: r.id as string,
              category: (r.category as BlockCategory) || null,
              activity_name: (r.activity_name as string) || null,
              duration_mins: (r.duration_mins as number) || null,
              balls_bowled: (r.balls_bowled as number) || null,
              session_date: sessionDate,
            };
          }
        );
        setRecentAssignments(mapped);
      }

      // Process weekly bowling data — group into last 8 weeks
      if (bowlingRes.data && bowlingRes.data.length > 0) {
        const weekMap = new Map<string, number>();

        for (const row of bowlingRes.data as unknown[]) {
          const r = row as Record<string, unknown>;
          const sessionJoin = r.sp_sessions as
            | { date: string }
            | { date: string }[]
            | null;
          const dateStr = Array.isArray(sessionJoin)
            ? sessionJoin[0]?.date ?? ""
            : sessionJoin?.date ?? "";
          if (!dateStr) continue;

          const d = new Date(dateStr + "T00:00:00");
          // ISO week calculation
          const startOfYear = new Date(d.getFullYear(), 0, 1);
          const dayOfYear =
            Math.floor(
              (d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
            ) + 1;
          const weekNum = Math.ceil(dayOfYear / 7);
          const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;

          const balls = typeof r.balls_bowled === "number" ? r.balls_bowled : 0;
          weekMap.set(key, (weekMap.get(key) ?? 0) + balls);
        }

        const sorted = Array.from(weekMap.entries())
          .sort((a, b) => b[0].localeCompare(a[0]))
          .slice(0, 8)
          .reverse();

        setWeeklyBowling(
          sorted.map(([key, total]) => ({
            week_label: key,
            total_balls: total,
          }))
        );
      }

      setLoading(false);
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [player.id, supabase, isBowler]);

  // ------ derived data -----------------------------------------------------
  const sortedActivity = [...activityData]
    .filter((a) => a.total_minutes > 0)
    .sort((a, b) => b.total_minutes - a.total_minutes);

  const maxMinutes = sortedActivity.length
    ? Math.max(...sortedActivity.map((a) => a.total_minutes))
    : 1;

  const totalMinutes = sortedActivity.reduce(
    (sum, a) => sum + a.total_minutes,
    0
  );
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const totalSessions = new Set(
    activityData.map((a) => a.last_session)
  ).size;

  const totalBallsBowled = activityData
    .filter(
      (a) =>
        a.category === "pace_bowling" || a.category === "spin_bowling"
    )
    .reduce((sum, a) => sum + (a.total_balls_bowled ?? 0), 0);

  const bowlingSessionCount = activityData
    .filter(
      (a) =>
        a.category === "pace_bowling" || a.category === "spin_bowling"
    )
    .reduce((sum, a) => sum + (a.block_count ?? 0), 0);

  const avgBallsPerSession =
    bowlingSessionCount > 0
      ? Math.round(totalBallsBowled / bowlingSessionCount)
      : 0;

  const maxWeeklyBalls = weeklyBowling.length
    ? Math.max(...weeklyBowling.map((w) => w.total_balls), 1)
    : 1;

  // ------ player squads ----------------------------------------------------
  const playerSquads = squads.filter((s) =>
    player.squad_ids?.includes(s.id)
  );

  // ------ bowling load colour coding --------------------------------------
  function bowlingLoadColour(balls: number): string {
    if (balls > 180) return "#EF4444"; // red
    if (balls >= 120) return "#F59E0B"; // amber
    return "#22C55E"; // green
  }

  // ------ close on escape --------------------------------------------------
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ------ format date helper -----------------------------------------------
  function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-800">
        {/* ---- Close button ---- */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 space-y-6">
          {/* ================================================================
              HEADER
          ================================================================ */}
          <div className="pr-8">
            <h2 className="font-montserrat text-2xl font-bold text-gray-900 dark:text-white">
              {player.first_name} {player.last_name}
            </h2>

            {/* Badges row */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {player.role && (
                <span className="inline-flex items-center rounded-full bg-[#E11F8F]/10 px-2.5 py-0.5 text-xs font-semibold text-[#E11F8F]">
                  {ROLE_LABELS[player.role]}
                </span>
              )}
              {player.cricket_type && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {player.cricket_type === "male" ? "Male" : "Female"}
                </span>
              )}
              {player.batting_hand && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {player.batting_hand === "left" ? "Left-Hand Bat" : "Right-Hand Bat"}
                </span>
              )}
              {player.bowling_style && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {BOWLING_STYLE_LABELS[player.bowling_style] ?? player.bowling_style}
                </span>
              )}
            </div>

            {/* Squad badges */}
            {playerSquads.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {playerSquads.map((sq) => (
                  <span
                    key={sq.id}
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: sq.colour }}
                  >
                    {sq.name}
                  </span>
                ))}
              </div>
            )}

            {/* Club */}
            {player.club && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Club: {player.club}
              </p>
            )}
          </div>

          {/* ================================================================
              LOADING SKELETON
          ================================================================ */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700"
                />
              ))}
            </div>
          )}

          {/* ================================================================
              ACTIVITY BREAKDOWN
          ================================================================ */}
          {!loading && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#E11F8F]" />
                <h3 className="font-montserrat text-sm font-bold text-gray-900 dark:text-white">
                  Activity Breakdown
                </h3>
              </div>

              {sortedActivity.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No activity data yet
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {sortedActivity.map((a) => {
                      const pct = Math.max(
                        (a.total_minutes / maxMinutes) * 100,
                        4
                      );
                      const colour =
                        CATEGORY_COLOURS[a.category] ?? "#D4D4D8";
                      const label =
                        CATEGORY_LABELS[a.category] ?? a.category;
                      return (
                        <div
                          key={a.category}
                          className="flex items-center gap-3"
                        >
                          <span className="w-28 shrink-0 text-xs text-gray-600 dark:text-gray-300 truncate">
                            {label}
                          </span>
                          <div className="relative flex-1 h-5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: colour,
                              }}
                            />
                          </div>
                          <span className="w-14 shrink-0 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                            {a.total_minutes} min
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Total Training:{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {totalHours}h {remainingMins}m
                    </span>{" "}
                    across{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {totalSessions} sessions
                    </span>
                  </p>
                </>
              )}
            </div>
          )}

          {/* ================================================================
              BOWLING LOAD
          ================================================================ */}
          {!loading && isBowler && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#E11F8F]" />
                <h3 className="font-montserrat text-sm font-bold text-gray-900 dark:text-white">
                  Bowling Load
                </h3>
              </div>

              {totalBallsBowled === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No bowling data yet
                </p>
              ) : (
                <>
                  {/* Summary stats */}
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white p-3 dark:bg-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Total Balls
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {totalBallsBowled}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3 dark:bg-gray-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Avg / Session
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {avgBallsPerSession}
                      </p>
                    </div>
                  </div>

                  {/* Weekly bar chart */}
                  {weeklyBowling.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                        Weekly Load (last 8 weeks)
                      </p>
                      <div className="flex items-end gap-1.5" style={{ height: 120 }}>
                        {weeklyBowling.map((w) => {
                          const barHeight = Math.max(
                            (w.total_balls / maxWeeklyBalls) * 100,
                            4
                          );
                          const colour = bowlingLoadColour(w.total_balls);
                          return (
                            <div
                              key={w.week_label}
                              className="flex flex-1 flex-col items-center justify-end h-full"
                            >
                              <span className="mb-1 text-[10px] font-medium text-gray-700 dark:text-gray-300">
                                {w.total_balls}
                              </span>
                              <div
                                className="w-full rounded-t-md transition-all duration-500"
                                style={{
                                  height: `${barHeight}%`,
                                  backgroundColor: colour,
                                  minHeight: 4,
                                }}
                              />
                              <span className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
                                {w.week_label.split("-")[1]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {/* Legend */}
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: "#22C55E" }}
                          />
                          &lt;120
                        </span>
                        <span className="flex items-center gap-1">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: "#F59E0B" }}
                          />
                          120-180
                        </span>
                        <span className="flex items-center gap-1">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: "#EF4444" }}
                          />
                          &gt;180
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ================================================================
              RECENT SESSIONS
          ================================================================ */}
          {!loading && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
              <div className="mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#E11F8F]" />
                <h3 className="font-montserrat text-sm font-bold text-gray-900 dark:text-white">
                  Recent Sessions
                </h3>
              </div>

              {recentAssignments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No recent sessions
                </p>
              ) : (
                <div className="space-y-2">
                  {recentAssignments.map((a) => {
                    const catColour = a.category
                      ? CATEGORY_COLOURS[a.category] ?? "#D4D4D8"
                      : "#D4D4D8";
                    const catLabel = a.category
                      ? CATEGORY_LABELS[a.category] ?? a.category
                      : "Unknown";
                    return (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 dark:bg-gray-800"
                      >
                        <span className="w-20 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(a.session_date)}
                        </span>
                        <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                          {a.activity_name ?? "Untitled"}
                        </span>
                        <span
                          className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: catColour }}
                        >
                          {catLabel}
                        </span>
                        {a.duration_mins != null && (
                          <span className="shrink-0 text-xs text-gray-600 dark:text-gray-300">
                            {a.duration_mins}m
                          </span>
                        )}
                        {a.balls_bowled != null && a.balls_bowled > 0 && (
                          <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                            {a.balls_bowled}b
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              NOTES
          ================================================================ */}
          {!loading && player.notes && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
              <h3 className="font-montserrat mb-2 text-sm font-bold text-gray-900 dark:text-white">
                Notes
              </h3>
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {player.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
