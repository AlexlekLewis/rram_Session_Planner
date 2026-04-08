"use client";

import { LANES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function LaneHeader() {
  return (
    <div
      className="grid gap-0"
      style={{
        gridTemplateColumns: `repeat(${LANES.length}, 1fr)`,
      }}
    >
      {LANES.map((lane) => {
        const isMachine = lane.type === "bowling_machine";
        const isOther = lane.type === "other";

        return (
          <div
            key={lane.id}
            className={cn(
              "px-3 py-3 border-r border-gray-200 text-center",
              isMachine && "bg-blue-50",
              isOther && "bg-gray-50",
              !isMachine && !isOther && "bg-white"
            )}
          >
            <div className="font-semibold text-sm text-gray-900">
              {lane.short}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {isMachine ? "Machine" : isOther ? "Other" : "Lane"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
