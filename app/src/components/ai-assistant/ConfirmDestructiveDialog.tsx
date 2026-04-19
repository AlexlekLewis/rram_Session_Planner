"use client";

import { useEffect, useState, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { PendingBulkConfirm } from "@/hooks/useAssistant";
import { cn } from "@/lib/utils";

/**
 * Typed-confirmation dialog for destructive AI bulk operations.
 *
 * The user must type the word "delete" (case-insensitive) before the
 * Confirm button enables. Matches the pattern used by GitHub, Stripe,
 * Supabase, etc. for irreversible destructive actions.
 *
 * Dismiss contract:
 *   - Escape key                  → cancel
 *   - Click on the backdrop       → cancel (target-guard against drag-close)
 *   - Click the X button          → cancel
 *   - Click Cancel                → cancel
 *   - Type "delete" + click Confirm (or press Enter) → confirm
 */
interface ConfirmDestructiveDialogProps {
  confirm: PendingBulkConfirm;
  onConfirm: () => void;
  onCancel: () => void;
}

const CONFIRM_PHRASE = "delete";

export function ConfirmDestructiveDialog({
  confirm,
  onConfirm,
  onCancel,
}: ConfirmDestructiveDialogProps) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const isMatched = typed.trim().toLowerCase() === CONFIRM_PHRASE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMatched) onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        // Backdrop close — only if the click originated on the backdrop itself.
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-destructive-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Dialog */}
      <div
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md"
        // Stop propagation so internal clicks don't reach the backdrop handler
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2
                  id="confirm-destructive-title"
                  className="text-base font-semibold text-gray-900 dark:text-white"
                >
                  Confirm destructive change
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {confirm.destructiveCount === 1
                    ? "This change permanently removes data."
                    : `This will perform ${confirm.destructiveCount} destructive actions.`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1 -m-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            className={cn(
              "rounded-lg border px-3 py-2.5 text-xs whitespace-pre-wrap",
              "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800",
              "text-red-900 dark:text-red-200 font-mono leading-relaxed"
            )}
          >
            {confirm.summary}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm-destructive-input"
              className="block text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Type <span className="font-mono font-semibold">delete</span> to confirm
            </label>
            <input
              ref={inputRef}
              id="confirm-destructive-input"
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "w-full px-3 py-2 text-sm rounded border font-mono",
                "focus:outline-none focus:ring-2",
                isMatched
                  ? "border-red-400 focus:ring-red-200 dark:focus:ring-red-900 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600 focus:ring-gray-200 dark:focus:ring-gray-700",
                "dark:bg-gray-700 dark:text-white"
              )}
              placeholder="delete"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-3 py-2 text-sm font-semibold rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatched}
              className={cn(
                "flex-1 px-3 py-2 text-sm font-semibold rounded text-white transition-colors",
                isMatched
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
              )}
            >
              Confirm delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
