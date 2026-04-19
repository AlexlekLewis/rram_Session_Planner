"use client";

import { useRef, useState, useCallback } from "react";
import { Session, SessionBlock, BlockPosition, Activity } from "@/lib/types";
import { GridBlock } from "./GridBlock";
import {
  generateTimeSlots,
  isMajorGridline,
  ROW_HEIGHT_PX,
  TOTAL_LANES,
  getTimeIndex,
  getBlockRowSpan,
  TIME_INCREMENT_MINUTES,
} from "@/lib/constants";
import { useGridSelection } from "@/hooks/useGridSelection";

interface GridCanvasProps {
  session: Session;
  blocks: SessionBlock[];
  selectedBlockIds: string[];
  onCreateBlock: (laneStart: number, laneEnd: number, timeStartIdx: number, timeEndIdx: number, mousePos: { x: number; y: number }) => void;
  onMoveBlock: (id: string, laneStart: number, laneEnd: number, timeStart: string, timeEnd: string) => void;
  onUpdateBlock: (id: string, updates: Partial<SessionBlock>) => void;
  onSelectBlocks: (ids: string[]) => void;
  onContextMenu: (block: SessionBlock, position: { x: number; y: number }) => void;
  hasCollision: (position: BlockPosition, excludeId?: string) => boolean;
  /**
   * Called when an activity card is dropped onto the grid from the
   * Activity Library panel. The grid parses the activity JSON, computes
   * lane/time from the cursor, and hands the caller the full context so
   * it can open the tier selector modal.
   *
   * Optional — falsy means drag-drop is disabled (e.g. read-only mode).
   */
  onLibraryDrop?: (
    activity: Activity,
    laneStart: number,
    laneEnd: number,
    timeStart: string,
    timeEnd: string,
    position: { x: number; y: number }
  ) => void;
}

