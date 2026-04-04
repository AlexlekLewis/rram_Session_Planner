"use client";

import { CATEGORY_COLOURS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CategoryDotProps {
  category: string;
  size?: number;
}

export function CategoryDot({ category, size = 12 }: CategoryDotProps) {
  const colour = CATEGORY_COLOURS[category as keyof typeof CATEGORY_COLOURS] || "#D4D4D8";

  return (
    <div
      className={cn("inline-block rounded-full")}
      style={{
        backgroundColor: colour,
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
}
