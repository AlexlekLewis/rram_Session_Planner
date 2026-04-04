"use client";

import { useState, useCallback } from "react";
import { SessionBlock } from "@/lib/types";

interface ClipboardState {
  blocks: SessionBlock[];
  sourceTimeStart: string;
  sourceLaneStart: number;
}

export function useClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null);

  // Copy selected blocks to clipboard
  const copy = useCallback((blocks: SessionBlock[]) => {
    if (blocks.length === 0) return;
    // Find top-left origin of selection
    const minLane = Math.min(...blocks.map((b) => b.lane_start));
    const minTime = blocks.reduce(
      (min, b) => (b.time_start < min ? b.time_start : min),
      blocks[0].time_start
    );
    setClipboard({
      blocks: [...blocks],
      sourceTimeStart: minTime,
      sourceLaneStart: minLane,
    });
  }, []);

  // Paste blocks at a target position
  // Returns new blocks with adjusted positions (caller creates them)
  const paste = useCallback(
    (
      targetLane: number,
      targetTimeStart: string
    ): Omit<
      SessionBlock,
      "id" | "created_at" | "updated_at"
    >[] | null => {
      if (!clipboard) return null;

      const [tH, tM] = targetTimeStart.split(":").map(Number);
      const targetMins = tH * 60 + tM;
      const [sH, sM] = clipboard.sourceTimeStart.split(":").map(Number);
      const sourceMins = sH * 60 + sM;
      const timeDelta = targetMins - sourceMins;
      const laneDelta = targetLane - clipboard.sourceLaneStart;

      return clipboard.blocks.map((block) => {
        const [bsH, bsM] = block.time_start.split(":").map(Number);
        const [beH, beM] = block.time_end.split(":").map(Number);
        const newStartMins = bsH * 60 + bsM + timeDelta;
        const newEndMins = beH * 60 + beM + timeDelta;

        return {
          ...block,
          lane_start: block.lane_start + laneDelta,
          lane_end: block.lane_end + laneDelta,
          time_start: `${Math.floor(newStartMins / 60)
            .toString()
            .padStart(2, "0")}:${(newStartMins % 60)
            .toString()
            .padStart(2, "0")}`,
          time_end: `${Math.floor(newEndMins / 60)
            .toString()
            .padStart(2, "0")}:${(newEndMins % 60)
            .toString()
            .padStart(2, "0")}`,
          sort_order: 0,
          created_by: undefined,
        };
      });
    },
    [clipboard]
  );

  // Copy Hour: get all blocks in a time range and create copies offset to target
  const copyHour = useCallback(
    (
      allBlocks: SessionBlock[],
      sourceStart: string,
      sourceEnd: string,
      targetStart: string
    ): Omit<
      SessionBlock,
      "id" | "created_at" | "updated_at"
    >[] => {
      // Find blocks that overlap with source range
      const sourceBlocks = allBlocks.filter((b) => {
        return b.time_start >= sourceStart && b.time_start < sourceEnd;
      });

      const [ssH, ssM] = sourceStart.split(":").map(Number);
      const [tsH, tsM] = targetStart.split(":").map(Number);
      const timeDelta = tsH * 60 + tsM - (ssH * 60 + ssM);

      return sourceBlocks.map((block) => {
        const [bsH, bsM] = block.time_start.split(":").map(Number);
        const [beH, beM] = block.time_end.split(":").map(Number);
        const newStartMins = bsH * 60 + bsM + timeDelta;
        const newEndMins = beH * 60 + beM + timeDelta;

        return {
          ...block,
          time_start: `${Math.floor(newStartMins / 60)
            .toString()
            .padStart(2, "0")}:${(newStartMins % 60)
            .toString()
            .padStart(2, "0")}`,
          time_end: `${Math.floor(newEndMins / 60)
            .toString()
            .padStart(2, "0")}:${(newEndMins % 60)
            .toString()
            .padStart(2, "0")}`,
          sort_order: 0,
          created_by: undefined,
        };
      });
    },
    []
  );

  const hasClipboard = clipboard !== null && clipboard.blocks.length > 0;

  return { copy, paste, copyHour, hasClipboard };
}