export function GridCanvas({
  session,
  blocks,
  selectedBlockIds,
  onCreateBlock,
  onMoveBlock,
  onUpdateBlock,
  onSelectBlocks,
  onContextMenu,
  hasCollision,
  onLibraryDrop,
}: GridCanvasProps) {
  const timeSlots = generateTimeSlots(session.start_time, session.end_time);
  const totalRows = timeSlots.length;
  const gridRef = useRef<HTMLDivElement>(null);

  // Grid selection hook for creating new blocks
  const selection = useGridSelection();

  // Dragging state for moving blocks
  const [dragState, setDragState] = useState<{
    blockId: string;
    offsetLane: number;
    offsetRow: number;
    currentLane: number;
    currentRow: number;
    laneSpan: number;
    rowSpan: number;
  } | null>(null);

  // Resize state
  const [resizeState, setResizeState] = useState<{
    blockId: string;
    edge: "bottom" | "right" | "corner";
    startRow: number;
    startLane: number;
  } | null>(null);

  // Get cell coordinates from mouse event
  const getCellFromMouse = useCallback(
    (e: React.MouseEvent): { lane: number; timeIndex: number } | null => {
      if (!gridRef.current) return null;
      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top + gridRef.current.scrollTop;

      const colWidth = rect.width / TOTAL_LANES;
      const lane = Math.max(1, Math.min(TOTAL_LANES, Math.floor(x / colWidth) + 1));
      const timeIndex = Math.max(0, Math.min(totalRows - 1, Math.floor(y / ROW_HEIGHT_PX)));

      return { lane, timeIndex };
    },
    [totalRows]
  );

  // Check if a cell has a block on it
  const getBlockAtCell = useCallback(
    (lane: number, timeIndex: number): SessionBlock | null => {
      const time = timeSlots[timeIndex];
      if (!time) return null;
      return (
        blocks.find((b) => {
          const bStartIdx = getTimeIndex(b.time_start, session.start_time);
          const bEndIdx = bStartIdx + getBlockRowSpan(b.time_start, b.time_end);
          return lane >= b.lane_start && lane <= b.lane_end && timeIndex >= bStartIdx && timeIndex < bEndIdx;
        }) || null
      );
    },
    [blocks, timeSlots, session.start_time]
  );

  // Mouse down: start selection or start dragging a block
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return; // Left click only
      const cell = getCellFromMouse(e);
      if (!cell) return;

      const existingBlock = getBlockAtCell(cell.lane, cell.timeIndex);

      if (existingBlock) {
        // Start dragging the block
        const bStartIdx = getTimeIndex(existingBlock.time_start, session.start_time);
        const laneSpan = existingBlock.lane_end - existingBlock.lane_start + 1;
        const rowSpan = getBlockRowSpan(existingBlock.time_start, existingBlock.time_end);

        setDragState({
          blockId: existingBlock.id,
          offsetLane: cell.lane - existingBlock.lane_start,
          offsetRow: cell.timeIndex - bStartIdx,
          currentLane: existingBlock.lane_start,
          currentRow: bStartIdx,
          laneSpan,
          rowSpan,
        });

        // Select this block
        if (e.shiftKey) {
          onSelectBlocks([...selectedBlockIds, existingBlock.id]);
        } else {
          onSelectBlocks([existingBlock.id]);
        }
      } else {
        // Start new selection
        onSelectBlocks([]);
        selection.handleMouseDown(cell.lane, cell.timeIndex);
      }
    },
    [getCellFromMouse, getBlockAtCell, session.start_time, selection, onSelectBlocks, selectedBlockIds]
  );

  // Mouse move: update selection, drag preview, or resize
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const cell = getCellFromMouse(e);
      if (!cell) return;

      if (selection.isSelecting) {
        selection.handleMouseMove(cell.lane, cell.timeIndex);
      }

      if (dragState) {
        const newLane = Math.max(1, Math.min(TOTAL_LANES - dragState.laneSpan + 1, cell.lane - dragState.offsetLane));
        const newRow = Math.max(0, Math.min(totalRows - dragState.rowSpan, cell.timeIndex - dragState.offsetRow));
        setDragState((prev) => prev ? { ...prev, currentLane: newLane, currentRow: newRow } : null);
      }

      if (resizeState) {
        const block = blocks.find((b) => b.id === resizeState.blockId);
        if (!block) return;
        const bStartIdx = getTimeIndex(block.time_start, session.start_time);
        const bStartLane = block.lane_start;

        if (resizeState.edge === "bottom" || resizeState.edge === "corner") {
          // Resize time (vertical) — minimum 1 row
          const newEndRow = Math.max(bStartIdx + 1, Math.min(totalRows, cell.timeIndex + 1));
          const newTimeEnd = timeSlots[newEndRow] || timeSlots[totalRows - 1];
          if (newTimeEnd && newTimeEnd !== block.time_end) {
            // Calculate end time
            const [h, m] = timeSlots[bStartIdx].split(":").map(Number);
            const durationMins = (newEndRow - bStartIdx) * TIME_INCREMENT_MINUTES;
            const endMins = h * 60 + m + durationMins;
            const endTime = `${Math.floor(endMins / 60).toString().padStart(2, "0")}:${(endMins % 60).toString().padStart(2, "0")}`;
            onUpdateBlock(block.id, { time_end: endTime });
          }
        }
        if (resizeState.edge === "right" || resizeState.edge === "corner") {
          // Resize lanes (horizontal) — minimum 1 lane
          const newLaneEnd = Math.max(bStartLane, Math.min(TOTAL_LANES, cell.lane));
          if (newLaneEnd !== block.lane_end) {
            onUpdateBlock(block.id, { lane_end: newLaneEnd });
          }
        }
      }
    },
    [getCellFromMouse, selection, dragState, resizeState, blocks, session.start_time, timeSlots, totalRows, onUpdateBlock]
  );

  // Mouse up: finalize selection or drop block
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // Finalize grid selection → create block
      if (selection.isSelecting) {
        const result = selection.handleMouseUp();
        if (result) {
          const { laneStart, laneEnd, timeStartIndex, timeEndIndex } = result;
          // Only create if selection is meaningful
          if (laneEnd >= laneStart && timeEndIndex > timeStartIndex) {
            onCreateBlock(laneStart, laneEnd, timeStartIndex, timeEndIndex - 1, { x: e.clientX, y: e.clientY });
          }
        }
      }

      // Finalize resize
      if (resizeState) {
        setResizeState(null);
        return;
      }

      // Finalize block move
      if (dragState) {
        const block = blocks.find((b) => b.id === dragState.blockId);
        if (block) {
          const newLaneStart = dragState.currentLane;
          const newLaneEnd = dragState.currentLane + dragState.laneSpan - 1;
          const newTimeStart = timeSlots[dragState.currentRow];
          const totalMins = dragState.rowSpan * TIME_INCREMENT_MINUTES;
          const [h, m] = newTimeStart.split(":").map(Number);
          const endMins = h * 60 + m + totalMins;
          const newTimeEnd = `${Math.floor(endMins / 60).toString().padStart(2, "0")}:${(endMins % 60).toString().padStart(2, "0")}`;

          // Check collision before moving
          const collision = hasCollision(
            { laneStart: newLaneStart, laneEnd: newLaneEnd, timeStart: newTimeStart, timeEnd: newTimeEnd },
            block.id
          );

          if (!collision) {
            onMoveBlock(block.id, newLaneStart, newLaneEnd, newTimeStart, newTimeEnd);
          }
        }
        setDragState(null);
      }
    },
    [selection, dragState, blocks, timeSlots, onCreateBlock, onMoveBlock, hasCollision]
  );

  // Right-click on block
  const handleBlockContextMenu = useCallback(
    (e: React.MouseEvent, block: SessionBlock) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(block, { x: e.clientX, y: e.clientY });
    },
    [onContextMenu]
  );

  // Drag-over: required for the drop event to fire at all. Showing
  // "copy" cursor feedback also tells the user they're over a valid target.
  // Without this handler the Activity Library drop silently no-ops.
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!onLibraryDrop) return;
      // Only respond to activity drags — avoids capturing unrelated drags (files, text).
      const types = e.dataTransfer.types;
      if (!types.includes("application/activity-json") && !types.includes("application/activity-id")) {
        return;
      }
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [onLibraryDrop]
  );

  // Drop: parse the activity JSON, compute lane/time from cursor, and
  // call the parent's onLibraryDrop so it can open the tier selector.
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (!onLibraryDrop) return;
      const raw = e.dataTransfer.getData("application/activity-json");
      if (!raw) return;
      e.preventDefault();

      let activity: Activity;
      try {
        activity = JSON.parse(raw) as Activity;
      } catch {
        console.warn("Library drop: could not parse activity JSON");
        return;
      }

      // Reuse the mouse-coord → cell helper. Synthesise the minimal
      // MouseEvent shape the helper expects.
      const cell = getCellFromMouse({
        clientX: e.clientX,
        clientY: e.clientY,
      } as React.MouseEvent);
      if (!cell) return;

      // Lanes: honour the activity's default_lanes, clamp to grid bounds.
      const defaultLanes = Math.max(1, Math.min(TOTAL_LANES, activity.default_lanes || 1));
      const laneStart = Math.max(1, Math.min(TOTAL_LANES - defaultLanes + 1, cell.lane));
      const laneEnd = laneStart + defaultLanes - 1;

      // Time: honour default_duration_mins. Snap to grid increments, clamp
      // so the block doesn't extend past the session's end_time.
      const timeStart = timeSlots[cell.timeIndex];
      if (!timeStart) return;
      const durationMins = Math.max(
        TIME_INCREMENT_MINUTES,
        activity.default_duration_mins || 20
      );
      const [h, m] = timeStart.split(":").map(Number);
      const endMins = h * 60 + m + durationMins;
      let timeEnd = `${Math.floor(endMins / 60).toString().padStart(2, "0")}:${(endMins % 60).toString().padStart(2, "0")}`;
      // Clamp against session end_time
      if (timeEnd > session.end_time) timeEnd = session.end_time;

      onLibraryDrop(
        activity,
        laneStart,
        laneEnd,
        timeStart,
        timeEnd,
        { x: e.clientX, y: e.clientY }
      );
    },
    [onLibraryDrop, getCellFromMouse, timeSlots, session.end_time]
  );

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, blockId: string, edge: "bottom" | "right" | "corner") => {
      e.stopPropagation();
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;
      const bStartIdx = getTimeIndex(block.time_start, session.start_time);
      setResizeState({ blockId, edge, startRow: bStartIdx, startLane: block.lane_start });
    },
    [blocks, session.start_time]
  );

  return (
    <div
      ref={gridRef}
      className="bg-white dark:bg-gray-900 relative select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* CSS Grid */}
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
                borderRight: colIdx < TOTAL_LANES - 1 ? "1px solid var(--grid-line)" : "none",
                borderBottom: isMajor ? "2px solid var(--grid-line-major)" : "1px solid var(--grid-line-minor)",
                gridColumn: colIdx + 1,
                gridRow: rowIdx + 1,
              }}
            />
          ));
        })}

        {/* Selection overlay */}
        {selection.isSelecting && selection.selection && (() => {
          const sel = selection.selection;
          const minLane = Math.min(sel.startLane, sel.endLane);
          const maxLane = Math.max(sel.startLane, sel.endLane);
          const minTime = Math.min(sel.startTimeIndex, sel.endTimeIndex);
          const maxTime = Math.max(sel.startTimeIndex, sel.endTimeIndex);
          return (
            <div
              style={{
                gridColumn: `${minLane} / ${maxLane + 1}`,
                gridRow: `${minTime + 1} / ${maxTime + 2}`,
                backgroundColor: "rgba(18, 38, 170, 0.12)",
                border: "2px solid rgba(18, 38, 170, 0.4)",
                borderRadius: "4px",
                zIndex: 5,
                pointerEvents: "none",
              }}
            />
          );
        })()}

        {/* Drag ghost preview */}
        {dragState && (
          <div
            style={{
              gridColumn: `${dragState.currentLane} / ${dragState.currentLane + dragState.laneSpan}`,
              gridRow: `${dragState.currentRow + 1} / ${dragState.currentRow + dragState.rowSpan + 1}`,
              backgroundColor: "rgba(18, 38, 170, 0.08)",
              border: "2px dashed rgba(18, 38, 170, 0.4)",
              borderRadius: "4px",
              zIndex: 5,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Activity Blocks */}
        {blocks.map((block) => {
          const timeStartIndex = getTimeIndex(block.time_start, session.start_time);
          const rowSpan = getBlockRowSpan(block.time_start, block.time_end);
          const gridColumnStart = block.lane_start;
          const gridColumnEnd = block.lane_end + 1;
          const gridRowStart = timeStartIndex + 1;
          const gridRowEnd = gridRowStart + rowSpan;

          const isSelected = selectedBlockIds.includes(block.id);
          const isDragging = dragState?.blockId === block.id;

          return (
            <div
              key={block.id}
              style={{
                gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
                gridRow: `${gridRowStart} / ${gridRowEnd}`,
                zIndex: isDragging ? 20 : isSelected ? 15 : 10,
                opacity: isDragging ? 0.5 : 1,
                padding: "1px",
              }}
              onContextMenu={(e) => handleBlockContextMenu(e, block)}
            >
              <GridBlock
                block={block}
                isSelected={isSelected}
                onResizeStart={handleResizeStart}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
