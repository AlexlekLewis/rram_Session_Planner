"use client";

import { generateTimeSlots, formatTime, isMajorGridline, ROW_HEIGHT_PX } from "@/lib/constants";

interface TimeAxisProps {
  startTime: string;
  endTime: string;
}

export function TimeAxis({ startTime, endTime }: TimeAxisProps) {
  const timeSlots = generateTimeSlots(startTime, endTime);

  return (
    <div className="w-16 bg-gray-50 border-r border-gray-200 overflow-hidden flex flex-col">
      {/* Header spacer */}
      <div className="h-[62px] border-b border-gray-200 flex-shrink-0" />

      {/* Time labels */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {timeSlots.map((time) => {
          const isMajor = isMajorGridline(time);

          return (
            <div
              key={time}
              className="flex items-start justify-center flex-shrink-0"
              style={{
                height: `${ROW_HEIGHT_PX}px`,
                borderBottom: isMajor
                  ? "2px solid #e5e7eb"
                  : "1px solid #f3f4f6",
              }}
            >
              {isMajor && (
                <span className="text-xs text-gray-500 font-medium mt-0.5">
                  {formatTime(time)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
