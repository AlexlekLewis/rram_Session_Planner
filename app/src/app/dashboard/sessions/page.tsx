"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Session, Squad, Phase } from "@/lib/types";
import { WeekGroup } from "@/components/session-list/WeekGroup";
import { cn } from "@/lib/utils";

interface SessionWithRelations extends Session {
  phase?: Phase;
  squads?: Squad[];
}

interface WeekData {
  weekNumber: number;
  weekStart: Date;
  weekEnd: Date;
  sessions: SessionWithRelations[];
}

export default function SessionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading sessions...</div>}>
      <SessionsContent />
    </Suspense>
  );
}

function SessionsContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<SessionWithRelations[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [phases, setPhases] = useState<Phase[]>([]);
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    published: 0,
    completed: 0,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch sessions with phase data
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sp_sessions")
          .select(
            `
            *,
            phase:sp_phases(*),
            squads:squad_ids
          `
          )
          .order("date", { ascending: true });

        if (sessionsError) throw sessionsError;

        // Fetch squads
        const { data: squadsData, error: squadsError } = await supabase
          .from("sp_squads")
          .select("*");

        if (squadsError) throw squadsError;

        // Fetch phases
        const { data: phasesData, error: phasesError } = await supabase
          .from("sp_phases")
          .select("*");

        if (phasesError) throw phasesError;

        // Process sessions with squad lookup
        const processedSessions: (Session & { squads: Squad[] })[] = (sessionsData || []).map((session: Session & { squad_ids?: string[] }) => ({
          ...session,
          squads: session.squad_ids
            ? session.squad_ids
                .map((squadId: string) =>
                  squadsData?.find((s: Squad) => s.id === squadId)
                )
                .filter(Boolean)
            : [],
        }));

        setSessions(processedSessions);
        setSquads(squadsData || []);
        setPhases(phasesData || []);

        // Calculate stats
        const total = processedSessions.length;
        const draft = processedSessions.filter(
          (s) => s.status === "draft"
        ).length;
        const published = processedSessions.filter(
          (s) => s.status === "published"
        ).length;
        const completed = processedSessions.filter(
          (s) => s.status === "completed"
        ).length;

        setStats({ total, draft, published, completed });
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Group sessions by week
  useEffect(() => {
    if (sessions.length === 0 || !sessions[0]) return;

    // Get program start date from first session's phase
    const firstSession = sessions[0];
    let programStartDate: Date;

    if (firstSession.phase?.start_date) {
      programStartDate = new Date(firstSession.phase.start_date);
    } else if (firstSession.date) {
      // Fallback to first session date if no phase
      programStartDate = new Date(firstSession.date);
    } else {
      programStartDate = new Date();
    }

    // Set to start of week (Monday)
    const dayOfWeek = programStartDate.getDay();
    const diff =
      programStartDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(programStartDate.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    // Group sessions by week number
    const weekMap = new Map<number, SessionWithRelations[]>();

    sessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);

      // Calculate week number from program start
      const timeDiff = sessionDate.getTime() - weekStart.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      const weekNumber = Math.floor(daysDiff / 7) + 1;

      if (!weekMap.has(weekNumber)) {
        weekMap.set(weekNumber, []);
      }
      weekMap.get(weekNumber)!.push(session);
    });

    // Create week data array
    const weeksData: WeekData[] = [];
    for (const [weekNumber, weekSessions] of Array.from(weekMap.entries())) {
      const weekStartDate = new Date(weekStart);
      weekStartDate.setDate(weekStartDate.getDate() + (weekNumber - 1) * 7);

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      weeksData.push({
        weekNumber,
        weekStart: weekStartDate,
        weekEnd: weekEndDate,
        sessions: weekSessions.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      });
    }

    setWeeks(weeksData.sort((a, b) => a.weekNumber - b.weekNumber));
  }, [sessions]);

  // Handle scroll to date from search params
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam && scrollRef.current) {
      setTimeout(() => {
        const targetDate = new Date(dateParam);
        const weekElement = document.querySelector(
          `[data-week-start="${targetDate.getFullYear()}-${String(targetDate.getMonth()+1).padStart(2,"0")}-${String(targetDate.getDate()).padStart(2,"0")}"]`
        );
        if (weekElement) {
          weekElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [searchParams, weeks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rr-blue mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">
      {/* Main content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-4xl"
      >
        {weeks.length > 0 ? (
          <div className="space-y-8">
            {weeks.map((week) => (
              <div
                key={week.weekNumber}
                data-week-start={week.weekStart
                  .toISOString()
                  .split("T")[0]}
              >
                <WeekGroup
                  weekNumber={week.weekNumber}
                  weekStart={week.weekStart}
                  weekEnd={week.weekEnd}
                  sessions={week.sessions}
                  squads={squads}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No sessions planned yet</p>
          </div>
        )}
      </div>

      {/* Sidebar: Quick Stats */}
      <aside className="hidden lg:flex w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto flex-col">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-bold text-rr-charcoal dark:text-white text-lg mb-6">
            Planning Summary
          </h2>

          {/* Stats cards */}
          <div className="space-y-3">
            <StatCard
              label="Total Sessions"
              value={stats.total}
              color="bg-gray-100"
              textColor="text-rr-charcoal"
            />
            <StatCard
              label="Draft"
              value={stats.draft}
              color="bg-amber-50"
              textColor="text-amber-600"
              dot="bg-amber-400"
            />
            <StatCard
              label="Published"
              value={stats.published}
              color="bg-green-50"
              textColor="text-green-600"
              dot="bg-green-500"
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              color="bg-blue-50"
              textColor="text-blue-600"
              dot="bg-blue-500"
            />
          </div>
        </div>

        {/* Additional info section */}
        <div className="flex-1 p-6 text-xs text-gray-500 dark:text-gray-400 space-y-4">
          <div>
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Next Steps</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Review draft sessions</li>
              <li>Assign specialist coaches</li>
              <li>Publish confirmed sessions</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ============================================================================
// Stat Card Component
// ============================================================================

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  textColor: string;
  dot?: string;
}

function StatCard({ label, value, color, textColor, dot }: StatCardProps) {
  return (
    <div className={cn("rounded-lg p-4", color)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</span>
        {dot && <div className={cn("w-2 h-2 rounded-full", dot)} />}
      </div>
      <div className={cn("text-3xl font-bold mt-1", textColor)}>{value}</div>
    </div>
  );
}
