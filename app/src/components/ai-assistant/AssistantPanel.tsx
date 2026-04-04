"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage as ChatMessageType } from "@/hooks/useAssistant";
import { ChatMessage } from "./ChatMessage";
import { cn } from "@/lib/utils";
import { X, Send, Sparkles, Trash2 } from "lucide-react";

interface AssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessageType[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (text: string) => void;
  onApplyActions: (messageId: string) => void;
  onClearChat: () => void;
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
}: AssistantPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        "fixed right-0 top-0 h-full w-[420px] bg-white dark:bg-gray-900 shadow-xl z-30",
        "transform transition-transform duration-300 ease-in-out",
        "flex flex-col border-l border-gray-200 dark:border-gray-700",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
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

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 shrink-0">
        {error && (
          <div className="text-xs text-red-500 mb-2 px-1">{error}</div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to plan your session..."
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
            disabled={!input.trim() || isLoading}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition",
              input.trim() && !isLoading
                ? "bg-rr-pink text-white hover:bg-rr-pink/90"
                : "bg-gray-100 dark:bg-gray-800 text-gray-400"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
