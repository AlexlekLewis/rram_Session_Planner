"use client";

import { useEffect, useState } from "react";
import { Activity, Tier } from "@/lib/types";
import { TIER_COLOURS, TIER_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface TierSelectorProps {
  activity: Activity;
  position: { x: number; y: number };
  onSelect: (tier: Tier) => void;
  onCancel: () => void;
}

export function TierSelector({
  activity,
  position,
  onSelect,
  onCancel,
}: TierSelectorProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Check which tiers have data
  const tierAvailable = {
    R: activity.regression && Object.keys(activity.regression).some((k) => activity.regression[k as keyof typeof activity.regression]),
    P: activity.progression && Object.keys(activity.progression).some((k) => activity.progression[k as keyof typeof activity.progression]),
    E: activity.elite && Object.keys(activity.elite).some((k) => activity.elite[k as keyof typeof activity.elite]),
    G: activity.gamify && Object.keys(activity.gamify).some((k) => activity.gamify[k as keyof typeof activity.gamify]),
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onCancel}
      />

      {/* Popover */}
      <div
        className={cn(
          "fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl",
          "border border-gray-200 dark:border-gray-700",
          "max-w-xs"
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {activity.name}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close tier selector"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Tier Options */}
        <div className="p-4 space-y-2">
          {(["R", "P", "E", "G"] as const).map((tier) => {
            const isAvailable = tierAvailable[tier];
            const tierDetail = {
              R: activity.regression,
              P: activity.progression,
              E: activity.elite,
              G: activity.gamify,
            }[tier];

            const firstLineDescription = tierDetail?.description
              ? tierDetail.description.split("\n")[0]
              : "";

            return (
              <button
                key={tier}
                onClick={() => {
                  if (isAvailable) {
                    onSelect(tier);
                    setIsVisible(false);
                  }
                }}
                disabled={!isAvailable}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all",
                  isAvailable
                    ? "border-gray-200 dark:border-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-50"
                )}
              >
                {/* Tier badge + name */}
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      "text-white font-semibold text-xs"
                    )}
                    style={{ backgroundColor: TIER_COLOURS[tier] }}
                  >
                    {tier}
                  </div>
                  <span
                    className={cn(
                      "font-semibold text-sm",
                      isAvailable ? "text-gray-900 dark:text-white" : "text-gray-400"
                    )}
                  >
                    {TIER_LABELS[tier]}
                  </span>
                </div>

                {/* Description snippet */}
                {firstLineDescription && (
                  <p
                    className={cn(
                      "text-xs line-clamp-2 pl-8",
                      isAvailable ? "text-gray-600" : "text-gray-400"
                    )}
                  >
                    {firstLineDescription}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Cancel button */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <button
            onClick={onCancel}
            className={cn(
              "w-full px-4 py-2 rounded-lg text-sm font-medium",
              "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
              "hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            )}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
