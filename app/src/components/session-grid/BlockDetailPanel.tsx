"use client";

import { useState, useEffect } from "react";
import { SessionBlock, BlockCategory, Tier } from "@/lib/types";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLOURS,
  TIER_LABELS,
  TIER_COLOURS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface BlockDetailPanelProps {
  block: SessionBlock;
  onUpdate: (id: string, updates: Partial<SessionBlock>) => void;
  onClose: () => void;
}

export function BlockDetailPanel({
  block,
  onUpdate,
  onClose,
}: BlockDetailPanelProps) {
  // Local state for all editable fields
  const [name, setName] = useState(block.name);
  const [coachingNotes, setCoachingNotes] = useState(
    block.coaching_notes || ""
  );
  const [coachingPoints, setCoachingPoints] = useState([
    ...(block.coaching_points || []),
  ]);
  const [coachAssigned, setCoachAssigned] = useState(
    block.coach_assigned || ""
  );
  const [playerGroups, setPlayerGroups] = useState([
    ...(block.player_groups || []),
  ]);
  const [equipment, setEquipment] = useState([...(block.equipment || [])]);
  const [otherLocation, setOtherLocation] = useState(
    block.other_location || ""
  );
  const [category, setCategory] = useState(block.category);
  const [tier, setTier] = useState(block.tier);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPlayerGroups, setIsEditingPlayerGroups] = useState(false);
  const [isEditingEquipment, setIsEditingEquipment] = useState(false);

  // Debounced update function
  const debouncedUpdate = useDebounce(
    (updates: Partial<SessionBlock>) => {
      onUpdate(block.id, updates);
    },
    300
  );

  // Update on name change
  useEffect(() => {
    if (name !== block.name) {
      debouncedUpdate({ name });
    }
  }, [name, block.name, debouncedUpdate]);

  // Update on coaching notes change
  useEffect(() => {
    if (coachingNotes !== (block.coaching_notes || "")) {
      debouncedUpdate({ coaching_notes: coachingNotes });
    }
  }, [coachingNotes, block.coaching_notes, debouncedUpdate]);

  // Update on coaching points change
  useEffect(() => {
    if (JSON.stringify(coachingPoints) !== JSON.stringify(block.coaching_points)) {
      debouncedUpdate({ coaching_points: coachingPoints });
    }
  }, [coachingPoints, block.coaching_points, debouncedUpdate]);

  // Update on coach assigned change
  useEffect(() => {
    if (coachAssigned !== (block.coach_assigned || "")) {
      debouncedUpdate({ coach_assigned: coachAssigned });
    }
  }, [coachAssigned, block.coach_assigned, debouncedUpdate]);

  // Update on player groups change
  useEffect(() => {
    if (JSON.stringify(playerGroups) !== JSON.stringify(block.player_groups)) {
      debouncedUpdate({ player_groups: playerGroups });
    }
  }, [playerGroups, block.player_groups, debouncedUpdate]);

  // Update on equipment change
  useEffect(() => {
    if (JSON.stringify(equipment) !== JSON.stringify(block.equipment)) {
      debouncedUpdate({ equipment });
    }
  }, [equipment, block.equipment, debouncedUpdate]);

  // Update on other location change
  useEffect(() => {
    if (otherLocation !== (block.other_location || "")) {
      debouncedUpdate({ other_location: otherLocation });
    }
  }, [otherLocation, block.other_location, debouncedUpdate]);

  // Handle category change
  const handleCategoryChange = (newCategory: BlockCategory) => {
    setCategory(newCategory);
    onUpdate(block.id, {
      category: newCategory,
      colour: CATEGORY_COLOURS[newCategory],
    });
  };

  // Handle tier change
  const handleTierChange = (newTier: Tier) => {
    setTier(newTier);
    onUpdate(block.id, { tier: newTier });
  };

  // Handle coaching point operations
  const addCoachingPoint = () => {
    setCoachingPoints([...coachingPoints, ""]);
  };

  const updateCoachingPoint = (index: number, value: string) => {
    const updated = [...coachingPoints];
    updated[index] = value;
    setCoachingPoints(updated);
  };

  const removeCoachingPoint = (index: number) => {
    setCoachingPoints(coachingPoints.filter((_, i) => i !== index));
  };

  // Handle tag operations for player groups
  const handlePlayerGroupsChange = (input: string) => {
    const groups = input
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0);
    setPlayerGroups(groups);
  };

  // Handle tag operations for equipment
  const handleEquipmentChange = (input: string) => {
    const equip = input
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    setEquipment(equip);
  };

  const removePlayerGroup = (index: number) => {
    setPlayerGroups(playerGroups.filter((_, i) => i !== index));
  };

  const removeEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index));
  };

  const categoryColor = CATEGORY_COLOURS[category];

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-25",
        "bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl",
        "transform transition-all duration-300 ease-out",
        "max-h-[300px] overflow-y-auto"
      )}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        {/* Left: Block name, category, tier */}
        <div className="flex items-center gap-4 flex-1">
          {isEditingName ? (
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingName(false);
              }}
              className="text-lg font-bold font-montserrat px-2 py-1 rounded border border-pink-400 focus:outline-none focus:border-pink-600 dark:bg-gray-700 dark:text-white"
            />
          ) : (
            <h3
              onClick={() => setIsEditingName(true)}
              className="text-lg font-bold font-montserrat text-gray-900 dark:text-white cursor-pointer hover:text-pink-600 transition-colors"
            >
              {name}
            </h3>
          )}

          {/* Category dot + label */}
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: categoryColor }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-montserrat">
              {CATEGORY_LABELS[category]}
            </span>
          </div>

          {/* Tier badge */}
          <div
            className="px-3 py-1 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: TIER_COLOURS[tier] }}
          >
            {tier}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="ml-4 p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          aria-label="Close block detail panel"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex px-6 py-4 gap-6">
        {/* Left Column (60%) */}
        <div className="flex-[3] space-y-4">
          {/* Coaching Notes */}
          <div className="space-y-2">
            <label className="block text-sm font-bold font-montserrat text-gray-900 dark:text-gray-200">
              Coaching Notes
            </label>
            <textarea
              value={coachingNotes}
              onChange={(e) => setCoachingNotes(e.target.value)}
              placeholder="Add coaching notes for this block..."
              className="w-full px-3 py-2 text-sm font-montserrat border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 resize-none dark:bg-gray-700 dark:text-white"
              rows={3}
            />
          </div>

          {/* Coaching Points */}
          <div className="space-y-2">
            <label className="block text-sm font-bold font-montserrat text-gray-900 dark:text-gray-200">
              Coaching Points
            </label>
            <div className="space-y-2">
              {coachingPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">•</span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => updateCoachingPoint(idx, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm font-montserrat border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter coaching point"
                  />
                  <button
                    onClick={() => removeCoachingPoint(idx)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    aria-label="Remove coaching point"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addCoachingPoint}
              className="mt-2 px-3 py-1 text-xs font-bold font-montserrat text-pink-600 hover:bg-pink-50 rounded transition-colors"
            >
              + Add Point
            </button>
          </div>
        </div>

        {/* Right Column (40%) */}
        <div className="flex-[2] space-y-4">
          {/* Coach Assigned */}
          <div className="space-y-2">
            <label className="block text-sm font-bold font-montserrat text-gray-900 dark:text-gray-200">
              Coach Assigned
            </label>
            <input
              type="text"
              value={coachAssigned}
              onChange={(e) => setCoachAssigned(e.target.value)}
              className="w-full px-3 py-2 text-sm font-montserrat border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., John Smith"
            />
          </div>

          {/* Player Groups */}
          <div className="space-y-2">
            <label className="block text-sm font-bold font-montserrat text-gray-900 dark:text-gray-200">
              Player Groups
            </label>
            {isEditingPlayerGroups ? (
              <input
                autoFocus
                type="text"
                value={playerGroups.join(", ")}
                onChange={(e) => handlePlayerGroupsChange(e.target.value)}
                onBlur={() => setIsEditingPlayerGroups(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingPlayerGroups(false);
                }}
                placeholder="Enter groups separated by commas"
                className="w-full px-3 py-2 text-sm font-montserrat border border-pink-400 rounded focus:outline-none focus:border-pink-600"
              />
            ) : (
              <div
                onClick={() => setIsEditingPlayerGroups(true)}
                className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:border-pink-400 transition-colors min-h-[36px]"
              >
                {playerGroups.length > 0 ? (
                  playerGroups.map((group, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-montserrat"
                    >
                      {group}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removePlayerGroup(idx);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">Click to add groups</span>
                )}
              </div>
            )}
          </div>

          {/* Equipment */}
          <div className="space-y-2">
            <label className="block text-sm font-bold font-montserrat text-gray-900 dark:text-gray-200">
              Equipment
            </label>
            {isEditingEquipment ? (
              <input
                autoFocus
                type="text"
                value={equipment.join(", ")}
                onChange={(e) => handleEquipmentChange(e.target.value)}
                onBlur={() => setIsEditingEquipment(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsEditingEquipment(false);
                }}
                placeholder="Enter equipment separated by commas"
                className="w-full px-3 py-2 text-sm font-montserrat border border-pink-400 rounded focus:outline-none focus:border-pink-600"
              />
            ) : (
              <div
                onClick={() => setIsEditingEquipment(true)}
                className="flex flex-wrap gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:border-pink-400 transition-colors min-h-[36px]"
              >
                {equipment.length > 0 ? (
                  equipment.map((item, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-montserrat"
                    >
                      {item}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEquipment(idx);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-400 text-xs">Click to add equipment</span>
                )}
              </div>
            )}
          </div>

          {/* Other Location - only visible if lane_end >= 8 */}
          {block.lane_end >= 8 && (
            <div className="space-y-2">
              <label className="block text-sm font-bold font-montserrat text-gray-900 dark:text-gray-200">
                Other Location
              </label>
              <input
                type="text"
                value={otherLocation}
                onChange={(e) => setOtherLocation(e.target.value)}
                placeholder="e.g., Back of nets"
                className="w-full px-3 py-2 text-sm font-montserrat border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* Category Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-bold font-montserrat text-gray-900 dark:text-gray-200">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as BlockCategory)}
              className="w-full px-3 py-2 text-sm font-montserrat border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 dark:bg-gray-700 dark:text-white"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Tier Radio Buttons */}
          <div className="space-y-2">
            <label className="block text-sm font-bold font-montserrat text-gray-900 dark:text-gray-200">
              Tier
            </label>
            <div className="flex gap-3">
              {(["R", "P", "E", "G"] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tier"
                    value={t}
                    checked={tier === t}
                    onChange={(e) => handleTierChange(e.target.value as Tier)}
                    className="w-4 h-4"
                  />
                  <span
                    className="text-xs font-bold font-montserrat px-2 py-1 rounded text-white"
                    style={{ backgroundColor: TIER_COLOURS[t] }}
                  >
                    {t} {TIER_LABELS[t]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
