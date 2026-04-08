"use client";

import { useState, useMemo } from "react";
import { useProgram } from "@/lib/program-context";
import { useCoaches } from "@/hooks/useCoaches";
import { CoachRosterTable } from "@/components/coaches/CoachRosterTable";
import { CoachProfileModal } from "@/components/coaches/CoachProfileModal";
import { ProgramMember, AvailabilityStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

// Generate array of date strings for a week starting from a given Monday
function getWeekDates(startDate: Date): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// Get the Monday of the week containing the given date
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${monday.toLocaleDateString("en-AU", opts)} — ${sunday.toLocaleDateString("en-AU", opts)} ${monday.getFullYear()}`;
}

export default function CoachesPage() {
  const { activeProgram, isAdmin } = useProgram();
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingCoach, setEditingCoach] = useState<ProgramMember | null>(null);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  // Calculate date range based on offset
  const { monday, dates, dateRange } = useMemo(() => {
    const today = new Date();
    const baseMonday = getMonday(today);
    baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);

    const weekDates = viewMode === "month"
      ? (() => {
          // Show 4 weeks for month view
          const allDates: string[] = [];
          for (let w = 0; w < 4; w++) {
            const m = new Date(baseMonday);
            m.setDate(m.getDate() + w * 7);
            allDates.push(...getWeekDates(m));
          }
          return allDates;
        })()
      : getWeekDates(baseMonday);

    return {
      monday: baseMonday,
      dates: weekDates,
      dateRange: {
        start: weekDates[0],
        end: weekDates[weekDates.length - 1],
      },
    };
  }, [weekOffset, viewMode]);

  const {
    coaches,
    availability,
    loading,
    setCoachAvailability,
    updateCoachProfile,
  } = useCoaches({
    programId: activeProgram?.id,
    dateRange,
  });

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setCurrentUserId(data.user?.id);
    });
  }, [supabase]);

  const handleSetAvailability = async (userId: string, date: string, status: AvailabilityStatus) => {
    await setCoachAvailability(userId, date, status);
  };

  // Summary stats
  const totalCoaches = coaches.length;
  const todayStr = new Date().toISOString().split("T")[0];
  const availableToday = availability.filter(
    (a) => a.date === todayStr && a.status === "available"
  ).length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coaches</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your coaching team and track availability
          </p>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-3">
          <div className="bg-rr-blue/10 text-rr-blue px-3 py-1.5 rounded-lg text-sm font-medium">
            {totalCoaches} Coaches
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium">
            {availableToday} Available Today
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - (viewMode === "month" ? 4 : 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Today
            </button>

            <button
              onClick={() => setWeekOffset((w) => w + (viewMode === "month" ? 4 : 1))}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <span className="text-sm font-medium text-gray-700 ml-2">
              {formatWeekRange(monday)}
            </span>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => { setViewMode("week"); setWeekOffset(0); }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                viewMode === "week" ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => { setViewMode("month"); setWeekOffset(0); }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                viewMode === "month" ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-50 bg-gray-50/50">
          <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Legend:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-500">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-red-400" />
            <span className="text-xs text-gray-500">Unavailable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-amber-400" />
            <span className="text-xs text-gray-500">Tentative</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-gray-100 border-2 border-dashed border-gray-300" />
            <span className="text-xs text-gray-500">Not set</span>
          </div>
          {isAdmin && (
            <span className="text-[10px] text-gray-400 ml-4">Click cells to toggle</span>
          )}
        </div>

        {/* Coach roster + availability grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading coaches...
          </div>
        ) : (
          <CoachRosterTable
            coaches={coaches}
            availability={availability}
            dates={dates}
            onEditCoach={setEditingCoach}
            onSetAvailability={handleSetAvailability}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Coach Profile Modal */}
      {editingCoach && (
        <CoachProfileModal
          coach={editingCoach}
          onSave={updateCoachProfile}
          onClose={() => setEditingCoach(null)}
          canEdit={isAdmin || editingCoach.user_id === currentUserId}
        />
      )}
    </div>
  );
}
