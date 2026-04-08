"use client";

import { useState } from "react";
import { ProgramMember, SessionCoach, AvailabilityStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SessionCoachBarProps {
  coaches: ProgramMember[];
  sessionCoaches: SessionCoach[];
  availability: { userId: string; status: AvailabilityStatus | null }[];
  onRoster: (userId: string) => void;
  onUnroster: (userId: string) => void;
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

export function SessionCoachBar({
  coaches,
  sessionCoaches,
  availability,
  onRoster,
  onUnroster,
  isAdmin,
}: SessionCoachBarProps) {
  const [showPicker, setShowPicker] = useState(false);

  const rosteredIds = new Set(sessionCoaches.map((sc) => sc.user_id));

  // Coaches already rostered
  const rostered = coaches.filter((c) => rosteredIds.has(c.user_id));
  // Coaches not yet rostered
  const unrostered = coaches.filter((c) => !rosteredIds.has(c.user_id));

  function getAvailStatus(userId: string): AvailabilityStatus | null {
    return availability.find((a) => a.userId === userId)?.status ?? null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Coaches:
      </span>

      {/* Rostered coaches */}
      {rostered.map((coach) => {
        const avail = getAvailStatus(coach.user_id);
        return (
          <div
            key={coach.user_id}
            className="relative group flex items-center gap-1.5 bg-rr-blue/10 text-rr-blue px-2 py-1 rounded-full text-xs font-medium"
          >
            {/* Availability dot */}
            {avail && (
              <div className={cn("w-2 h-2 rounded-full", AVAIL_DOT[avail])} />
            )}
            <span>{coach.display_name || "Coach"}</span>
            {isAdmin && (
              <button
                onClick={() => onUnroster(coach.user_id)}
                className="ml-1 w-4 h-4 rounded-full bg-rr-blue/20 text-rr-blue hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                title="Remove from session"
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {rostered.length === 0 && (
        <span className="text-xs text-gray-400 italic">No coaches rostered</span>
      )}

      {/* Add coach button */}
      {isAdmin && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="w-7 h-7 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:bg-rr-blue/10 hover:text-rr-blue hover:border-rr-blue/30 transition"
            title="Add coach to session"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Coach picker dropdown */}
          {showPicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-500">
                    Add Coach to Session
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {unrostered.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-gray-400 text-center">
                      All coaches are rostered
                    </div>
                  ) : (
                    unrostered.map((coach) => {
                      const avail = getAvailStatus(coach.user_id);
                      return (
                        <button
                          key={coach.user_id}
                          onClick={() => {
                            onRoster(coach.user_id);
                            setShowPicker(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-rr-blue/10 text-rr-blue flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {getInitials(coach.display_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {coach.display_name || "Coach"}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {coach.speciality || coach.role.replace("_", " ")}
                            </div>
                          </div>
                          {avail && (
                            <div
                              className={cn("w-3 h-3 rounded-full flex-shrink-0", AVAIL_DOT[avail])}
                              title={avail}
                            />
                          )}
                          {!avail && (
                            <div className="w-3 h-3 rounded-full bg-gray-200 flex-shrink-0" title="Not set" />
                          )}
                        </button>
                      );
                    })
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
