"use client";

import { SessionBlock } from "@/lib/types";
import { TierBadge } from "@/components/shared/TierBadge";
import { cn } from "@/lib/utils";

interface GridBlockProps {
  block: SessionBlock;
  isSelected?: boolean;
  onResizeStart?: (e: React.MouseEvent, blockId: string, edge: "bottom" | "right" | "corner") => void;
}

export function GridBlock({ block, isSelected = false, onResizeStart }: GridBlockProps) {
  const isTransition = block.category === "transition";
  const backgroundColor = block.colour;

  return (
    <div
      className={cn(
        "w-full h-full rounded border-2 hover:shadow-md transition-shadow cursor-grab",
        "active:cursor-grabbing overflow-hidden flex flex-col relative",
        isSelected && "ring-2 ring-rr-blue ring-offset-1"
      )}
      style={{
        backgroundColor: isTransition
          ? "transparent"
          : `${backgroundColor}d9`, // ~85% opacity
        backgroundImage: isTransition
          ? `repeating-linear-gradient(45deg, ${backgroundColor}66, ${backgroundColor}66 10px, ${backgroundColor}99 10px, ${backgroundColor}99 20px)`
          : "none",
        borderColor: isSelected ? "#1226AA" : backgroundColor,
      }}
    >
      {/* Content */}
      <div className="p-1.5 flex-1 min-h-0">
        <div className="font-semibold text-xs text-gray-900 truncate leading-tight">
          {block.name}
        </div>
        <div className="flex items-center gap-1 flex-wrap mt-0.5">
          <TierBadge tier={block.tier} />
          {block.coach_assigned && (
            <span className="text-[10px] text-gray-700 bg-white/70 px-1 py-0.5 rounded truncate max-w-[80px]">
              {block.coach_assigned}
            </span>
          )}
        </div>
        {block.player_groups && block.player_groups.length > 0 && (
          <div className="text-[10px] text-gray-600 mt-0.5 truncate">
            {(block.player_groups as string[]).join(", ")}
          </div>
        )}
      </div>

      {/* Resize handles */}
      {onResizeStart && (
        <>
          {/* Bottom edge — resize time duration */}
          <div
            className="absolute bottom-0 left-1 right-1 h-1.5 cursor-ns-resize hover:bg-black/10 rounded-b"
            onMouseDown={(e) => onResizeStart(e, block.id, "bottom")}
          />
          {/* Right edge — resize lane width */}
          <div
            className="absolute top-1 right-0 bottom-1 w-1.5 cursor-ew-resize hover:bg-black/10 rounded-r"
            onMouseDown={(e) => onResizeStart(e, block.id, "right")}
          />
          {/* Corner — resize both */}
          <div
            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize hover:bg-black/10 rounded-br"
            onMouseDown={(e) => onResizeStart(e, block.id, "corner")}
          />
        </>
      )}
    </div>
  );
}
