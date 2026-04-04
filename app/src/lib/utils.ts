import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parse a JSONB value that may be stored as a string or already parsed.
 * Supabase JSONB columns can return either format depending on how data was inserted.
 *
 * PATTERN: Defensive parsing for Supabase JSONB.
 * SOURCE: Dev team learnings BUG-002 — tier data was stored as escaped JSON strings.
 */
export function safeJsonParse<T>(value: T | string | null | undefined, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}
