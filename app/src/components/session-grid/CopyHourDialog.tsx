"use client";

import { useEffect, useRef, useState } from "react";
import { generateTimeSlots, formatTime } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CopyHourDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sessionStartTime: string; // e.g., "17:00"
  sessionEndTime: string; // e.g., "19:00"
  onCopyHour: (sourceStart: string, sourceEnd: string, targetStart: string) => void;
}

export function CopyHourDialog({
  isOpen,
  onClose,
  sessionStartTime,
  sessionEndTime,
  onCopyHour,
}: CopyHourDialogProps) {
  const allSlots = generateTimeSlots(sessionStartTime, sessionEndTime);
  // Every 3rd slot = 15-min increments
  const slots = allSlots.filter((_, i) => i % 3 === 0);

  // Determine default source range: first hour of session
  const firstHourEnd = getNextHourSlot(sessionStartTime, slots);
  const [sourceStart, setSourceStart] = useState(sessionStartTime);
  const [sourceEnd, setSourceEnd] = useState(firstHourEnd);
  const [targetStart, setTargetStart] = useState(firstHourEnd);

  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (isOpen) {
      // Reset to defaults when opened
      setSourceStart(sessionStartTime);
      setSourceEnd(firstHourEnd);
      setTargetStart(firstHourEnd);
    }
  }, [isOpen, sessionStartTime, firstHourEnd]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Validation: source and target must not overlap
  const sourceStartMins = timeToMinutes(sourceStart);
  const sourceEndMins = timeToMinutes(sourceEnd);
  const targetStartMins = timeToMinutes(targetStart);
  const targetEndMins = targetStartMins + (sourceEndMins - sourceStartMins);

  const overlap =
    (targetStartMins >= sourceStartMins && targetStartMins < sourceEndMins) ||
    (targetEndMins > sourceStartMins && targetEndMins <= sourceEndMins);

  const targetFitsInSession = targetEndMins <= timeToMinutes(sessionEndTime);
  const isValid = !overlap && targetFitsInSession && sourceStart < sourceEnd;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onCopyHour(sourceStart, sourceEnd, targetStart);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-[420px] w-full mx-4"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-lg font-montserrat">
              Copy Hour
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-montserrat">
              Duplicate all blocks from one time range to another. Perfect for
              group rotations.
            </p>
          </div>

          {/* Source Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 font-montserrat">
              Source Range
            </label>
            <div className="flex gap-2">
              <select
                value={sourceStart}
                onChange={(e) => setSourceStart(e.target.value)}
                className={cn(
                  "flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded",
                  "focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent",
                  "font-montserrat appearance-none bg-white dark:bg-gray-700 dark:text-white cursor-pointer"
                )}
              >
                {slots.map((slot) => (
                  <option key={slot} value={slot}>
                    {formatTime(slot)}
                  </option>
                ))}
              </select>
              <select
                value={sourceEnd}
                onChange={(e) => setSourceEnd(e.target.value)}
                className={cn(
                  "flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded",
                  "focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent",
                  "font-montserrat appearance-none bg-white dark:bg-gray-700 dark:text-white cursor-pointer"
                )}
              >
                {slots
                  .filter((slot) => timeToMinutes(slot) > timeToMinutes(sourceStart))
                  .map((slot) => (
                    <option key={slot} value={slot}>
                      {formatTime(slot)}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Target Start */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 font-montserrat">
              Target Start
            </label>
            <select
              value={targetStart}
              onChange={(e) => setTargetStart(e.target.value)}
              className={cn(
                "w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded",
                "focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent",
                "font-montserrat appearance-none bg-white dark:bg-gray-700 dark:text-white cursor-pointer"
              )}
            >
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {formatTime(slot)}
                </option>
              ))}
            </select>
          </div>

          {/* Visual Preview */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-700 dark:text-gray-300 font-montserrat">
              Copy blocks from{" "}
              <span className="font-semibold">
                {formatTime(sourceStart)}–{formatTime(sourceEnd)}
              </span>{" "}
              → Starting at{" "}
              <span className="font-semibold">{formatTime(targetStart)}</span>
            </p>
          </div>

          {/* Validation Messages */}
          {sourceStart >= sourceEnd && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800 font-montserrat">
                Source end time must be after start time.
              </p>
            </div>
          )}
          {overlap && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800 font-montserrat">
                Source and target ranges cannot overlap.
              </p>
            </div>
          )}
          {!targetFitsInSession && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-800 font-montserrat">
                Target range extends beyond session end time.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
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
              disabled={!isValid}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-semibold rounded",
                "text-white transition-colors font-montserrat",
                isValid
                  ? "cursor-pointer hover:opacity-90"
                  : "cursor-not-allowed opacity-50"
              )}
              style={isValid ? { backgroundColor: "#E11F8F" } : { backgroundColor: "#D1D5DB" }}
            >
              Copy Blocks
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// Helper: convert HH:MM to minutes
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Helper: get next hour slot from slots array
function getNextHourSlot(fromTime: string, slots: string[]): string {
  const fromMins = timeToMinutes(fromTime);
  const nextMins = fromMins + 60;
  // Find the closest slot >= nextMins, or return last slot
  for (const slot of slots) {
    if (timeToMinutes(slot) >= nextMins) {
      return slot;
    }
  }
  return slots[slots.length - 1];
}
