"use client";

import { Session, Squad } from "@/lib/types";
import { SessionCard } from "./SessionCard";

interface WeekGroupProps {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  sessions: Session[];
  squads: Squad[];
}

export function WeekGroup({
  weekNumber,
  weekStart,
  weekEnd,
  sessions,
  squads,
}: WeekGroupProps) {
  // Format week header: "Week N (Apr 14-20)"
  const weekStartStr = weekStart.toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
  });
  const weekEndStr = weekEnd.toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-3">
      {/* Week header */}
      <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 px-1">
        Week {weekNumber} ({weekStartStr}–{weekEndStr})
      </h2>

      {/* Sessions container */}
      <div className="space-y-2">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionCard key={session.id} session={session} squads={squads} />
          ))
        ) : (
          <div className="py-6 text-center text-sm text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            No sessions this week
          </div>
        )}
      </div>
    </div>
  );
}
