"use client";

import { useState, useEffect, useMemo } from "react";
import { SessionBlock, BlockCategory, Tier, BlockPosition } from "@/lib/types";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLOURS,
  TIER_LABELS,
  TIER_COLOURS,
  LANES,
  TIME_INCREMENT_MINUTES,
  formatTime,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { X } from "lucide-react";

/**
 * Block Detail Modal.
 *
 * Centered modal replacement for the previous bottom-sheet panel. The sheet
 * form-factor overwhelmed the session planner visually (took ~300px of
 * vertical space) and had an inconsistent dismiss contract — no Escape,
 * no backdrop click. This centered-modal rewrite:
 *
 *   - Dismisses on Escape, backdrop click (target-guarded), and the X button.
 *   - Exposes manual inputs for time_start, time_end, lane_start, lane_end
 *     (previously reshaping a block was drag-only; users lost sub-5-min
 *     precision and couldn't touch-type lane moves).
 *   - Validates position edits against hasCollision before committing — the
 *     same rule the drag path already enforces, so there's a single source
 *     of truth for block placement.
 */

interface BlockDetailPanelProps {
  block: SessionBlock;
  /** Session bounds so time inputs clamp to the valid window. */
  sessionStart: string;
  sessionEnd: string;
  onUpdate: (id: string, updates: Partial<SessionBlock>) => void;
  onClose: () => void;
  /** Same collision check the grid drag path uses — kept consistent. */
  hasCollision: (position: BlockPosition, excludeId?: string) => boolean;
}

/** Convert "HH:MM" → minutes since 00:00. Numeric so comparisons are safe. */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Round minutes-since-midnight up/down to the grid's time increment. */
function snapMinutes(mins: number): number {
  return Math.round(mins / TIME_INCREMENT_MINUTES) * TIME_INCREMENT_MINUTES;
}

