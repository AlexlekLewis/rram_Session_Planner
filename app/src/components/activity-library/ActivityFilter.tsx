"use client";

import { ALL_CATEGORIES, CATEGORY_LABELS, TIER_COLOURS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ActivityFilterProps {
  category: string;
  onCategoryChange: (cat: string) => void;
  activeTiers: Set<string>;
  onTierToggle: (tier: string) => void;
}

export function ActivityFilter({
  category,
  onCategoryChange,
  activeTiers,
  onTierToggle,
}: ActivityFilterProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Category Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={cn(
            "w-full px-3 py-2 rounded-lg",
            "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm",
            "text-gray-900 dark:text-white font-medium",
            "focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            "outline-none transition-colors"
          )}
        >
          <option value="all">All Categories</option>
          {ALL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Tier Toggles */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Tier
        </label>
        <div className="flex gap-2">
          {(["R", "P", "E", "G"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => onTierToggle(tier)}
              className={cn(
                "w-8 h-8 rounded-lg font-semibold text-xs",
                "transition-all duration-200",
                activeTiers.has(tier)
                  ? "text-white border-0 shadow-sm hover:shadow-md"
                  : "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
              )}
              style={{
                backgroundColor: activeTiers.has(tier)
                  ? TIER_COLOURS[tier]
                  : "transparent",
              }}
              title={
                tier === "R"
                  ? "Regression"
                  : tier === "P"
                    ? "Progression"
                    : tier === "E"
                      ? "Elite"
                      : "Gamify"
              }
            >
              {tier}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
