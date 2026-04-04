"use client";

import { useState, useRef, useEffect } from "react";
import { Session, Squad } from "@/lib/types";
import { SquadBadge } from "@/components/shared/SquadBadge";
import { formatTimeShort } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface DayCellProps {
  date: Date;
  sessions: Session[];
  squads: Squad[];
  isToday: boolean;
  isCurrentMonth: boolean;
  compact?: boolean;
  onSessionClick?: (sessionId: string) => void;
  onDropSession?: (sessionId: string, targetDate: string) => void;
}

export function DayCell({
  date,
  sessions,
  squads,
  isToday,
  isCurrentMonth,
  compact = false,
  onSessionClick,
  onDropSession,
}: DayCellProps) {
  const dayNumber = date.getDate();
  const [showPopover, setShowPopover] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showPopover) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPopover]);

  const getSquadsForSession = (session: Session) => {
    return session.squad_ids
      .map((squadId) => squads.find((s) => s.id === squadId))
      .filter(Boolean) as Squad[];
  };

  const handleCellClick = () => {
    if (sessions.length === 0) return;
    if (sessions.length === 1 && onSessionClick) {
      onSessionClick(sessions[0].id);
    } else if (sessions.length > 1) {
      setShowPopover(true);
    }
  };

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const sessionId = e.dataTransfer.getData("text/session-id");
    if (sessionId && onDropSession) {
      const dateStr = date.toISOString().split("T")[0];
      onDropSession(sessionId, dateStr);
    }
  };

  // Compact mode: colored squares only
  if (compact) {
    return (
      <div
        className={cn(
          "h-full flex flex-col",
          !isCurrentMonth && "opacity-30 bg-gray-50 dark:bg-gray-800/50",
          isToday && "bg-blue-50 dark:bg-blue-900/30",
          dragOver && "ring-2 ring-rr-blue ring-inset bg-blue-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCellClick}
      >
        <div className={cn(
          "text-[10px] font-semibold font-montserrat leading-none mb-0.5",
          isToday ? "text-rr-pink" : isCurrentMonth ? "text-gray-500 dark:text-gray-400" : "text-gray-300 dark:text-gray-600"
        )}>
          {dayNumber}
        </div>
        {sessions.length > 0 && (
          <div className="flex flex-wrap gap-0.5 flex-1 items-start">
            {sessions.map((session) => {
              const sessionSquads = getSquadsForSession(session);
              const primaryColor = sessionSquads[0]?.colour || "#9CA3AF";
              return (
                <div
                  key={session.id}
                  className="w-5 h-5 rounded-sm cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: primaryColor }}
                  title={`${formatTimeShort(session.start_time)} — ${sessionSquads.map(s => s.name).join(", ")}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSessionClick?.(session.id);
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/session-id", session.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Full mode: compact cards
  return (
    <div
      className={cn(
        "h-full flex flex-col relative",
        isCurrentMonth ? "bg-white dark:bg-gray-900" : "opacity-30 bg-gray-50 dark:bg-gray-800/50",
        isToday && "bg-blue-50 dark:bg-blue-900/30",
        sessions.length > 0 && "cursor-pointer",
        dragOver && "ring-2 ring-rr-blue ring-inset bg-blue-50"
      )}
      onClick={handleCellClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Day number */}
      <div className={cn(
        "text-xs font-semibold font-montserrat mb-1 leading-none",
        isToday ? "text-rr-pink" : isCurrentMonth ? "text-rr-charcoal dark:text-gray-200" : "text-gray-400 dark:text-gray-600"
      )}>
        <span className={cn(
          "inline-flex items-center justify-center w-5 h-5",
          isToday && "border border-rr-pink rounded-sm"
        )}>
          {dayNumber}
        </span>
      </div>

      {/* Session cards */}
      {sessions.length > 0 && (
        <div className="flex-1 flex flex-col gap-0.5 min-w-0 overflow-hidden">
          {sessions.map((session) => {
            const sessionSquads = getSquadsForSession(session);
            const primaryColor = sessionSquads[0]?.colour || "#9CA3AF";

            return (
              <div
                key={session.id}
                className="flex items-center gap-1 rounded-sm px-1 py-0.5 min-h-[24px] hover:brightness-95 transition-all cursor-pointer"
                style={{
                  backgroundColor: `${primaryColor}18`,
                  borderLeft: `3px solid ${primaryColor}`,
                }}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.setData("text/session-id", session.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSessionClick?.(session.id);
                }}
              >
                {/* Squad dots */}
                <div className="flex gap-0.5 flex-shrink-0">
                  {sessionSquads.map((squad) => (
                    <SquadBadge
                      key={squad.id}
                      name={squad.name}
                      colour={squad.colour}
                      size="xs"
                    />
                  ))}
                </div>

                {/* Time */}
                <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {formatTimeShort(session.start_time)}
                </span>

                {/* Specialist coach (first name only) */}
                {session.specialist_coaches?.[0] && (
                  <span className="text-[10px] text-gray-500 truncate">
                    {session.specialist_coaches[0].name.split(" ")[0]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-session popover */}
      {showPopover && sessions.length > 1 && (
        <div
          ref={popoverRef}
          className="absolute top-full left-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[180px] mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[10px] text-gray-400 font-semibold mb-1 px-1">
            {sessions.length} sessions
          </p>
          {sessions.map((session) => {
            const sessionSquads = getSquadsForSession(session);
            return (
              <button
                key={session.id}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                onClick={() => {
                  setShowPopover(false);
                  onSessionClick?.(session.id);
                }}
              >
                <div className="flex gap-0.5">
                  {sessionSquads.map((sq) => (
                    <SquadBadge key={sq.id} name={sq.name} colour={sq.colour} size="xs" />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {formatTimeShort(session.start_time)}–{formatTimeShort(session.end_time)}
                </span>
                {session.theme && (
                  <span className="text-[10px] text-gray-500 truncate">{session.theme}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
