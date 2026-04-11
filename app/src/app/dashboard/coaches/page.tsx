"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useProgram } from "@/lib/program-context";
import { useCoaches } from "@/hooks/useCoaches";
import { CoachRosterTable } from "@/components/coaches/CoachRosterTable";
import { CoachProfileModal } from "@/components/coaches/CoachProfileModal";
import { ProgramMember, AvailabilityStatus, Session } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface SessionSlot {
  date: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  squadNames: string[];
}

export default function CoachesPage() {
  const { activeProgram, isAdmin } = useProgram();
  // Stable Supabase client — avoid churning useEffect/useCallback deps.
  const supabase = useRef(createClient()).current;
  const [currentUserId, setCurrentUserId] = useState<string>();
  const [editingCoach, setEditingCoach] = useState<ProgramMember | null>(null);
  const [sessions, setSessions] = useState<SessionSlot[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"upcoming" | "all">("upcoming");

  // Fetch sessions for the program
  const fetchSessions = useCallback(async () => {
    if (!activeProgram?.id) return;
    setSessionsLoading(true);

    const [sessRes, squadRes] = await Promise.all([
      supabase
        .from("sp_sessions")
        .select("id, date, start_time, end_time, squad_ids, status")
        .eq("program_id", activeProgram.id)
        .order("date")
        .order("start_time"),
      supabase
        .from("sp_squads")
        .select("id, name")
        .eq("program_id", activeProgram.id),
    ]);

    const squads = (squadRes.data || []) as { id: string; name: string }[];
    const squadMap = Object.fromEntries(squads.map((s) => [s.id, s.name]));

    const slots: SessionSlot[] = ((sessRes.data || []) as Session[]).map((s) => ({
      date: s.date,
      sessionId: s.id,
      startTime: s.start_time,
      endTime: s.end_time,
      squadNames: (s.squad_ids || []).map((id) => squadMap[id] || "").filter(Boolean),
    }));

    setSessions(slots);
    setSessionsLoading(false);
  }, [supabase, activeProgram?.id]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Filter sessions based on view mode
  const filteredSessions = useMemo(() => {
    if (viewMode === "all") return sessions;
    const today = new Date().toISOString().split("T")[0];
    return sessions.filter((s) => s.date >= today);
  }, [sessions, viewMode]);

  // Get session IDs for availability fetch
  const sessionIds = useMemo(
    () => filteredSessions.map((s) => s.sessionId),
    [filteredSessions]
  );

  const {
    coaches,
    availability,
    loading: coachesLoading,
    setCoachAvailability,
    updateCoachProfile,
  } = useCoaches({
    programId: activeProgram?.id,
    sessionIds,
  });

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setCurrentUserId(data.user?.id);
    });
  }, [supabase]);

  const handleSetAvailability = async (userId: string, sessionId: string, status: AvailabilityStatus) => {
    await setCoachAvailability(userId, sessionId, status);
  };

  const loading = sessionsLoading || coachesLoading;

  // Summary stats
  const totalCoaches = coaches.length;
  const nextSession = filteredSessions[0];
  const nextSessionAvailable = nextSession
    ? availability.filter((a) => a.session_id === nextSession.sessionId && a.status === "available").length
    : 0;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coaches</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your coaching team and track availability across sessions
          </p>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-3">
          <div className="bg-rr-blue/10 text-rr-blue px-3 py-1.5 rounded-lg text-sm font-medium">
            {totalCoaches} Coaches
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium">
            {nextSession
              ? `${nextSessionAvailable} Available Next Session`
              : "No Upcoming Sessions"}
          </div>
          <div className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium">
            {filteredSessions.length} Sessions
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="text-sm font-medium text-gray-700">
            {viewMode === "upcoming" ? "Upcoming Sessions" : "All Program Sessions"}
            {activeProgram && (
              <span className="text-gray-400 ml-2 font-normal">— {activeProgram.name}</span>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("upcoming")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                viewMode === "upcoming" ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                viewMode === "all" ? "bg-white shadow text-gray-900" : "text-gray-500"
              }`}
            >
              All Sessions
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
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No {viewMode === "upcoming" ? "upcoming " : ""}sessions found</p>
            <p className="text-sm mt-1">Create sessions in the Month view to track coach availability</p>
          </div>
        ) : (
          <CoachRosterTable
            coaches={coaches}
            availability={availability}
            sessions={filteredSessions}
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
