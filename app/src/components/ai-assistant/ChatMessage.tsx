"use client";

import { ChatMessage as ChatMessageType, ToolCallAction, ApplyResult } from "@/hooks/useAssistant";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, Sparkles, Paperclip, Image as ImageIcon, FileSpreadsheet, FileText, X as XIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: ChatMessageType;
  onApplyActions?: (messageId: string) => void;
}

/** Format file size in human-readable form */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function ChatMessage({ message, onApplyActions }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-rr-pink/10 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-rr-pink" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
          isUser
            ? "bg-rr-blue text-white rounded-br-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
        )}
      >
        {/* Attachment thumbnails */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {message.attachments.map((att) => {
              // Images — live preview only (base64 body is memory-only, not persisted)
              if (att.data && att.mediaType.startsWith("image/")) {
                return (
                  <img
                    key={att.id}
                    src={`data:${att.mediaType};base64,${att.data}`}
                    alt={att.filename}
                    className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-white/20"
                  />
                );
              }

              // Pick an icon for the metadata pill
              const isSpreadsheet = att.kind === "spreadsheet";
              const isPdf = att.kind === "pdf" || att.mediaType === "application/pdf";
              const isImage = att.mediaType.startsWith("image/");
              const Icon = isSpreadsheet
                ? FileSpreadsheet
                : isPdf
                  ? FileText
                  : isImage
                    ? ImageIcon
                    : Paperclip;

              // Size hint: for spreadsheets, show parsed text KB (more useful
              // than original file bytes). Falls back to raw bytes otherwise.
              const parsedChars = att.textContent?.length ?? 0;
              const sizeLabel =
                isSpreadsheet && parsedChars > 0
                  ? `${Math.round(parsedChars / 1024)} KB parsed`
                  : formatSize(att.size);

              return (
                <div
                  key={att.id}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs",
                    isUser
                      ? "bg-white/10"
                      : isSpreadsheet
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
                        : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  )}
                  title={att.filename}
                >
                  <Icon
                    className={cn(
                      "w-3.5 h-3.5 shrink-0",
                      isSpreadsheet && !isUser
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "opacity-60"
                    )}
                  />
                  <span className="truncate max-w-[160px]">{att.filename}</span>
                  <span className="opacity-50">({sizeLabel})</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Message text */}
        {isUser ? (
          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-gray-900 dark:prose-headings:text-gray-100">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Tool call actions preview */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Proposed Changes
            </div>

            {message.toolCalls.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                result={message.applyResults?.find((r) => r.actionId === action.id)}
              />
            ))}

            {/* Apply button — hidden once a successful full-apply has landed.
                For partial applies the button stays so the user can retry. */}
            {!message.actionsApplied && onApplyActions && (
              <button
                onClick={() => onApplyActions(message.id)}
                className="w-full mt-2 py-2 px-3 text-xs font-semibold text-white bg-rr-pink hover:bg-rr-pink/90 rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {message.actionsPartiallyApplied ? "Retry Failed" : `Apply ${message.toolCalls.length === 1 ? "Change" : `All ${message.toolCalls.length} Changes`}`}
              </button>
            )}

            {message.actionsApplied && (
              <div className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1 mt-1">
                <Check className="w-3 h-3" /> Applied
              </div>
            )}

            {message.actionsPartiallyApplied && !message.actionsApplied && (
              <div className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" /> Partially applied — some actions failed
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({ action, result }: { action: ToolCallAction; result?: ApplyResult }) {
  // Validation-time error (known before Apply was clicked) OR runtime error
  // collected during apply. Either way, render the red treatment.
  const validationError = action.error;
  const runtimeError = result?.status === "error" ? result.error : undefined;
  const hasError = !!(validationError || runtimeError);
  const succeeded = result?.status === "success";

  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 text-xs",
        hasError
          ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          : succeeded
            ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
            : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
      )}
    >
      <div className="flex items-start gap-2">
        {hasError ? (
          <XIcon className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" aria-label="Failed" />
        ) : succeeded ? (
          <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" aria-label="Applied" />
        ) : (
          <div className="w-3.5 h-3.5 rounded-full bg-rr-pink/20 shrink-0 mt-0.5 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-rr-pink" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "font-medium",
              hasError
                ? "text-red-700 dark:text-red-400"
                : succeeded
                  ? "text-green-800 dark:text-green-300"
                  : "text-gray-800 dark:text-gray-200"
            )}
          >
            {action.description}
          </span>
          {hasError && (
            <p className="text-red-500 dark:text-red-400 mt-0.5 break-words">
              {validationError || runtimeError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
