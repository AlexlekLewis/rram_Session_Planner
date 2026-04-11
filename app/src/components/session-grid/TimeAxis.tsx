"use client";

import { generateTimeSlots, formatTime, isMajorGridline, ROW_HEIGHT_PX } from "@/lib/constants";

interface TimeAxisProps {
  startTime: string;
  endTime: string;
}

/**
 * Renders a column of time labels aligned 1:1 with grid rows.
 * Height equals `timeSlots.length * ROW_HEIGHT_PX` so it lines up with GridCanvas.
 * Layout (sticky column, corner spacer, etc.) is handled by the parent.
 */
export function TimeAxis({ startTime, endTime }: TimeAxisProps) {
  const timeSlots = generateTimeSlots(startTime, endTime);

  return (
    <div className="w-16 bg-gray-50 dark:bg-gray-800 relative">
      {timeSlots.map((time) => {
        const isMajor = isMajorGridline(time);

        return (
          <div
            key={time}
            className="flex items-start justify-center"
            style={{
              height: `${ROW_HEIGHT_PX}px`,
              borderBottom: isMajor
                ? "2px solid var(--grid-line-major)"
                : "1px solid var(--grid-line-minor)",
            }}
          >
            {isMajor && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                {formatTime(time)}
              </span>
            )}
          </div>
        );
      })}

      {/* End-time marker — sits at the bottom edge of the last row so users
          see the session end time even though it's not in timeSlots. */}
      <span className="absolute left-0 right-0 -bottom-2 text-center text-xs text-gray-500 dark:text-gray-400 font-medium pointer-events-none">
        {formatTime(endTime)}
      </span>
    </div>
  );
}
