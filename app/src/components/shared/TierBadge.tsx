"use client";

import { TIER_COLOURS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface TierBadgeProps {
  tier: "R" | "P" | "E" | "G";
}

export function TierBadge({ tier }: TierBadgeProps) {
  const colour = TIER_COLOURS[tier];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "w-6 h-6 rounded-full",
        "font-semibold text-white text-xs",
        "font-montserrat"
      )}
      style={{ backgroundColor: colour }}
    >
      {tier}
    </span>
  );
}
