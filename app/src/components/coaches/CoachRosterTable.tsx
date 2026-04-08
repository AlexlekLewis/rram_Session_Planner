"use client";

import { useState } from "react";
import { ProgramMember, CoachAvailability, AvailabilityStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatTimeShort } from "@/lib/constants";

interface SessionSlot {
  date: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  squadNames: string[];
}

interface CoachRosterTableProps {
  coaches: ProgramMember[];
  availability: CoachAvailability[];
  sessions: SessionSlot[];
  onEditCoach: (coach: ProgramMember) => void;
  onSetAvailability: (userId: string, sessionId: string, status: AvailabilityStatus) => void;
  currentUserId?: string;
  isAdmin: boolean;
}

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  head_coach: { label: "Head Coach", className: "bg-rr-pink/10 text-rr-pink" },
  assistant_coach: { label: "Assistant", className: "bg-rr-blue/10 text-rr-blue" },
  guest_coach: { label: "Guest", className: "bg-amber-100 text-amber-700" },
};

const STATUS_COLORS: Record<AvailabilityStatus, string> = {
  available: "bg-emerald-400",
  unavailable: "bg-red-400",
  tentative: "bg-amber-400",
};

const STATUS_CYCLE: AvailabilityStatus[] = ["available", "unavailable", "tentative"];

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (email || "?")[0].toUpperCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.toLocaleDateString("en-AU", { weekday: "short" });
  const num = d.getDate();
  const month = d.toLocaleDateString("en-AU", { month: "short" });
  return `${day} ${num} ${month}`;
}

export function CoachRosterTable({
  coaches,
  availability,
  sessions,
  onEditCoach,
  onSetAvailability,
  currentUserId,
  isAdmin,
}: CoachRosterTableProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  function getAvailability(userId: string, sessionId: string): AvailabilityStatus | null {
    const record = availability.find((a) => a.user_id === userId && a.session_id === sessionId);
    return record?.status ?? null;
  }

  function cycleStatus(userId: string, sessionId: string) {
    const current = getAvailability(userId, sessionId);
    const canEdit = isAdmin || userId === currentUserId;
    if (!canEdit) return;

    const currentIdx = current ? STATUS_CYCLE.indexOf(current) : -1;
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
    onSetAvailability(userId, sessionId, nextStatus);
  }

  // Group sessions by date for visual separators in the header
  const dateGroups: { date: string; sessions: SessionSlot[] }[] = [];
  for (const session of sessions) {
    const last = dateGroups[dateGroups.length - 1];
    if (last && last.date === session.date) {
      last.sessions.push(session);
    } else {
      dateGroups.push({ date: session.date, sessions: [session] });
    }
  }

  return (
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
            <th className="text-left py-2 px-3 font-semibold text-gray-700 min-w-[100px]">
              Role
            </th>
            <th className="text-left py-2 px-3 font-semibold text-gray-700 min-w-[120px]">
              Speciality
            </th>
            {sessions.map((session, idx) => {
              // Add left border on first session of each new date
              const isFirstOfDate = idx === 0 || sessions[idx - 1].date !== session.date;
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
            const canEdit = isAdmin || coach.user_id === currentUserId;

            return (
              <tr
                key={coach.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition"
              >
                {/* Coach name */}
                <td className="py-3 px-4 sticky left-0 bg-white z-10">
                  <button
                    onClick={() => onEditCoach(coach)}
                    className="flex items-center gap-3 text-left hover:text-rr-blue transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-rr-blue/10 text-rr-blue flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {getInitials(coach.display_name)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {coach.display_name || "Unnamed Coach"}
                      </div>
                      {coach.phone && (
                        <div className="text-xs text-gray-400">{coach.phone}</div>
                      )}
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

                {/* Availability cells */}
                {sessions.map((session, idx) => {
                  const status = getAvailability(coach.user_id, session.sessionId);
                  const cellKey = `${coach.user_id}-${session.sessionId}`;
                  const isHovered = hoveredCell === cellKey;
                  const isFirstOfDate = idx === 0 || sessions[idx - 1].date !== session.date;

                  return (
                    <td
                      key={session.sessionId}
                      className={cn(
                        "py-3 px-1 text-center",
                        isFirstOfDate && idx > 0 && "border-l border-gray-200"
                      )}
                    >
                      <button
                        onClick={() => cycleStatus(coach.user_id, session.sessionId)}
                        onMouseEnter={() => setHoveredCell(cellKey)}
                        onMouseLeave={() => setHoveredCell(null)}
                        disabled={!canEdit}
                        className={cn(
                          "w-7 h-7 rounded-full mx-auto transition-all flex items-center justify-center",
                          status
                            ? STATUS_COLORS[status]
                            : "bg-gray-100 border-2 border-dashed border-gray-300",
                          canEdit && "cursor-pointer hover:scale-110",
                          !canEdit && "cursor-default opacity-75",
                          isHovered && canEdit && "ring-2 ring-offset-1 ring-gray-400"
                        )}
                        title={
                          status
                            ? `${status} — click to change`
                            : "Not set — click to set"
                        }
                      >
                        {status === "available" && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {status === "unavailable" && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                        {status === "tentative" && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                          </svg>
                        )}
                      </button>
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
          No coaches in this program yet. Add members via Settings → Members.
        </div>
      )}
    </div>
  );
}
