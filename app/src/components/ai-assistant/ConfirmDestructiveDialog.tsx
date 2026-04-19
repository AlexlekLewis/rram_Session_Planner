"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDestructiveDialogProps {
  isOpen: boolean;
  /** Total number of blocks that will be removed if the user confirms. */
  deleteCount: number;
  /** Earliest time in the affected range (HH:MM), if the batch includes a range. */
  timeStart?: string;
  /** Latest time in the affected range (HH:MM), if the batch includes a range. */
  timeEnd?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Secondary confirmation gate for bulk destructive AI actions. Shown when the
 * assistant's pending tool calls include a clear_time_range OR ≥3 delete_block
 * actions — the user must type "delete" to proceed, matching the friction of
 * the action's blast radius.
 */
export function ConfirmDestructiveDialog({
  isOpen,
  deleteCount,
  timeStart,
  timeEnd,
  onCancel,
  onConfirm,
}: ConfirmDestructiveDialogProps) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const canConfirm = typed.trim().toLowerCase() === "delete";

  useEffect(() => {
    if (isOpen) {
      setTyped("");
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const countNoun = deleteCount === 1 ? "block" : "blocks";
  const rangeClause =
    timeStart && timeEnd ? ` between ${timeStart} and ${timeEnd}` : "";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-destructive-title"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-[440px] w-full mx-4"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              id="confirm-destructive-title"
              className="font-bold text-gray-900 dark:text-white text-base font-montserrat"
            >
              Confirm bulk delete
            </h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
              This will delete {deleteCount} {countNoun}
              {rangeClause}. Type{" "}
              <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                delete
              </span>{" "}
              to confirm.
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canConfirm) {
              e.preventDefault();
              onConfirm();
            }
          }}
          placeholder="Type 'delete' to confirm"
          autoComplete="off"
          spellCheck={false}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
        />

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-3 py-2 text-sm font-semibold rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className={cn(
              "flex-1 px-3 py-2 text-sm font-semibold rounded text-white transition-colors",
              canConfirm
                ? "bg-red-600 hover:bg-red-700"
                : "bg-red-300 dark:bg-red-900 cursor-not-allowed opacity-60"
            )}
          >
            Delete {deleteCount} {countNoun}
          </button>
        </div>
      </div>
    </>
  );
}
