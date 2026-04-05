"use client";

import { useRouter } from "next/navigation";
import { Session, Squad, Player } from "@/lib/types";
import { formatTime } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { SquadBadge } from "@/components/shared/SquadBadge";

interface SessionCardProps {
  session: Session;
  squads: Squad[];
  players?: Player[];
}

export function SessionCard({ session, squads, players }: SessionCardProps) {
  const router = useRouter();

  // Get squad data for this session
  const sessionSquads = session.squad_ids
    .map((squadId) => squads.find((s) => s.id === squadId))
    .filter(Boolean) as Squad[];

  // Format date and day
  const dateObj = new Date(session.date);
  const dayName = dateObj.toLocaleDateString("en-AU", { weekday: "short" });
  const dateStr = dateObj.toLocaleDateString("en-AU", {
    month: "short",
    day: "numeric",
  });

  // Status indicator color
  const statusColor = {
    draft: "bg-amber-400",
    published: "bg-green-500",
    completed: "bg-blue-500",
  }[session.status];

  const handleClick = () => {
    router.push(`/dashboard/session/${session.id}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200",
        "hover:border-rr-blue hover:shadow-md hover:bg-blue-50 dark:hover:bg-gray-700 active:bg-blue-100 dark:active:bg-gray-600",
        "bg-white dark:bg-gray-800"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left side: Date and time */}
        <div className="flex-shrink-0">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {dayName.toUpperCase()}
          </div>
          <div className="text-sm font-bold text-rr-charcoal dark:text-white">{dateStr}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatTime(session.start_time)} - {formatTime(session.end_time)}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex-shrink-0">
          <div className={cn("w-3 h-3 rounded-full", statusColor)} />
        </div>
      </div>

      {/* Session theme */}
      <div className="mt-3">
        <h3 className="font-semibold text-sm text-rr-charcoal dark:text-white line-clamp-2">
          {session.theme || "Untitled Session"}
        </h3>
      </div>

      {/* Squads */}
      {sessionSquads.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {sessionSquads.map((squad) => (
            <SquadBadge key={squad.id} name={squad.name} colour={squad.colour} size="sm" squadId={squad.id} players={players} />
          ))}
        </div>
      )}

      {/* Specialist coaches */}
      {session.specialist_coaches && session.specialist_coaches.length > 0 && (
        <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">Coaches:</span>{" "}
          {session.specialist_coaches.map((coach) => coach.name).join(", ")}
        </div>
      )}
    </button>
  );
}
