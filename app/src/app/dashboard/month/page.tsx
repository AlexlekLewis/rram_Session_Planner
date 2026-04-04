"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Program, Phase, Squad, Session } from "@/lib/types";
import { PhaseBanner } from "@/components/calendar/PhaseBanner";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";

type ViewMode = "overview" | "detail";

export default function MonthPage() {
  const supabase = createClient();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [program, setProgram] = useState<Program | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: programData } = await supabase
          .from("sp_programs")
          .select("*")
          .single();
        setProgram(programData);

        const { data: phasesData } = await supabase
          .from("sp_phases")
          .select("*")
          .order("sort_order");
        setPhases(phasesData || []);

        const { data: squadsData } = await supabase
          .from("sp_squads")
          .select("*");
        setSquads(squadsData || []);

        // In overview mode, fetch ALL program sessions
        // In detail mode, fetch current month only
        if (programData) {
          const { data: sessionsData } = await supabase
            .from("sp_sessions")
            .select("*")
            .gte("date", programData.start_date)
            .lte("date", programData.end_date)
            .order("date");
          setSessions(sessionsData || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  // Determine current phase
  useEffect(() => {
    if (phases.length > 0) {
      const todayStr = new Date().toISOString().split("T")[0];
      const activePhase = phases.find(
        (phase) => phase.start_date <= todayStr && todayStr <= phase.end_date
      );
      setCurrentPhase(activePhase || null);
    }
  }, [phases]);

  const handleSessionClick = useCallback((sessionId: string) => {
    router.push(`/dashboard/session/${sessionId}`);
  }, [router]);

  const handleDropSession = useCallback(async (sessionId: string, targetDate: string) => {
    // Optimistic update
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, date: targetDate } : s))
    );
    // Persist to Supabase
    const { error } = await supabase
      .from("sp_sessions")
      .update({ date: targetDate })
      .eq("id", sessionId);
    if (error) {
      console.error("Failed to move session:", error);
      // Revert on error — re-fetch
      const { data } = await supabase
        .from("sp_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (data) {
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? data : s)));
      }
    }
  }, [supabase]);

  // Generate months for the program
  const programMonths = (() => {
    if (!program) return [];
    const start = new Date(program.start_date + "T00:00:00");
    const end = new Date(program.end_date + "T00:00:00");
    const months: Date[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    while (current <= end) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  })();

  const monthName = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    // In overview mode, scroll to today's position
    if (viewMode === "overview") {
      setTimeout(() => {
        const todayEl = document.querySelector('[data-today="true"]');
        if (todayEl) todayEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex gap-1 mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-6">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, j) => (
                  <div key={j} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-rr-charcoal font-montserrat">
              {viewMode === "overview" ? "Program Overview" : monthName}
            </h1>
            {currentPhase && (
              <span className="text-xs font-medium text-rr-blue bg-blue-50 px-2.5 py-1 rounded-full">
                {currentPhase.name}
              </span>
            )}
            <button
              onClick={goToToday}
              className="text-xs font-medium text-gray-500 hover:text-rr-blue bg-white border border-gray-200 px-2.5 py-1 rounded-lg hover:border-rr-blue/30 transition"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("overview")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  viewMode === "overview"
                    ? "bg-white text-rr-charcoal shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode("detail")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  viewMode === "detail"
                    ? "bg-white text-rr-charcoal shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Month
              </button>
            </div>

            {/* Month navigation (detail mode only) */}
            {viewMode === "detail" && (
              <div className="flex items-center gap-1">
                <button
                  onClick={goToPreviousMonth}
                  className="p-1.5 hover:bg-white rounded-lg transition"
                >
                  <svg className="w-4 h-4 text-rr-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-1.5 hover:bg-white rounded-lg transition"
                >
                  <svg className="w-4 h-4 text-rr-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Phase Timeline Bar (overview mode) */}
        {viewMode === "overview" && phases.length > 0 && (
          <div className="flex gap-1 mb-4 rounded-lg overflow-hidden">
            {phases.map((phase, idx) => {
              const colors = [
                "bg-rr-blue text-white",
                "bg-rr-medium-blue text-white",
                "bg-rr-pink text-white",
              ];
              return (
                <div
                  key={phase.id}
                  className={`flex-1 px-3 py-2 ${colors[idx % colors.length]} font-montserrat`}
                >
                  <div className="text-xs font-bold">{phase.name}</div>
                  <div className="text-[10px] opacity-80">
                    {new Date(phase.start_date + "T00:00:00").toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
                    {" – "}
                    {new Date(phase.end_date + "T00:00:00").toLocaleDateString("en-AU", { month: "short", day: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Phase banner (detail mode) */}
        {viewMode === "detail" && currentPhase && (
          <PhaseBanner phase={currentPhase} />
        )}

        {/* Calendar(s) */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {viewMode === "overview" ? (
            <div className="space-y-6 p-4">
              {programMonths.map((monthDate) => {
                const monthLabel = monthDate.toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                });
                return (
                  <MonthCalendar
                    key={monthLabel}
                    currentDate={monthDate}
                    sessions={sessions}
                    squads={squads}
                    phases={phases}
                    compact={true}
                    label={monthLabel}
                    onSessionClick={handleSessionClick}
                    onDropSession={handleDropSession}
                  />
                );
              })}
            </div>
          ) : (
            <MonthCalendar
              currentDate={currentDate}
              sessions={sessions}
              squads={squads}
              phases={phases}
              compact={false}
              onSessionClick={handleSessionClick}
              onDropSession={handleDropSession}
            />
          )}
        </div>
      </div>
    </div>
  );
}
