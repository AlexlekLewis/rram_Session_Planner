"use client";

import { cn } from "@/lib/utils";

interface SaveIndicatorProps {
  status: "saved" | "saving" | "error" | "offline";
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  const statusConfig = {
    saved: {
      icon: "✓",
      text: "Saved",
      colour: "#22C55E",
      bgColour: "bg-green-50 dark:bg-green-900/30",
    },
    saving: {
      icon: "◌",
      text: "Saving...",
      colour: "#3B82F6",
      bgColour: "bg-blue-50 dark:bg-blue-900/30",
    },
    error: {
      icon: "!",
      text: "Error",
      colour: "#EF4444",
      bgColour: "bg-red-50 dark:bg-red-900/30",
    },
    offline: {
      icon: "⊗",
      text: "Offline",
      colour: "#F59E0B",
      bgColour: "bg-yellow-50 dark:bg-yellow-900/30",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2",
        "px-2.5 py-1.5 rounded-md",
        "text-xs font-medium",
        "font-montserrat",
        config.bgColour
      )}
      style={{ color: config.colour }}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center",
          "w-4 h-4 rounded-full",
          status === "saving" && "animate-spin"
        )}
        style={{ backgroundColor: config.colour, color: "white" }}
      >
        <span className="text-xs leading-none font-bold">{config.icon}</span>
      </span>
      {config.text}
    </div>
  );
}
