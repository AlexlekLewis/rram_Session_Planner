"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useProgram } from "@/lib/program-context";
import { useCoaches, CoachRecord } from "@/hooks/useCoaches";
import { CoachProfileModal } from "@/components/coaches/CoachProfileModal";
import { Session, SessionCoach, CoachRoleInSession } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { formatTimeShort } from "@/lib/constants";

interface SessionSlot {
  date: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  squadNames: string[];
}

const COACH_ROLE_BADGES: Record<CoachRoleInSession, { label: string; className: string }> = {
  squad_coach: { label: "Squad", className: "bg-rr-blue/10 text-rr-blue" },
  assistant: { label: "Assistant", className: "bg-emerald-50 text-emerald-700" },
  specialist: { label: "Specialist", className: "bg-rr-pink/10 text-rr-pink" },
};

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  head_coach: { label: "Head Coach", className: "bg-rr-pink/10 text-rr-pink" },
  assistant_coach: { label: "Coach", className: "bg-rr-blue/10 text-rr-blue" },
  guest_coach: { label: "Specialist", className: "bg-amber-100 text-amber-700" },
};

function getInitials(name?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return "?";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.toLocaleDateString("en-AU", { weekday: "short" });
  const num = d.getDate();
  const month = d.toLocaleDateString("en-AU", { month: "short" });
  return `${day} ${num} ${month}`;
}

