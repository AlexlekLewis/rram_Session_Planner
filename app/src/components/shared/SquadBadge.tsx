"use client";

import { cn } from "@/lib/utils";

interface SquadBadgeProps {
  name: string;
  colour: string;
  size?: "xs" | "sm" | "md";
}

export function SquadBadge({ name, colour, size = "md" }: SquadBadgeProps) {
  if (size === "xs") {
    // Compact dot with single character
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
    <span
      className={cn(
        "inline-block rounded-full font-semibold text-white whitespace-nowrap",
        "font-montserrat",
        sizeClasses[size]
      )}
      style={{ backgroundColor: colour }}
    >
      {name}
    </span>
  );
}
