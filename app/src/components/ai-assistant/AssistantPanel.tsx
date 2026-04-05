"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage as ChatMessageType, ThreadSummary, Attachment } from "@/hooks/useAssistant";
import { ChatMessage } from "./ChatMessage";
import { cn } from "@/lib/utils";
import { X, Send, Sparkles, Trash2, ChevronDown, Plus, MessageSquare, Paperclip, Image as ImageIcon } from "lucide-react";

/** Max file size: 5MB (Anthropic limit for base64 images) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageType[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  onApplyActions: (messageId: string) => void;
  onClearChat: () => void;
  threads?: ThreadSummary[];
  activeThreadId?: string | null;
  onSwitchThread?: (id: string) => void;
  onNewChat?: () => void;
}

export function AssistantPanel({
  isOpen,
  onClose,
  messages,
  isLoading,
  error,
  onSendMessage,
  onApplyActions,
  onClearChat,
  threads = [],
  activeThreadId,
  onSwitchThread,
  onNewChat,
}: AssistantPanelProps) {
  const [input, setInput] = useState("");
  const [showThreads, setShowThreads] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  /** Convert a File to an Attachment with base64 data */
  const fileToAttachment = useCallback(async (file: File): Promise<Attachment | null> => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return null;
    }
    if (file.size > MAX_FILE_SIZE) {
      return null;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1]; // Strip data:...;base64, prefix
        resolve({
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          filename: file.name,
          mediaType: file.type,
          data: base64,
          size: file.size,
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }, []);

  /** Process files from input or drop */
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).slice(0, 5); // Max 5 attachments
    const results = await Promise.all(fileArray.map(fileToAttachment));
    const valid = results.filter(Boolean) as Attachment[];
    if (valid.length > 0) {
      setPendingAttachments(prev => [...prev, ...valid].slice(0, 5));
    }
  }, [fileToAttachment]);

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleSend = () => {
    if ((!input.trim() && pendingAttachments.length === 0) || isLoading) return;
    onSendMessage(input.trim(), pendingAttachments.length > 0 ? pendingAttachments : undefined);
    setInput("");
    setPendingAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full w-[420px] bg-white dark:bg-gray-900 shadow-xl z-30",
        "transform transition-transform duration-300 ease-in-out",
        "flex flex-col border-l border-gray-200 dark:border-gray-700",
        isOpen ? "translate-x-0" : "translate-x-full",
        isDragOver && "ring-2 ring-inset ring-rr-pink/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rr-blue to-rr-pink flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white font-montserrat">
              AI Coach
            </h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Session planning assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onNewChat && (
            <button
              onClick={() => { onNewChat(); setShowThreads(false); }}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="New chat"
            >
              <Plus className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {threads.length > 0 && onSwitchThread && (
            <button
              onClick={() => setShowThreads(!showThreads)}
              className={cn(
                "p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors",
                showThreads && "bg-gray-100 dark:bg-gray-800"
              )}
              title="Past conversations"
            >
              <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showThreads && "rotate-180")} />
            </button>
          )}
          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close assistant"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Thread selector dropdown */}
      {showThreads && threads.length > 0 && onSwitchThread && (
        <div className="border-b border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => { onSwitchThread(t.id); setShowThreads(false); }}
              className={cn(
                "w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                t.id === activeThreadId && "bg-rr-pink/5 border-l-2 border-rr-pink"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {t.title || "Untitled chat"}
                </p>
                <p className="text-[10px] text-gray-400">
                  {new Date(t.updated_at).toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rr-blue/10 to-rr-pink/10 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-rr-pink" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
              How can I help?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[280px] mx-auto leading-relaxed">
              I can help you plan sessions, place activities on the grid, suggest drills, and give coaching feedback.
            </p>
            <div className="mt-4 space-y-2">
              {[
                "Add Daily Vitamins warm-up at 5pm across all lanes",
                "Plan a batting-focused first hour",
                "What spin drills do we have?",
                "Is this session well-balanced?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSendMessage(suggestion)}
                  className="block w-full text-left text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition"
                >
                  &ldquo;{suggestion}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onApplyActions={msg.role === "assistant" ? onApplyActions : undefined}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-2 items-start">
            <div className="w-7 h-7 rounded-full bg-rr-pink/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-rr-pink animate-pulse" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl rounded-bl-sm px-3.5 py-2.5">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-rr-pink/5 flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg px-6 py-4 flex items-center gap-3 border-2 border-dashed border-rr-pink">
            <ImageIcon className="w-6 h-6 text-rr-pink" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Drop images here</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 shrink-0">
        {error && (
          <div className="text-xs text-red-500 mb-2 px-1">{error}</div>
        )}

        {/* Attachment previews */}
        {pendingAttachments.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {pendingAttachments.map((att) => (
              <div key={att.id} className="relative group">
                {att.mediaType.startsWith("image/") && att.data ? (
                  <img
                    src={`data:${att.mediaType};base64,${att.data}`}
                    alt={att.filename}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center">
                    <Paperclip className="w-4 h-4 text-gray-400 mb-1" />
                    <span className="text-[8px] text-gray-500 truncate max-w-[56px] px-1">{att.filename.split(".").pop()?.toUpperCase()}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
                <span className="text-[8px] text-gray-400 block text-center mt-0.5 truncate max-w-[64px]">
                  {att.filename.length > 10 ? att.filename.slice(0, 8) + "..." : att.filename}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
              e.target.value = ""; // Reset to allow re-selecting same file
            }}
          />

          {/* Attach button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition",
              "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-rr-pink",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            title="Attach image or PDF"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingAttachments.length > 0 ? "Add a message about this image..." : "Ask me to plan your session..."}
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600",
              "bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white",
              "px-3.5 py-2.5 outline-none",
              "focus:ring-2 focus:ring-rr-pink/30 focus:border-rr-pink",
              "placeholder-gray-400 dark:placeholder-gray-500",
              "max-h-32"
            )}
            style={{ minHeight: "40px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && pendingAttachments.length === 0) || isLoading}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition",
              (input.trim() || pendingAttachments.length > 0) && !isLoading
                ? "bg-rr-pink text-white hover:bg-rr-pink/90"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-gray-400 mt-1 px-1">
          Attach images (JPG, PNG, WebP, GIF) or PDFs up to 5MB
        </p>
      </div>
    </div>
  );
}
