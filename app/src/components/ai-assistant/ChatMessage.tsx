"use client";

import { ChatMessage as ChatMessageType, ToolCallAction } from "@/hooks/useAssistant";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, Sparkles, Paperclip, Image as ImageIcon } from "lucide-react";

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
            {message.attachments.map((att) => (
              <div key={att.id}>
                {att.data && att.mediaType.startsWith("image/") ? (
                  /* Live image with base64 data (current session) */
                  <img
                    src={`data:${att.mediaType};base64,${att.data}`}
                    alt={att.filename}
                    className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-white/20"
                  />
                ) : (
                  /* Metadata-only placeholder (loaded from DB) */
                  <div className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs",
                    isUser ? "bg-white/10" : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  )}>
                    {att.mediaType.startsWith("image/") ? (
                      <ImageIcon className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    )}
                    <span className="truncate max-w-[120px]">{att.filename}</span>
                    <span className="opacity-50">({formatSize(att.size)})</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message text */}
        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>

        {/* Tool call actions preview */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Proposed Changes
            </div>

            {message.toolCalls.map((action) => (
              <ActionCard key={action.id} action={action} />
            ))}

            {!message.actionsApplied && onApplyActions && (
              <button
                onClick={() => onApplyActions(message.id)}
                className="w-full mt-2 py-2 px-3 text-xs font-semibold text-white bg-rr-pink hover:bg-rr-pink/90 rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Apply {message.toolCalls.length === 1 ? "Change" : `All ${message.toolCalls.length} Changes`}
              </button>
            )}

            {message.actionsApplied && (
              <div className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1 mt-1">
                <Check className="w-3 h-3" /> Applied
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({ action }: { action: ToolCallAction }) {
  const hasError = !!action.error;

  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 text-xs",
        hasError
          ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
      )}
    >
      <div className="flex items-start gap-2">
        {hasError ? (
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
        ) : (
          <div className="w-3.5 h-3.5 rounded-full bg-rr-pink/20 shrink-0 mt-0.5 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-rr-pink" />
          </div>
        )}
        <div>
          <span className={cn("font-medium", hasError ? "text-red-700 dark:text-red-400" : "text-gray-800 dark:text-gray-200")}>
            {action.description}
          </span>
          {hasError && (
            <p className="text-red-500 dark:text-red-400 mt-0.5">{action.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
