"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Session, Squad } from "@/lib/types";
import { formatTime } from "@/lib/constants";
import { SquadBadge } from "@/components/shared/SquadBadge";
import { cn } from "@/lib/utils";

interface SessionWithSquads extends Session {
  squads?: Squad[];
}

interface WeekData {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  sessions: SessionWithSquads[];
}

export default function PlayerPage() {
  // Stable Supabase client — avoid churning useEffect deps with a
  // fresh object on every render.
  const supabase = useRef(createClient()).current;
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionWithSquads[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);

        // Fetch all sessions (in Phase 4+ we'd filter by player's squad)
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sp_sessions")
          .select("*")
          .gte("date", (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; })())
          .order("date")
          .order("start_time");

        if (sessionsError) throw sessionsError;

        // Fetch squads
        const { data: squadsData, error: squadsError } = await supabase
          .from("sp_squads")
          .select("*");

        if (squadsError) throw squadsError;

        // Enrich sessions with squad data
        const enrichedSessions: SessionWithSquads[] = (sessionsData || []).map(
          (session: Session & { squad_ids: string[] }) => {
            const sessionSquads = session.squad_ids
              .map((squadId: string) =>
                (squadsData || []).find((s: Squad) => s.id === squadId)
              )
              .filter(Boolean);

            return {
              ...session,
              squads: sessionSquads,
            };
          }
        );

        setSessions(enrichedSessions);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [supabase]);

  // Group sessions by week
  const groupSessionsByWeek = (): WeekData[] => {
    const weeks: Map<number, WeekData> = new Map();

    sessions.forEach((session) => {
      const dateObj = new Date(session.date);
      dateObj.setUTCHours(0, 0, 0, 0);

      // Calculate ISO week number
      const onejan = new Date(dateObj.getUTCFullYear(), 0, 1);
      const millisecsInDay = 86400000;
      const weekNumber = Math.ceil(
        ((dateObj.getTime() - onejan.getTime()) / millisecsInDay + onejan.getUTCDay()) / 7
      );

      if (!weeks.has(weekNumber)) {
        // Calculate week boundaries
        const firstDayOfYear = new Date(dateObj.getUTCFullYear(), 0, 1);
        const weekStart = new Date(
          firstDayOfYear.getTime() +
            (weekNumber - 1) * 7 * millisecsInDay -
            (firstDayOfYear.getUTCDay() || 7) * millisecsInDay +
            1 * millisecsInDay
        );
        const weekEnd = new Date(weekStart.getTime() + 6 * millisecsInDay);

        weeks.set(weekNumber, {
          weekNumber,
          weekStart,
          weekEnd,
          sessions: [],
        });
      }

      weeks.get(weekNumber)!.sessions.push(session);
    });

    return Array.from(weeks.values()).sort(
      (a, b) => a.weekNumber - b.weekNumber
    );
  };

  const weekGroups = groupSessionsByWeek();

  const handleSessionClick = (sessionId: string) => {
    router.push(`/dashboard/player/session/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold text-rr-charcoal dark:text-white font-montserrat pb-4 border-b-2"
            style={{
              backgroundImage:
                "linear-gradient(to right, #E11F8F, #1226AA)",
              backgroundPosition: "0 100%",
              backgroundSize: "100% 2px",
              backgroundRepeat: "no-repeat",
              paddingBottom: "16px",
            }}
          >
            My Sessions
          </h1>
        </div>

        {/* Sessions grouped by week */}
        {weekGroups.length > 0 ? (
          <div className="space-y-8">
            {weekGroups.map((week) => (
              <div key={week.weekNumber}>
                {/* Week header */}
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 px-1">
                  Week {week.weekNumber} (
                  {week.weekStart.toLocaleDateString("en-AU", {
                    month: "short",
                    day: "numeric",
                  })}
                  –
                  {week.weekEnd.toLocaleDateString("en-AU", {
                    month: "short",
                    day: "numeric",
                  })}
                  )
                </h2>

                {/* Sessions */}
                <div className="space-y-2">
                  {week.sessions.map((session) => {
                    const dateObj = new Date(session.date);
                    const dayName = dateObj.toLocaleDateString("en-AU", {
                      weekday: "short",
                    });
                    const dateStr = dateObj.toLocaleDateString("en-AU", {
                      month: "short",
                      day: "numeric",
                    });

                    const statusColor = {
                      draft: "bg-amber-400",
                      published: "bg-green-500",
                      completed: "bg-blue-500",
                    }[session.status];

                    return (
                      <button
                        key={session.id}
                        onClick={() => handleSessionClick(session.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200",
                          "hover:border-rr-blue hover:shadow-md hover:bg-blue-50 dark:hover:bg-gray-700 active:bg-blue-100 dark:active:bg-gray-600",
                          "bg-white dark:bg-gray-800"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Left side: Date and time */}
                          <div className="flex-shrink-0">
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                              {dayName.toUpperCase()}
                            </div>
                            <div className="text-sm font-bold text-rr-charcoal dark:text-white">
                              {dateStr}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatTime(session.start_time)} -{" "}
                              {formatTime(session.end_time)}
                            </div>
                          </div>

                          {/* Status indicator */}
                          <div className="flex-shrink-0">
                            <div
                              className={cn("w-3 h-3 rounded-full", statusColor)}
                            />
                          </div>
                        </div>

                        {/* Session theme */}
                        <div className="mt-3">
                          <h3 className="font-semibold text-sm text-rr-charcoal dark:text-white line-clamp-2">
                            {session.theme || "Untitled Session"}
                          </h3>
                        </div>

                        {/* Squads */}
                        {session.squads && session.squads.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {session.squads.map((squad) => (
                              <SquadBadge
                                key={squad.id}
                                name={squad.name}
                                colour={squad.colour}
                                size="sm"
                              />
                            ))}
                          </div>
                        )}

                        {/* View Plan link */}
                        <div className="mt-4">
                          <span className="text-sm font-medium text-rr-blue hover:underline">
                            View Plan →
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">No upcoming sessions</p>
          </div>
        )}
      </div>
    </div>
  );
}
