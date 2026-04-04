"use client";

import { useEffect, useRef, useState } from "react";
import { BlockCategory, Tier } from "@/lib/types";
import {
  LANES,
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  TIER_LABELS,
  TIER_COLOURS,
  formatTime,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CreateBlockModalProps {
  position: { x: number; y: number };
  laneStart: number;
  laneEnd: number;
  timeStart: string;
  timeEnd: string;
  onConfirm: (data: {
    name: string;
    category: BlockCategory;
    tier: Tier;
    coachAssigned?: string;
    otherLocation?: string;
  }) => void;
  onCancel: () => void;
}

export function CreateBlockModal({
  position,
  laneStart,
  laneEnd,
  timeStart,
  timeEnd,
  onConfirm,
  onCancel,
}: CreateBlockModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BlockCategory>("batting");
  const [tier, setTier] = useState<Tier>("R");
  const [coach, setCoach] = useState("");
  const [location, setLocation] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Autofocus on name input
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Get lane names for display
  const getLaneName = (laneId: number) => {
    return LANES.find((l) => l.id === laneId)?.short || `Lane ${laneId}`;
  };

  const laneDisplay = `${getLaneName(laneStart)}-${getLaneName(laneEnd)}`;
  const timeDisplay = `${formatTime(timeStart)}-${formatTime(timeEnd)}`;

  // Should show location field if selection includes "Other Location" lane (id 8)
  const showLocationField = laneEnd >= 8;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onConfirm({
      name: name.trim(),
      category,
      tier,
      coachAssigned: coach.trim() || undefined,
      otherLocation: showLocationField && location.trim() ? location.trim() : undefined,
    });
  };

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      handleSubmit(e as React.FormEvent);
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        minWidth: "320px",
      }}
    >
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white font-montserrat">
            New Activity Block
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-montserrat">
            {laneDisplay} · {timeDisplay}
          </p>
        </div>

        {/* Activity Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 font-montserrat">
            Activity Name
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleEnter}
            placeholder="e.g., 360 Drill"
            className={cn(
              "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white",
              "focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent",
              "font-montserrat"
            )}
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 font-montserrat">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as BlockCategory)}
            className={cn(
              "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white",
              "focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent",
              "font-montserrat appearance-none bg-white dark:bg-gray-700 dark:text-white",
              "cursor-pointer"
            )}
          >
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        {/* Tier Radio Buttons */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2 font-montserrat">
            Tier
          </label>
          <div className="flex gap-3">
            {(["R", "P", "E", "G"] as const).map((tierOption) => (
              <label
                key={tierOption}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  value={tierOption}
                  checked={tier === tierOption}
                  onChange={(e) => setTier(e.target.value as Tier)}
                  className="cursor-pointer"
                />
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    "font-semibold text-white text-xs font-montserrat"
                  )}
                  style={{ backgroundColor: TIER_COLOURS[tierOption] }}
                >
                  {tierOption}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400 font-montserrat">
                  {TIER_LABELS[tierOption]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Coach Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 font-montserrat">
            Coach
          </label>
          <input
            type="text"
            value={coach}
            onChange={(e) => setCoach(e.target.value)}
            onKeyDown={handleEnter}
            placeholder="e.g., Alex Lewis"
            className={cn(
              "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white",
              "focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent",
              "font-montserrat"
            )}
          />
        </div>

        {/* Location Input - Only show if laneEnd >= 8 */}
        {showLocationField && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 font-montserrat">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleEnter}
              placeholder="e.g., Back of nets"
              className={cn(
                "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent",
                "font-montserrat"
              )}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-semibold rounded",
              "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors",
              "font-montserrat"
            )}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-semibold rounded",
              "text-white transition-colors font-montserrat",
              name.trim()
                ? "bg-pink-500 hover:bg-pink-600 cursor-pointer"
                : "bg-gray-300 cursor-not-allowed"
            )}
            style={
              name.trim()
                ? { backgroundColor: "#E11F8F" }
                : { backgroundColor: "#D1D5DB" }
            }
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
