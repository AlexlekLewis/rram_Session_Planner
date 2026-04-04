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

      setCreateModal({
        position: mousePosition,
        laneStart,
        laneEnd,
        timeStart,
        timeEnd: actualEnd,
      });
    },
    [timeSlots]
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
    <div className="flex h-full bg-white dark:bg-gray-900 overflow-hidden relative">
      {/* Time Axis (Left Column) */}
      <TimeAxis startTime={session.start_time} endTime={session.end_time} />

      {/* Main Grid Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Lane Headers */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-20">
          <LaneHeader />
        </div>

        {/* Grid Canvas (Scrollable) */}
        <div className="flex-1 overflow-auto">
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
