"use client";

import { useState } from "react";
import { SessionCoach, AvailabilityStatus, CoachRoleInSession } from "@/lib/types";
import { CoachRecord } from "@/hooks/useCoaches";
import { cn } from "@/lib/utils";

interface SessionCoachBarProps {
  coaches: CoachRecord[];
  sessionCoaches: SessionCoach[];
  availability: { userId: string; status: AvailabilityStatus | null }[];
  onRoster: (coachId: string) => void;
  onUnroster: (coachId: string) => void;
  isAdmin: boolean;
}

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVAIL_DOT: Record<string, string> = {
  available: "bg-emerald-400",
  unavailable: "bg-red-400",
  tentative: "bg-amber-400",
};

const ROLE_TAG: Record<CoachRoleInSession, { label: string; className: string }> = {
  squad_coach: { label: "Squad", className: "bg-rr-blue/20 text-rr-blue" },
  assistant: { label: "Asst", className: "bg-emerald-100 text-emerald-700" },
  specialist: { label: "Spec", className: "bg-rr-pink/20 text-rr-pink" },
};

export function SessionCoachBar({
  coaches,
  sessionCoaches,
  availability,
  onRoster,
  onUnroster,
  isAdmin,
}: SessionCoachBarProps) {
  const [showPicker, setShowPicker] = useState(false);

  const rosteredCoachIds = new Set(sessionCoaches.map((sc) => sc.coach_id).filter(Boolean));

  // Build lookup from coach_id → SessionCoach entries
  const coachRolesMap = new Map<string, SessionCoach[]>();
  for (const sc of sessionCoaches) {
    const key = sc.coach_id || "";
    if (!coachRolesMap.has(key)) coachRolesMap.set(key, []);
    coachRolesMap.get(key)!.push(sc);
  }

  // Group rostered coaches by role
  const squadCoaches = sessionCoaches.filter((sc) => sc.coach_role === "squad_coach");
  const assistants = sessionCoaches.filter((sc) => sc.coach_role === "assistant");
  const specialists = sessionCoaches.filter((sc) => sc.coach_role === "specialist");

  // Coaches not yet rostered
  const unrostered = coaches.filter((c) => !rosteredCoachIds.has(c.id));

  function getCoachName(coachId?: string): string {
    if (!coachId) return "Coach";
    const coach = coaches.find((c) => c.id === coachId);
    return coach?.name || "Coach";
  }

  function renderCoachChip(sc: SessionCoach) {
    const roleTag = ROLE_TAG[sc.coach_role] || ROLE_TAG.assistant;
    const name = sc.coach_name || getCoachName(sc.coach_id);
    return (
      <div
        key={sc.id}
        className="relative group flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-1 rounded-full text-xs font-medium shadow-sm"
      >
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", roleTag.className)}>
          {roleTag.label}
        </span>
        <span className="text-gray-800">{name}</span>
        {sc.hour && (
          <span className="text-[9px] text-gray-400 font-normal">Hr{sc.hour}</span>
        )}
        {sc.notes && (
          <span className="text-[9px] text-rr-pink font-normal truncate max-w-[80px]" title={sc.notes}>
            {sc.notes}
          </span>
        )}
        {isAdmin && sc.coach_id && (
          <button
            onClick={() => onUnroster(sc.coach_id!)}
            className="ml-0.5 w-4 h-4 rounded-full bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition opacity-0 group-hover:opacity-100"
            title="Remove from session"
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Squad coaches row */}
      {squadCoaches.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-rr-blue uppercase tracking-wider w-14">Squad:</span>
          {squadCoaches.map(renderCoachChip)}
        </div>
      )}

      {/* Assistants row */}
      {assistants.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider w-14">Assist:</span>
          {assistants.map(renderCoachChip)}
        </div>
      )}

      {/* Specialists row */}
      {specialists.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-rr-pink uppercase tracking-wider w-14">Spec:</span>
          {specialists.map(renderCoachChip)}
        </div>
      )}

      {sessionCoaches.length === 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Coaches:</span>
          <span className="text-xs text-gray-400 italic">No coaches assigned</span>
        </div>
      )}

      {/* Add coach button */}
      {isAdmin && (
        <div className="relative inline-flex">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-1 text-[10px] font-medium text-gray-400 hover:text-rr-blue transition px-2 py-1 rounded-lg hover:bg-rr-blue/5"
            title="Add coach to session"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Coach
          </button>

          {showPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-500">Add Coach to Session</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {unrostered.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-gray-400 text-center">
                      All coaches are rostered
                    </div>
                  ) : (
                    unrostered.map((coach) => (
                      <button
                        key={coach.id}
                        onClick={() => {
                          onRoster(coach.id);
                          setShowPicker(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition text-left"
                      >
                        <div className="w-7 h-7 rounded-full bg-rr-blue/10 text-rr-blue flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {getInitials(coach.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{coach.name}</div>
                          <div className="text-[10px] text-gray-400">
                            {coach.speciality || coach.role.replace("_", " ")}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
