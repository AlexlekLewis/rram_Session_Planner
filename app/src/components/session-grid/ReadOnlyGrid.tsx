"use client";

import { Session, SessionBlock } from "@/lib/types";
import { GridBlock } from "./GridBlock";
import {
  generateTimeSlots,
  isMajorGridline,
  ROW_HEIGHT_PX,
  TOTAL_LANES,
  getTimeIndex,
  getBlockRowSpan,
} from "@/lib/constants";
import { TimeAxis } from "./TimeAxis";
import { LaneHeader } from "./LaneHeader";

interface ReadOnlyGridProps {
  session: Session;
  blocks: SessionBlock[];
}

export function ReadOnlyGrid({ session, blocks }: ReadOnlyGridProps) {
  const timeSlots = generateTimeSlots(session.start_time, session.end_time);
  const totalRows = timeSlots.length;

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 h-full overflow-hidden">
      {/* Read Only Badge — floats above the scroll area */}
      <div className="absolute top-4 right-4 z-40 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-semibold pointer-events-none">
        Read Only
      </div>

      {/* Single CSS grid — time axis + grid share one scroll container.
          Sticky corner/header/axis stay pinned while content scrolls. */}
      <div
        className="h-full overflow-auto"
        style={{
          display: "grid",
          gridTemplateColumns: "64px minmax(600px, 1fr)",
          gridTemplateRows: "auto auto",
        }}
      >
        {/* Top-left corner — sticky both */}
        <div
          className="sticky top-0 left-0 z-30 bg-gray-50 dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700"
          style={{ gridColumn: 1, gridRow: 1, height: 56 }}
        />

        {/* Lane Header — sticky top */}
        <div
          className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
          style={{ gridColumn: 2, gridRow: 1 }}
        >
          <LaneHeader />
        </div>

        {/* Time Axis — sticky left */}
        <div
          className="sticky left-0 z-10 border-r border-gray-200 dark:border-gray-700"
          style={{ gridColumn: 1, gridRow: 2 }}
        >
          <TimeAxis startTime={session.start_time} endTime={session.end_time} />
        </div>

        {/* Grid Canvas */}
        <div
          className="relative bg-white dark:bg-gray-900"
          style={{ gridColumn: 2, gridRow: 2 }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${TOTAL_LANES}, 1fr)`,
              gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT_PX}px)`,
              width: "100%",
              height: `${totalRows * ROW_HEIGHT_PX}px`,
              position: "relative",
            }}
          >
            {/* Background grid cells */}
            {Array.from({ length: totalRows }).map((_, rowIdx) => {
              const time = timeSlots[rowIdx];
              const isMajor = isMajorGridline(time);
              return Array.from({ length: TOTAL_LANES }).map((_, colIdx) => (
                <div
                  key={`cell-${rowIdx}-${colIdx}`}
                  style={{
                    borderRight:
                      colIdx < TOTAL_LANES - 1 ? "1px solid var(--grid-line)" : "none",
                    borderBottom: isMajor
                      ? "2px solid var(--grid-line-major)"
                      : "1px solid var(--grid-line-minor)",
                    gridColumn: colIdx + 1,
                    gridRow: rowIdx + 1,
                  }}
                />
              ));
            })}

            {/* Activity Blocks */}
            {blocks.map((block) => {
              const timeStartIndex = getTimeIndex(
                block.time_start,
                session.start_time
              );
              const rowSpan = getBlockRowSpan(
                block.time_start,
                block.time_end
              );
              const gridColumnStart = block.lane_start;
              const gridColumnEnd = block.lane_end + 1;
              const gridRowStart = timeStartIndex + 1;
              const gridRowEnd = gridRowStart + rowSpan;

              return (
                <div
                  key={block.id}
                  style={{
                    gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
                    gridRow: `${gridRowStart} / ${gridRowEnd}`,
                    zIndex: 10,
                    padding: "1px",
                    pointerEvents: "none",
                  }}
                >
                  {/* Read-only GridBlock without resize handlers */}
                  <GridBlock block={block} isSelected={false} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
