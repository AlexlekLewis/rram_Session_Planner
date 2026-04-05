"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Player } from "@/lib/types";
import { Users, X } from "lucide-react";

interface SquadBadgeProps {
  name: string;
  colour: string;
  size?: "xs" | "sm" | "md";
  squadId?: string;
  players?: Player[];
}

export function SquadBadge({ name, colour, size = "md", squadId, players }: SquadBadgeProps) {
  const [showRoster, setShowRoster] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showRoster) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          badgeRef.current && !badgeRef.current.contains(e.target as Node)) {
        setShowRoster(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showRoster]);

  // Get players for this squad
  const squadPlayers = players && squadId
    ? players.filter(p => p.squad_ids.includes(squadId)).sort((a, b) => a.last_name.localeCompare(b.last_name))
    : [];

  const canShowRoster = squadId && players && players.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (!canShowRoster) return;
    e.stopPropagation();
    e.preventDefault();
    setShowRoster(!showRoster);
  };

  if (size === "xs") {
    const initial = name.replace("Squad ", "");
    return (
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold text-white font-montserrat flex-shrink-0"
        style={{ backgroundColor: colour }}
        title={name}
      >
        {initial}
      </span>
    );
  }

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <span className="relative inline-block" ref={badgeRef}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-semibold text-white whitespace-nowrap",
          "font-montserrat",
          sizeClasses[size],
          canShowRoster && "cursor-pointer hover:opacity-90 transition-opacity"
        )}
        style={{ backgroundColor: colour }}
        onClick={handleClick}
      >
        {name}
        {canShowRoster && (
          <span className="inline-flex items-center gap-0.5 bg-white/20 rounded-full px-1.5 py-0.5 text-[10px]">
            <Users className="w-2.5 h-2.5" />
            {squadPlayers.length}
          </span>
        )}
      </span>

      {/* Player roster popover */}
      {showRoster && (
        <div
          ref={popoverRef}
          className="absolute z-50 top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: colour }}
          >
            <div>
              <h3 className="text-white font-bold text-sm">{name}</h3>
              <p className="text-white/80 text-xs">{squadPlayers.length} players</p>
            </div>
            <button
              onClick={() => setShowRoster(false)}
              className="text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Player list */}
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {squadPlayers.length === 0 ? (
              <div className="px-4 py-3 text-xs text-gray-400">No players assigned</div>
            ) : (
              squadPlayers.map((player) => (
                <div key={player.id} className="px-4 py-2 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {player.first_name} {player.last_name}
                    </span>
                    {player.club && (
                      <span className="block text-[10px] text-gray-400 truncate max-w-[200px]">
                        {player.club}
                      </span>
                    )}
                  </div>
                  {player.cricket_type && (
                    <span className={cn(
                      "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                      player.cricket_type === "female"
                        ? "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      {player.cricket_type === "female" ? "F" : "M"}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </span>
  );
}
