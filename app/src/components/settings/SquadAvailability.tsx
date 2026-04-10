"use client";

import { useMemo } from "react";
import type { Player, Squad } from "@/lib/types";
import { Users, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// SquadAvailability
// ----------------------------------------------------------------------------
// Surfaces live capacity + placement intelligence for the 8-session model.
//
// Rules (Head Coach policy):
//   - Max 24 players per squad
//   - Minimum 4 females per squad
//   - Every player should be in exactly 1 weekday squad + 1 weekend squad
//
// The component is pure: it derives everything from the Player + Squad props
// that PlayersTab already fetches, so there are zero extra round-trips.
// ============================================================================

const MIN_FEMALES_PER_SQUAD = 4;

type SquadType = "weekday" | "weekend";

const WEEKDAY_DAYS = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);

function getSquadType(squad: Squad): SquadType {
  const day = squad.session_days?.[0]?.day ?? "";
  return WEEKDAY_DAYS.has(day) ? "weekday" : "weekend";
}

interface SquadStats {
  squad: Squad;
  type: SquadType;
  total: number;
  females: number;
  males: number;
  openSlots: number;
  femalesNeeded: number;
  isFull: boolean;
  percentFull: number;
}

interface Props {
  players: Player[];
  squads: Squad[];
}

export function SquadAvailability({ players, squads }: Props) {
  const stats = useMemo<SquadStats[]>(() => {
    return squads
      .map((squad) => {
        const assigned = players.filter(
          (p) => p.is_active !== false && p.squad_ids?.includes(squad.id)
        );
        const females = assigned.filter((p) => p.cricket_type === "female").length;
        const total = assigned.length;
        const max = squad.max_players || 24;
        return {
          squad,
          type: getSquadType(squad),
          total,
          females,
          males: total - females,
          openSlots: Math.max(0, max - total),
          femalesNeeded: Math.max(0, MIN_FEMALES_PER_SQUAD - females),
          isFull: total >= max,
          percentFull: max > 0 ? Math.min(100, Math.round((total / max) * 100)) : 0,
        };
      })
      .sort((a, b) => a.squad.name.localeCompare(b.squad.name));
  }, [players, squads]);

  const weekday = stats.filter((s) => s.type === "weekday");
  const weekend = stats.filter((s) => s.type === "weekend");

  const totalOpenWeekday = weekday.reduce((sum, s) => sum + s.openSlots, 0);
  const totalOpenWeekend = weekend.reduce((sum, s) => sum + s.openSlots, 0);
  const newPlayerCapacity = Math.min(totalOpenWeekday, totalOpenWeekend);
  const totalFemalesNeeded = stats.reduce((sum, s) => sum + s.femalesNeeded, 0);

  // Suggest best pairings for a new player — one weekday + one weekend, prioritising
  // squads that need more females, then lowest fill rate.
  const bestPairings = useMemo(() => {
    const sortFn = (requireFemale: boolean) => (a: SquadStats, b: SquadStats) => {
      if (a.isFull && !b.isFull) return 1;
      if (b.isFull && !a.isFull) return -1;
      if (requireFemale) {
        if (a.femalesNeeded !== b.femalesNeeded) return b.femalesNeeded - a.femalesNeeded;
      }
      return a.percentFull - b.percentFull;
    };

    return {
      female: {
        weekday: [...weekday].sort(sortFn(true)).slice(0, 2),
        weekend: [...weekend].sort(sortFn(true)).slice(0, 2),
      },
      male: {
        weekday: [...weekday].sort(sortFn(false)).slice(0, 2),
        weekend: [...weekend].sort(sortFn(false)).slice(0, 2),
      },
    };
  }, [weekday, weekend]);

  if (squads.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 font-montserrat text-base font-semibold text-slate-900 dark:text-slate-100">
            <Users className="h-4 w-4 text-[#E11F8F]" />
            Squad Availability
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Max 24 / squad · Min {MIN_FEMALES_PER_SQUAD} females / squad · Every player
            needs 1 weekday + 1 weekend
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium",
              newPlayerCapacity > 0
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            )}
          >
            {newPlayerCapacity} new player slot{newPlayerCapacity === 1 ? "" : "s"} left
          </div>
          {totalFemalesNeeded > 0 && (
            <div className="rounded-md bg-[#E11F8F]/10 px-3 py-1.5 text-xs font-medium text-[#E11F8F]">
              {totalFemalesNeeded} female spot{totalFemalesNeeded === 1 ? "" : "s"} still needed
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SquadColumn
          title="Weekday Sessions"
          totalOpen={totalOpenWeekday}
          squads={weekday}
        />
        <SquadColumn
          title="Weekend Sessions"
          totalOpen={totalOpenWeekend}
          squads={weekend}
        />
      </div>

      {/* Best pairings */}
      <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#1226AA]" />
          <h4 className="font-montserrat text-sm font-semibold text-slate-800 dark:text-slate-200">
            Best pairings for new players
          </h4>
        </div>
        <div className="grid gap-3 text-xs sm:grid-cols-2">
          <PairingHint
            label="New female player"
            weekday={bestPairings.female.weekday[0]}
            weekend={bestPairings.female.weekend[0]}
            tone="pink"
          />
          <PairingHint
            label="New male player"
            weekday={bestPairings.male.weekday[0]}
            weekend={bestPairings.male.weekend[0]}
            tone="blue"
          />
        </div>
      </div>
    </div>
  );
}

