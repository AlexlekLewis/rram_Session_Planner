"use client";

import { useState, useCallback } from "react";
import { Session, SessionBlock, BlockCategory, Tier, BlockPosition } from "@/lib/types";
import { TimeAxis } from "./TimeAxis";
import { LaneHeader } from "./LaneHeader";
import { GridCanvas } from "./GridCanvas";
import { CreateBlockModal } from "./CreateBlockModal";
import { BlockContextMenu } from "./BlockContextMenu";
import { generateTimeSlots, CATEGORY_COLOURS } from "@/lib/constants";

interface SessionGridProps {
  session: Session;
  blocks: SessionBlock[];
  selectedBlockIds: string[];
  onAddBlock: (block: Omit<SessionBlock, "id" | "created_at" | "updated_at">) => SessionBlock;
  onUpdateBlock: (id: string, updates: Partial<SessionBlock>) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock: (id: string, laneStart: number, laneEnd: number, timeStart: string, timeEnd: string) => void;
  onDuplicateBlock: (block: SessionBlock) => void;
  onSelectBlocks: (ids: string[]) => void;
  hasCollision: (position: BlockPosition, excludeId?: string) => boolean;
}

export function SessionGrid({
  session,
  blocks,
  selectedBlockIds,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlock,
  onDuplicateBlock,
  onSelectBlocks,
  hasCollision,
}: SessionGridProps) {
  const timeSlots = generateTimeSlots(session.start_time, session.end_time);

  // Create block modal state
  const [createModal, setCreateModal] = useState<{
    position: { x: number; y: number };
    laneStart: number;
    laneEnd: number;
    timeStart: string;
    timeEnd: string;
  } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    block: SessionBlock;
    position: { x: number; y: number };
  } | null>(null);

  // Handle new block creation from grid selection
  const handleCreateBlock = useCallback(
    (laneStart: number, laneEnd: number, timeStartIdx: number, timeEndIdx: number, mousePosition: { x: number; y: number }) => {
      const timeStart = timeSlots[timeStartIdx];
      const timeEnd = timeSlots[Math.min(timeEndIdx, timeSlots.length - 1)] || timeSlots[timeSlots.length - 1];

      // Calculate end time (add 5 min to the last selected slot)
      const [eh, em] = timeEnd.split(":").map(Number);
      const endMinutes = eh * 60 + em + 5;
      const actualEnd = `${Math.floor(endMinutes / 60).toString().padStart(2, "0")}:${(endMinutes % 60).toString().padStart(2, "0")}`;

      // Close any open BlockDetailPanel so it doesn't overlap the create modal
      onSelectBlocks([]);

      setCreateModal({
        position: mousePosition,
        laneStart,
        laneEnd,
        timeStart,
        timeEnd: actualEnd,
      });
    },
    [timeSlots, onSelectBlocks]
  );

  // Confirm block creation
  const handleConfirmCreate = useCallback(
    (data: { name: string; category: BlockCategory; tier: Tier; coachAssigned?: string; otherLocation?: string }) => {
      if (!createModal) return;
      onAddBlock({
        session_id: session.id,
        activity_id: undefined,
        name: data.name,
        lane_start: createModal.laneStart,
        lane_end: createModal.laneEnd,
        time_start: createModal.timeStart,
        time_end: createModal.timeEnd,
        colour: CATEGORY_COLOURS[data.category] || "#D4D4D8",
        category: data.category,
        tier: data.tier,
        other_location: data.otherLocation,
        coaching_notes: undefined,
        coaching_points: [],
        player_groups: [],
        equipment: [],
        coach_assigned: data.coachAssigned,
        sort_order: blocks.length,
        created_by: undefined,
      });
      setCreateModal(null);
    },
    [createModal, onAddBlock, session.id, blocks.length]
  );

  // Context menu handler
  const handleContextMenu = useCallback(
    (block: SessionBlock, position: { x: number; y: number }) => {
      setContextMenu({ block, position });
    },
    []
  );

  return (
    <div className="h-full bg-white dark:bg-gray-900 overflow-auto relative">
      {/* Single CSS grid so time axis + grid canvas share one scroll container.
          Corner, lane headers, and time axis use `sticky` to stay pinned while
          the scroll container moves the grid content underneath them. */}
      <div
        className="relative"
        style={{
          display: "grid",
          gridTemplateColumns: "64px minmax(600px, 1fr)",
          gridTemplateRows: "auto auto",
        }}
      >
        {/* Top-left corner — sticky both directions */}
        <div
          className="sticky top-0 left-0 z-30 bg-gray-50 dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700"
          style={{ gridColumn: 1, gridRow: 1, height: 62 }}
        />

        {/* Lane Headers — sticky top, scrolls horizontally with grid */}
        <div
          className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
          style={{ gridColumn: 2, gridRow: 1 }}
        >
          <LaneHeader />
        </div>

        {/* Time Axis — sticky left, scrolls vertically with grid */}
        <div
          className="sticky left-0 z-10 border-r border-gray-200 dark:border-gray-700"
          style={{ gridColumn: 1, gridRow: 2 }}
        >
          <TimeAxis startTime={session.start_time} endTime={session.end_time} />
        </div>

        {/* Grid Canvas */}
        <div style={{ gridColumn: 2, gridRow: 2 }}>
          <GridCanvas
            session={session}
            blocks={blocks}
            selectedBlockIds={selectedBlockIds}
            onCreateBlock={handleCreateBlock}
            onMoveBlock={onMoveBlock}
            onUpdateBlock={onUpdateBlock}
            onSelectBlocks={onSelectBlocks}
            onContextMenu={handleContextMenu}
            hasCollision={hasCollision}
          />
        </div>
      </div>

      {/* Create Block Modal */}
      {createModal && (
        <CreateBlockModal
          position={createModal.position}
          laneStart={createModal.laneStart}
          laneEnd={createModal.laneEnd}
          timeStart={createModal.timeStart}
          timeEnd={createModal.timeEnd}
          onConfirm={handleConfirmCreate}
          onCancel={() => setCreateModal(null)}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <BlockContextMenu
          block={contextMenu.block}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onEdit={(block) => {
            setContextMenu(null);
            onSelectBlocks([block.id]);
          }}
          onDuplicate={(block) => {
            setContextMenu(null);
            onDuplicateBlock(block);
          }}
          onDelete={(id) => {
            setContextMenu(null);
            onDeleteBlock(id);
          }}
          onChangeCategory={(id, category) => {
            setContextMenu(null);
            onUpdateBlock(id, { category, colour: CATEGORY_COLOURS[category] || "#D4D4D8" });
          }}
        />
      )}
    </div>
  );
}
