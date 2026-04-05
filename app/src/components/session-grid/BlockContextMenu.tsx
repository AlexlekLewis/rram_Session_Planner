"use client";

import { useEffect, useRef, useState } from "react";
import { SessionBlock, BlockCategory } from "@/lib/types";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { CategoryDot } from "@/components/shared/CategoryDot";

interface BlockContextMenuProps {
  block: SessionBlock;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (block: SessionBlock) => void;
  onDuplicate: (block: SessionBlock) => void;
  onDelete: (blockId: string) => void;
  onChangeCategory: (blockId: string, category: BlockCategory) => void;
}

export function BlockContextMenu({
  block,
  position,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onChangeCategory,
}: BlockContextMenuProps) {
  const [showCategorySubmenu, setShowCategorySubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleCategorySelect = (category: BlockCategory) => {
    onChangeCategory(block.id, category);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Main Menu */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[200px]">
        {/* Edit Details */}
        <button
          onClick={() => {
            onEdit(block);
            onClose();
          }}
          className={cn(
            "w-full text-left px-3 py-2 text-sm font-montserrat text-gray-900 dark:text-gray-200",
            "h-8 flex items-center gap-2",
            "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          )}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit Details
        </button>

        {/* Change Category - with submenu trigger */}
        <div className="relative">
          <button
            ref={categoryButtonRef}
            onClick={() => setShowCategorySubmenu(!showCategorySubmenu)}
            onMouseEnter={() => setShowCategorySubmenu(true)}
            className={cn(
              "w-full text-left px-3 py-2 text-sm font-montserrat text-gray-900",
              "h-8 flex items-center gap-2 justify-between",
              "hover:bg-gray-100 transition-colors"
            )}
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              Change Category
            </span>
            <svg
              className={cn(
                "w-3 h-3 transition-transform",
                showCategorySubmenu && "rotate-180"
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>

          {/* Category Submenu */}
          {showCategorySubmenu && (
            <div
              onMouseLeave={() => setShowCategorySubmenu(false)}
              className={cn(
                "absolute left-full top-0 ml-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700",
                "min-w-[220px] py-1 z-50"
              )}
            >
              {ALL_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm font-montserrat text-gray-900",
                    "h-8 flex items-center gap-2",
                    "hover:bg-gray-100 transition-colors"
                  )}
                >
                  <CategoryDot category={category} size={10} />
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Duplicate Block */}
        <button
          onClick={() => {
            onDuplicate(block);
            onClose();
          }}
          className={cn(
            "w-full text-left px-3 py-2 text-sm font-montserrat text-gray-900 dark:text-gray-200",
            "h-8 flex items-center gap-2",
            "hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          )}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Duplicate Block
        </button>

        {/* Delete Block - Red text */}
        <button
          onClick={() => {
            if (window.confirm('Delete this block? This can be undone with \u2318Z.')) {
              onDelete(block.id);
            }
            onClose();
          }}
          className={cn(
            "w-full text-left px-3 py-2 text-sm font-montserrat text-red-600",
            "h-8 flex items-center gap-2",
            "hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors border-t border-gray-100 dark:border-gray-700 mt-1 pt-1"
          )}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete Block
        </button>
      </div>
    </div>
  );
}