// ---- Subcomponents ---------------------------------------------------------

function SquadColumn({
  title,
  totalOpen,
  squads,
}: {
  title: string;
  totalOpen: number;
  squads: SquadStats[];
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-montserrat text-sm font-semibold text-slate-700 dark:text-slate-300">
          {title}
        </h4>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {totalOpen} open
        </span>
      </div>
      <div className="space-y-2">
        {squads.map((s) => (
          <SquadRow key={s.squad.id} stats={s} />
        ))}
      </div>
    </div>
  );
}

function SquadRow({ stats }: { stats: SquadStats }) {
  const { squad, total, females, openSlots, femalesNeeded, isFull, percentFull } = stats;
  const max = squad.max_players || 24;

  const barColor = isFull
    ? "bg-red-500"
    : percentFull >= 85
    ? "bg-amber-500"
    : "bg-emerald-500";

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: squad.colour || "#94a3b8" }}
            />
            <span className="truncate font-medium text-slate-900 dark:text-slate-100">
              {squad.name}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              {total} / {max}
            </span>
            <span aria-hidden="true">·</span>
            <span className={femalesNeeded > 0 ? "text-[#E11F8F]" : ""}>
              {females}F / {total - females}M
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isFull ? (
            <span className="flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <AlertTriangle className="h-3 w-3" /> FULL
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" /> {openSlots} open
            </span>
          )}
          {femalesNeeded > 0 && (
            <span
              title={`Needs ${femalesNeeded} more female${femalesNeeded === 1 ? "" : "s"}`}
              className="rounded-md bg-[#E11F8F]/10 px-2 py-0.5 text-[11px] font-medium text-[#E11F8F]"
            >
              +{femalesNeeded}F
            </span>
          )}
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={cn("h-full transition-all", barColor)}
          style={{ width: `${percentFull}%` }}
        />
      </div>
    </div>
  );
}

function PairingHint({
  label,
  weekday,
  weekend,
  tone,
}: {
  label: string;
  weekday?: SquadStats;
  weekend?: SquadStats;
  tone: "pink" | "blue";
}) {
  const toneClasses =
    tone === "pink"
      ? "border-[#E11F8F]/30 bg-[#E11F8F]/5"
      : "border-[#1226AA]/30 bg-[#1226AA]/5";

  const renderCell = (s?: SquadStats) => {
    if (!s || s.isFull) {
      return <span className="text-slate-400 italic">no slot</span>;
    }
    return (
      <span className="font-medium text-slate-800 dark:text-slate-200">
        {s.squad.name.split(" — ")[0]}{" "}
        <span className="text-slate-500">({s.openSlots} open)</span>
      </span>
    );
  };

  return (
    <div className={cn("rounded-md border p-2.5", toneClasses)}>
      <p className="mb-1.5 font-medium text-slate-700 dark:text-slate-300">{label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Weekday:</span>
          {renderCell(weekday)}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-slate-500">Weekend:</span>
          {renderCell(weekend)}
        </div>
      </div>
    </div>
  );
}