/** Minutes since midnight → "HH:MM". */
function minutesToTime(mins: number): string {
  const clamped = Math.max(0, mins);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function BlockDetailPanel({
  block,
  sessionStart,
  sessionEnd,
  onUpdate,
  onClose,
  hasCollision,
}: BlockDetailPanelProps) {
  // -----------------------------------------------------------------------
  // Local state — all editable fields
  // -----------------------------------------------------------------------
  const [name, setName] = useState(block.name);
  const [coachingNotes, setCoachingNotes] = useState(block.coaching_notes || "");
  const [coachingPoints, setCoachingPoints] = useState([...(block.coaching_points || [])]);
  const [coachAssigned, setCoachAssigned] = useState(block.coach_assigned || "");
  const [playerGroups, setPlayerGroups] = useState([...(block.player_groups || [])]);
  const [equipment, setEquipment] = useState([...(block.equipment || [])]);
  const [otherLocation, setOtherLocation] = useState(block.other_location || "");
  const [category, setCategory] = useState(block.category);
  const [tier, setTier] = useState(block.tier);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPlayerGroups, setIsEditingPlayerGroups] = useState(false);
  const [isEditingEquipment, setIsEditingEquipment] = useState(false);

  // Manual time/lane editing — draft values + validation error surface.
  // Kept as local strings so invalid typing doesn't corrupt block state;
  // we only push to onUpdate after a full validation pass.
  const [timeStart, setTimeStart] = useState(block.time_start);
  const [timeEnd, setTimeEnd] = useState(block.time_end);
  const [laneStart, setLaneStart] = useState(block.lane_start);
  const [laneEnd, setLaneEnd] = useState(block.lane_end);
  const [positionError, setPositionError] = useState<string | null>(null);

  // Keep local state in sync if the upstream block changes (e.g. realtime edit by another coach)
  useEffect(() => {
    setTimeStart(block.time_start);
    setTimeEnd(block.time_end);
    setLaneStart(block.lane_start);
    setLaneEnd(block.lane_end);
    setPositionError(null);
  }, [block.id, block.time_start, block.time_end, block.lane_start, block.lane_end]);

  // Debounced update function — prevents save churn on every keystroke
  const debouncedUpdate = useDebounce(
    (updates: Partial<SessionBlock>) => {
      onUpdate(block.id, updates);
    },
    300
  );

  // -----------------------------------------------------------------------
  // Dismiss contract — Escape closes the modal.
  // -----------------------------------------------------------------------
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // -----------------------------------------------------------------------
  // Field-level effect hooks — debounced persistence for text fields
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (name !== block.name) debouncedUpdate({ name });
  }, [name, block.name, debouncedUpdate]);

  useEffect(() => {
    if (coachingNotes !== (block.coaching_notes || "")) {
      debouncedUpdate({ coaching_notes: coachingNotes });
    }
  }, [coachingNotes, block.coaching_notes, debouncedUpdate]);

  useEffect(() => {
    if (JSON.stringify(coachingPoints) !== JSON.stringify(block.coaching_points)) {
      debouncedUpdate({ coaching_points: coachingPoints });
    }
  }, [coachingPoints, block.coaching_points, debouncedUpdate]);

  useEffect(() => {
    if (coachAssigned !== (block.coach_assigned || "")) {
      debouncedUpdate({ coach_assigned: coachAssigned });
    }
  }, [coachAssigned, block.coach_assigned, debouncedUpdate]);

  useEffect(() => {
    if (JSON.stringify(playerGroups) !== JSON.stringify(block.player_groups)) {
      debouncedUpdate({ player_groups: playerGroups });
    }
  }, [playerGroups, block.player_groups, debouncedUpdate]);

  useEffect(() => {
    if (JSON.stringify(equipment) !== JSON.stringify(block.equipment)) {
      debouncedUpdate({ equipment });
    }
  }, [equipment, block.equipment, debouncedUpdate]);

  useEffect(() => {
    if (otherLocation !== (block.other_location || "")) {
      debouncedUpdate({ other_location: otherLocation });
    }
  }, [otherLocation, block.other_location, debouncedUpdate]);

  // Category / tier fire debounced too — previously they fired on every
  // click which caused multiple saves for rapid radio clicks.
  const handleCategoryChange = (newCategory: BlockCategory) => {
    setCategory(newCategory);
    debouncedUpdate({
      category: newCategory,
      colour: CATEGORY_COLOURS[newCategory],
    });
  };

  const handleTierChange = (newTier: Tier) => {
    setTier(newTier);
    debouncedUpdate({ tier: newTier });
  };

  // -----------------------------------------------------------------------
  // Manual time/lane commit handlers
  //
  // Validates the draft position against the session bounds, numeric time
  // order, lane order, and existing-blocks collision. On success, commits
  // via onUpdate (instant, not debounced — these are explicit user actions
  // via blur/change on discrete controls, not typing).
  // -----------------------------------------------------------------------
  const sessionStartMins = useMemo(() => timeToMinutes(sessionStart), [sessionStart]);
  const sessionEndMins = useMemo(() => timeToMinutes(sessionEnd), [sessionEnd]);

  const commitPosition = (next: {
    timeStart: string;
    timeEnd: string;
    laneStart: number;
    laneEnd: number;
  }) => {
    const startMins = snapMinutes(timeToMinutes(next.timeStart));
    const endMins = snapMinutes(timeToMinutes(next.timeEnd));

    if (Number.isNaN(startMins) || Number.isNaN(endMins)) {
      setPositionError("Invalid time format");
      return;
    }
    if (startMins >= endMins) {
      setPositionError("Start time must be before end time");
      return;
    }
    if (startMins < sessionStartMins || endMins > sessionEndMins) {
      setPositionError(
        `Block must stay between ${formatTime(sessionStart)} and ${formatTime(sessionEnd)}`
      );
      return;
    }
    if (next.laneStart > next.laneEnd) {
      setPositionError("Start lane must be ≤ end lane");
      return;
    }

    const snappedStart = minutesToTime(startMins);
    const snappedEnd = minutesToTime(endMins);

    const collision = hasCollision(
      {
        laneStart: next.laneStart,
        laneEnd: next.laneEnd,
        timeStart: snappedStart,
        timeEnd: snappedEnd,
      },
      block.id
    );
    if (collision) {
      setPositionError("That slot overlaps another block");
      return;
    }

    setPositionError(null);
    // Reflect the snapped values back into local state so the UI matches
    // what was persisted (user typed 5:07 → snapped to 5:05).
    setTimeStart(snappedStart);
    setTimeEnd(snappedEnd);
    onUpdate(block.id, {
      time_start: snappedStart,
      time_end: snappedEnd,
      lane_start: next.laneStart,
      lane_end: next.laneEnd,
    });
  };

  // -----------------------------------------------------------------------
  // Coaching point operations
  // -----------------------------------------------------------------------
  const addCoachingPoint = () => setCoachingPoints([...coachingPoints, ""]);
  const updateCoachingPoint = (index: number, value: string) => {
    const updated = [...coachingPoints];
    updated[index] = value;
    setCoachingPoints(updated);
  };
  const removeCoachingPoint = (index: number) =>
    setCoachingPoints(coachingPoints.filter((_, i) => i !== index));

  const handlePlayerGroupsChange = (input: string) => {
    const groups = input.split(",").map((g) => g.trim()).filter((g) => g.length > 0);
    setPlayerGroups(groups);
  };
  const handleEquipmentChange = (input: string) => {
    const equip = input.split(",").map((e) => e.trim()).filter((e) => e.length > 0);
    setEquipment(equip);
  };
  const removePlayerGroup = (index: number) =>
    setPlayerGroups(playerGroups.filter((_, i) => i !== index));
  const removeEquipment = (index: number) =>
    setEquipment(equipment.filter((_, i) => i !== index));

  const categoryColor = CATEGORY_COLOURS[category];

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      onClick={(e) => {
        // Backdrop close — only if click originated on the backdrop itself.
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="block-detail-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      {/* Dialog */}
      <div
        className={cn(
          "relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700",
          "w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3 flex-1 min-w-0">
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
                className="text-base font-bold font-montserrat px-2 py-1 rounded border border-pink-400 focus:outline-none focus:border-pink-600 dark:bg-gray-700 dark:text-white min-w-0 flex-1"
              />
            ) : (
              <h3
                id="block-detail-title"
                onClick={() => setIsEditingName(true)}
                className="text-base font-bold font-montserrat text-gray-900 dark:text-white cursor-pointer hover:text-pink-600 transition-colors truncate"
                title={name}
              >
                {name}
              </h3>
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: categoryColor }}
              />
              <span className="text-xs text-gray-700 dark:text-gray-300 font-montserrat">
                {CATEGORY_LABELS[category]}
              </span>
            </div>

            <div
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: TIER_COLOURS[tier] }}
            >
              {tier}
            </div>
          </div>

          <button
            onClick={onClose}
            className="ml-3 p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors shrink-0"
            aria-label="Close block detail panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Position editor — manual time + lane inputs */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-end gap-2 flex-wrap">
            <PositionField label="Time start">
              <input
                aria-label="Time start"
                type="time"
                step={TIME_INCREMENT_MINUTES * 60}
                value={timeStart}
                min={sessionStart}
                max={sessionEnd}
                onChange={(e) => setTimeStart(e.target.value)}
                onBlur={() =>
                  commitPosition({ timeStart, timeEnd, laneStart, laneEnd })
                }
                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-400 dark:bg-gray-700 dark:text-white font-mono"
              />
            </PositionField>

            <PositionField label="Time end">
              <input
                aria-label="Time end"
                type="time"
                step={TIME_INCREMENT_MINUTES * 60}
                value={timeEnd}
                min={sessionStart}
                max={sessionEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                onBlur={() =>
                  commitPosition({ timeStart, timeEnd, laneStart, laneEnd })
                }
                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-400 dark:bg-gray-700 dark:text-white font-mono"
              />
            </PositionField>

            <PositionField label="Lane start">
              <select
                aria-label="Lane start"
                value={laneStart}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setLaneStart(v);
                  commitPosition({ timeStart, timeEnd, laneStart: v, laneEnd });
                }}
                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-400 dark:bg-gray-700 dark:text-white"
              >
                {LANES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.short}
                  </option>
                ))}
              </select>
            </PositionField>

            <PositionField label="Lane end">
              <select
                aria-label="Lane end"
                value={laneEnd}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setLaneEnd(v);
                  commitPosition({ timeStart, timeEnd, laneStart, laneEnd: v });
                }}
                className="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-pink-400 dark:bg-gray-700 dark:text-white"
              >
                {LANES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.short}
                  </option>
                ))}
              </select>
            </PositionField>
          </div>
          {positionError && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-medium" role="alert">
              {positionError}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* Left column (60%) */}
          <div className="md:col-span-3 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-montserrat text-gray-900 dark:text-gray-200">
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-montserrat text-gray-900 dark:text-gray-200">
                Coaching Points
              </label>
              <div className="space-y-1.5">
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
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      aria-label="Remove coaching point"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addCoachingPoint}
                className="mt-1 px-3 py-1 text-xs font-bold font-montserrat text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded transition-colors"
              >
                + Add Point
              </button>
            </div>
          </div>

          {/* Right column (40%) */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-montserrat text-gray-900 dark:text-gray-200">
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-montserrat text-gray-900 dark:text-gray-200">
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
                  className="w-full px-3 py-2 text-sm font-montserrat border border-pink-400 rounded focus:outline-none focus:border-pink-600 dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <div
                  onClick={() => setIsEditingPlayerGroups(true)}
                  className="flex flex-wrap gap-1.5 p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:border-pink-400 transition-colors min-h-[36px]"
                >
                  {playerGroups.length > 0 ? (
                    playerGroups.map((group, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-[11px] font-montserrat"
                      >
                        {group}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePlayerGroup(idx);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-100"
                          aria-label={`Remove ${group}`}
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-montserrat text-gray-900 dark:text-gray-200">
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
                  className="w-full px-3 py-2 text-sm font-montserrat border border-pink-400 rounded focus:outline-none focus:border-pink-600 dark:bg-gray-700 dark:text-white"
                />
              ) : (
                <div
                  onClick={() => setIsEditingEquipment(true)}
                  className="flex flex-wrap gap-1.5 p-2 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:border-pink-400 transition-colors min-h-[36px]"
                >
                  {equipment.length > 0 ? (
                    equipment.map((item, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-[11px] font-montserrat"
                      >
                        {item}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeEquipment(idx);
                          }}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-100"
                          aria-label={`Remove ${item}`}
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

            {/* Other Location — only when block extends into the 'Other' lane */}
            {block.lane_end >= 8 && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold font-montserrat text-gray-900 dark:text-gray-200">
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-montserrat text-gray-900 dark:text-gray-200">
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold font-montserrat text-gray-900 dark:text-gray-200">
                Tier
              </label>
              <div className="flex gap-2 flex-wrap">
                {(["R", "P", "E", "G"] as const).map((t) => (
                  <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="tier"
                      value={t}
                      checked={tier === t}
                      onChange={(e) => handleTierChange(e.target.value as Tier)}
                      className="w-4 h-4"
                    />
                    <span
                      className="text-[10px] font-bold font-montserrat px-2 py-0.5 rounded text-white"
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
    </div>
  );
}

/** Small labelled-field helper — keeps the position editor row tidy. */
function PositionField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold font-montserrat uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </span>
      {children}
    </div>
  );
}
