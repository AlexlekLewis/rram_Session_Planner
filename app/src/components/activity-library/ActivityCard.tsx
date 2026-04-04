"use client";

import { Activity } from "@/lib/types";
import { CATEGORY_COLOURS, TIER_COLOURS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ActivityCardProps {
  activity: Activity;
  onDragStart: (activity: Activity, e: React.DragEvent) => void;
}

export function ActivityCard({ activity, onDragStart }: ActivityCardProps) {
  const categoryColour = CATEGORY_COLOURS[activity.category] || "#D4D4D8";

  // Check which tiers have data
  const hasTierData = {
    R: activity.regression && Object.keys(activity.regression).some((k) => activity.regression[k as keyof typeof activity.regression]),
    P: activity.progression && Object.keys(activity.progression).some((k) => activity.progression[k as keyof typeof activity.progression]),
    E: activity.elite && Object.keys(activity.elite).some((k) => activity.elite[k as keyof typeof activity.elite]),
    G: activity.gamify && Object.keys(activity.gamify).some((k) => activity.gamify[k as keyof typeof activity.gamify]),
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Set drag data for grid drop
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("activity-id", activity.id);

    // Create a custom drag image
    const dragImage = new Image();
    dragImage.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60'%3E%3Crect width='100' height='60' fill='%23f3f4f6' stroke='%23d1d5db' stroke-width='1' rx='4'/%3E%3Ctext x='8' y='30' font-size='12' fill='%23111827'%3E" +
      encodeURIComponent(activity.name.substring(0, 12)) +
      "%3C/text%3E%3C/svg%3E";
    e.dataTransfer.setDragImage(dragImage, 0, 0);

    onDragStart(activity, e);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3",
        "hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all",
        "cursor-grab active:cursor-grabbing",
        "group"
      )}
    >
      {/* Category dot + Name row */}
      <div className="flex items-start gap-2 mb-1">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: categoryColour }}
        />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex-1 group-hover:text-blue-600">
          {activity.name}
        </h3>
      </div>

      {/* Sub-category */}
      {activity.sub_category && (
        <p className="text-xs text-gray-400 mb-1 pl-4">
          {activity.sub_category}
        </p>
      )}

      {/* Description */}
      {activity.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 pl-4 line-clamp-2">
          {activity.description}
        </p>
      )}

      {/* Tier badges and duration */}
      <div className="flex items-center justify-between mt-2 pl-4">
        <div className="flex gap-1">
          {(["R", "P", "E", "G"] as const).map((tier) => (
            <div
              key={tier}
              className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold",
                hasTierData[tier]
                  ? "text-white"
                  : "border border-gray-300 dark:border-gray-600 text-gray-400"
              )}
              style={{
                backgroundColor: hasTierData[tier]
                  ? TIER_COLOURS[tier]
                  : "transparent",
              }}
            >
              {tier}
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {activity.default_duration_mins}m
        </span>
      </div>
    </div>
  );
}
