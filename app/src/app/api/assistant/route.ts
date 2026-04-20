import { NextRequest, NextResponse } from "next/server";
import { ASSISTANT_TOOLS } from "@/lib/assistant-tools";
import { ADMIN_TOOLS } from "@/lib/admin-tools";

/**
 * Head-coach-only subset of ASSISTANT_TOOLS. These mutate the shared
 * activity library, so non-admin coaches must not be shown them — if
 * Claude sees the definitions it will happily propose them to an
 * assistant coach and the Apply click fails server-side with a role
 * error. Filter here so Claude never offers what the user can't execute.
 */
const HEAD_COACH_ONLY_TOOLS = new Set([
  "refactor_activity",
  "draft_activity_from_brief",
]);

/**
 * AI Coaching Assistant API Route
 *
 * Proxies messages to the Claude API with the session planner's
 * tool definitions. The ANTHROPIC_API_KEY is server-side only —
 * never exposed to the client.
 *
 * Model: claude-opus-4-7. Prompt caching is enabled via ephemeral
 * cache_control on the system block — this caches tools + system
 * together (Anthropic renders tools → system → messages, so one
 * breakpoint on the last system block covers both). Cache hits
 * require byte-identical prefixes; dynamic session state baked
 * into the system prompt will miss — see assistant-context.ts.
 */

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI assistant not configured. ANTHROPIC_API_KEY is missing." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { messages, systemPrompt, isAdmin } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    if (!systemPrompt || typeof systemPrompt !== "string") {
      return NextResponse.json({ error: "systemPrompt is required" }, { status: 400 });
    }

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-7",
        max_tokens: 4096,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: messages.slice(-20), // Trim to last 20 messages to manage context
        tools: isAdmin
          ? [...ASSISTANT_TOOLS, ...ADMIN_TOOLS]
          : ASSISTANT_TOOLS.filter((t) => !HEAD_COACH_ONLY_TOOLS.has(t.name)),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", response.status, errorText);

      if (response.status === 429) {
        return NextResponse.json(
          { error: "AI assistant is busy. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: "AI assistant encountered an error. Please try again." },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Assistant API error:", error);
    return NextResponse.json(
      { error: "Failed to connect to AI assistant." },
      { status: 500 }
    );
  }
}