export default function CoachesPage() {
  const { activeProgram, isAdmin } = useProgram();
  const supabase = useRef(createClient()).current;
  const [sessions, setSessions] = useState<SessionSlot[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"upcoming" | "all">("upcoming");
  const [editingCoach, setEditingCoach] = useState<CoachRecord | null>(null);

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

  const sessionIds = useMemo(
    () => filteredSessions.map((s) => s.sessionId),
    [filteredSessions]
  );

  const {
    coaches,
    sessionCoaches,
    loading: coachesLoading,
    getSessionCoachesByRole,
  } = useCoaches({
    programId: activeProgram?.id,
    sessionIds,
  });

  const loading = sessionsLoading || coachesLoading;

  // Build a lookup: for each coach, which sessions are they assigned to and in what role?
  const coachSessionMap = useMemo(() => {
    const map = new Map<string, SessionCoach[]>();
    for (const sc of sessionCoaches) {
      const key = sc.coach_id || sc.user_id || "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(sc);
    }
    return map;
  }, [sessionCoaches]);

  // Group sessions by date
  const dateGroups: { date: string; sessions: SessionSlot[] }[] = useMemo(() => {
    const groups: { date: string; sessions: SessionSlot[] }[] = [];
    for (const session of filteredSessions) {
      const last = groups[groups.length - 1];
      if (last && last.date === session.date) {
        last.sessions.push(session);
      } else {
        groups.push({ date: session.date, sessions: [session] });
      }
    }
    return groups;
  }, [filteredSessions]);

  // Summary stats
  const totalCoaches = coaches.length;
  const squadCoachCount = coaches.filter(
    (c) => c.role === "assistant_coach" && c.speciality?.toLowerCase().includes("squad")
  ).length;
  const specialistCount = coaches.filter((c) => c.role === "guest_coach").length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coaches</h1>
          <p className="text-sm text-gray-500 mt-1">
            Session coaching allocations and availability
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-rr-blue/10 text-rr-blue px-3 py-1.5 rounded-lg text-sm font-medium">
            {totalCoaches} Coaches
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-medium">
            {squadCoachCount} Squad Coaches
          </div>
          <div className="bg-rr-pink/10 text-rr-pink px-3 py-1.5 rounded-lg text-sm font-medium">
            {specialistCount} Specialists
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
          <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Roles:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rr-blue/10 text-rr-blue">S</span>
            <span className="text-xs text-gray-500">Squad Coach</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">A</span>
            <span className="text-xs text-gray-500">Assistant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rr-pink/10 text-rr-pink">SP</span>
            <span className="text-xs text-gray-500">Specialist</span>
          </div>
          <div className="flex items-center gap-1.5 ml-4">
            <div className="w-4 h-4 rounded-full bg-gray-100 border-2 border-dashed border-gray-300" />
            <span className="text-xs text-gray-500">Not assigned</span>
          </div>
        </div>

        {/* Coach allocation grid */}
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
            <p className="text-sm mt-1">Create sessions in the Month view to track coach allocations</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {/* Date grouping row */}
                <tr className="border-b border-gray-100">
                  <th colSpan={3} className="sticky left-0 bg-white z-10" />
                  {dateGroups.map((group) => (
                    <th
                      key={group.date}
                      colSpan={group.sessions.length}
                      className="text-center py-2 px-1 font-semibold text-gray-700 text-[11px] border-l border-gray-200 first:border-l-0"
                    >
                      {formatDate(group.date)}
                    </th>
                  ))}
                </tr>
                {/* Session detail row */}
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-semibold text-gray-700 sticky left-0 bg-white z-10 min-w-[200px]">
                    Coach
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 min-w-[80px]">
                    Type
                  </th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700 min-w-[120px]">
                    Speciality
                  </th>
                  {filteredSessions.map((session, idx) => {
                    const isFirstOfDate = idx === 0 || filteredSessions[idx - 1].date !== session.date;
                    return (
                      <th
                        key={session.sessionId}
                        className={cn(
                          "text-center py-2 px-1 font-medium text-gray-500 min-w-[72px]",
                          isFirstOfDate && idx > 0 && "border-l border-gray-200"
                        )}
                      >
                        <div className="text-[9px] leading-tight text-gray-600 font-semibold">
                          {formatTimeShort(session.startTime)}–{formatTimeShort(session.endTime)}
                        </div>
                        {session.squadNames.length > 0 && (
                          <div
                            className="text-[8px] leading-tight text-rr-blue/70 mt-0.5 truncate max-w-[68px] mx-auto"
                            title={session.squadNames.join(", ")}
                          >
                            {session.squadNames.join(", ")}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {coaches.map((coach) => {
                  const badge = ROLE_BADGES[coach.role] || ROLE_BADGES.assistant_coach;
                  const assignments = coachSessionMap.get(coach.id) || [];

                  return (
                    <tr
                      key={coach.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      {/* Coach name */}
                      <td className="py-3 px-4 sticky left-0 bg-white z-10">
                        <button
                          onClick={() => setEditingCoach(coach)}
                          className="flex items-center gap-3 text-left hover:text-rr-blue transition"
                        >
                          <div className="w-8 h-8 rounded-full bg-rr-blue/10 text-rr-blue flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {getInitials(coach.name)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {coach.name}
                            </div>
                          </div>
                        </button>
                      </td>

                      {/* Role badge */}
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            badge.className
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Speciality */}
                      <td className="py-3 px-3 text-gray-500 text-xs">
                        {coach.speciality || "—"}
                      </td>

                      {/* Assignment cells */}
                      {filteredSessions.map((session, idx) => {
                        const sessionAssignments = assignments.filter(
                          (a) => a.session_id === session.sessionId
                        );
                        const isFirstOfDate = idx === 0 || filteredSessions[idx - 1].date !== session.date;

                        return (
                          <td
                            key={session.sessionId}
                            className={cn(
                              "py-3 px-1 text-center",
                              isFirstOfDate && idx > 0 && "border-l border-gray-200"
                            )}
                          >
                            {sessionAssignments.length > 0 ? (
                              <div className="flex flex-col items-center gap-0.5">
                                {sessionAssignments.map((a) => {
                                  const roleBadge = COACH_ROLE_BADGES[a.coach_role] || COACH_ROLE_BADGES.assistant;
                                  const label =
                                    a.coach_role === "squad_coach"
                                      ? "S"
                                      : a.coach_role === "specialist"
                                      ? "SP"
                                      : `A${a.hour || ""}`;
                                  return (
                                    <span
                                      key={a.id}
                                      className={cn(
                                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none",
                                        roleBadge.className
                                      )}
                                      title={`${roleBadge.label}${a.hour ? ` (Hour ${a.hour})` : ""}${a.notes ? ` — ${a.notes}` : ""}`}
                                    >
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-gray-100 border border-dashed border-gray-300 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {coaches.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No coaches found. Add coaches via the database.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coach Profile Modal — adapted for CoachRecord */}
      {editingCoach && (
        <CoachProfileModalWrapper
          coach={editingCoach}
          onClose={() => setEditingCoach(null)}
          canEdit={isAdmin}
        />
      )}
    </div>
  );
}

// Simple wrapper to show coach details in a modal
function CoachProfileModalWrapper({
  coach,
  onClose,
  canEdit,
}: {
  coach: CoachRecord;
  onClose: () => void;
  canEdit: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-rr-blue/10 text-rr-blue flex items-center justify-center text-lg font-bold">
            {getInitials(coach.name)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{coach.name}</h2>
            <p className="text-sm text-gray-500">{coach.speciality || coach.role}</p>
          </div>
        </div>

        {coach.email && (
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Email:</span> {coach.email}
          </div>
        )}
        {coach.bio && (
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Bio:</span> {coach.bio}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
