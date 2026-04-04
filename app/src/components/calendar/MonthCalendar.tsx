"use client";

import { useMemo } from "react";
import { Session, Squad, Phase } from "@/lib/types";
import { DayCell } from "./DayCell";
import { cn } from "@/lib/utils";

// Opaque phase colors for day cell backgrounds
const PHASE_COLORS: Record<string, string> = {
  Onboarding: "rgba(100, 116, 139, 0.12)",   // slate
  Assessment: "rgba(168, 85, 247, 0.10)",     // purple
  Explore: "rgba(59, 130, 246, 0.10)",        // blue
  Challenge: "rgba(249, 115, 22, 0.10)",      // orange
  Execute: "rgba(225, 31, 143, 0.10)",        // pink (RRA)
};

interface MonthCalendarProps {
  currentDate: Date;
  sessions: Session[];
  squads: Squad[];
  phases?: Phase[];
  compact?: boolean;
  onSessionClick?: (sessionId: string) => void;
  onDropSession?: (sessionId: string, targetDate: string) => void;
  label?: string;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

export function MonthCalendar({
  currentDate,
  sessions,
  squads,
  phases = [],
  compact = false,
  onSessionClick,
  onDropSession,
  label,
}: MonthCalendarProps) {
  const today = useMemo(() => new Date(), []);

  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const startingDayOfWeek = firstDay.getDay();
  const startingMondayIndex = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
  const daysInMonth = lastDay.getDate();

  const calendarDays: (Date | null)[] = [];
  for (let i = 0; i < startingMondayIndex; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  }
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // Get phase for a given date string
  const getPhaseForDate = (dateStr: string): Phase | undefined => {
    return phases.find((p) => p.start_date <= dateStr && dateStr <= p.end_date);
  };

  const dayLabels = compact ? DAYS_SHORT : DAYS_OF_WEEK;
  const cellHeight = compact ? "h-20" : "h-28";

  return (
    <div>
      {label && (
        <h3 className={cn(
          "font-bold font-montserrat text-rr-charcoal mb-1",
          compact ? "text-sm" : "text-base"
        )}>
          {label}
        </h3>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {dayLabels.map((day, i) => (
              <th
                key={i}
                className={cn(
                  "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center font-semibold text-rr-charcoal dark:text-gray-300 font-montserrat",
                  compact ? "p-1 text-[10px] h-6" : "p-2 text-xs h-8"
                )}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIdx) => (
            <tr key={weekIdx}>
              {week.map((day, dayIdx) => {
                if (!day) {
                  return (
                    <td
                      key={`empty-${dayIdx}`}
                      className={cn("border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50", cellHeight, compact ? "p-0.5" : "p-1.5")}
                    />
                  );
                }

                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                // BUG-010 FIX: Use local date components instead of toISOString() which converts to UTC
                // and shifts the date when local timezone is ahead of UTC (e.g., AEST = UTC+10)
                const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                const isToday = day.toDateString() === today.toDateString();
                const daySessions = sessions.filter((s) => s.date === dateStr);
                const phase = getPhaseForDate(dateStr);
                const phaseBg = phase ? PHASE_COLORS[phase.name] || undefined : undefined;

                return (
                  <td
                    key={dateStr}
                    className={cn("border border-gray-200 dark:border-gray-700", cellHeight, compact ? "p-0.5" : "p-1.5")}
                    style={phaseBg ? { backgroundColor: phaseBg } : undefined}
                  >
                    <DayCell
                      date={day}
                      sessions={daySessions}
                      squads={squads}
                      isToday={isToday}
                      isCurrentMonth={isCurrentMonth}
                      compact={compact}
                      onSessionClick={onSessionClick}
                      onDropSession={onDropSession}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
