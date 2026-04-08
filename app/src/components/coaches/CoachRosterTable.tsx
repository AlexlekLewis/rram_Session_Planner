"use client";

import { useState } from "react";
import { ProgramMember, CoachAvailability, AvailabilityStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CoachRosterTableProps {
  coaches: ProgramMember[];
  availability: CoachAvailability[];
  dates: string[];
  onEditCoach: (coach: ProgramMember) => void;
  onSetAvailability: (userId: string, date: string, status: AvailabilityStatus) => void;
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
  return `${day} ${num}`;
}

export function CoachRosterTable({
  coaches,
  availability,
  dates,
  onEditCoach,
  onSetAvailability,
  currentUserId,
  isAdmin,
}: CoachRosterTableProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  function getAvailability(userId: string, date: string): AvailabilityStatus | null {
    const record = availability.find((a) => a.user_id === userId && a.date === date);
    return record?.status ?? null;
  }

  function cycleStatus(userId: string, date: string) {
    const current = getAvailability(userId, date);
    const canEdit = isAdmin || userId === currentUserId;
    if (!canEdit) return;

    const currentIdx = current ? STATUS_CYCLE.indexOf(current) : -1;
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
    onSetAvailability(userId, date, nextStatus);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700 sticky left-0 bg-white z-10 min-w-[200px]">
              Coach
            </th>
            <th className="text-left py-3 px-3 font-semibold text-gray-700 min-w-[100px]">
              Role
            </th>
            <th className="text-left py-3 px-3 font-semibold text-gray-700 min-w-[120px]">
              Speciality
            </th>
            {dates.map((date) => (
              <th
                key={date}
                className="text-center py-3 px-1 font-medium text-gray-500 min-w-[56px]"
              >
                <div className="text-[10px] leading-tight">{formatDate(date)}</div>
              </th>
            ))}
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
                {dates.map((date) => {
                  const status = getAvailability(coach.user_id, date);
                  const cellKey = `${coach.user_id}-${date}`;
                  const isHovered = hoveredCell === cellKey;

                  return (
                    <td key={date} className="py-3 px-1 text-center">
                      <button
                        onClick={() => cycleStatus(coach.user_id, date)}
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
