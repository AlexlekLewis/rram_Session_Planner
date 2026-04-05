import { NextRequest, NextResponse } from "next/server";
import { ASSISTANT_TOOLS } from "@/lib/assistant-tools";
import { ADMIN_TOOLS } from "@/lib/admin-tools";

/**
 * AI Coaching Assistant API Route
 *
 * Proxies messages to the Claude API with the session planner's
 * tool definitions. The ANTHROPIC_API_KEY is server-side only —
 * never exposed to the client.
 *
 * PATTERN: Next.js API route → Anthropic Messages API with tool-use
 * SOURCE: Anthropic docs — "Tool use" + "Streaming Messages"
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
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages.slice(-20), // Trim to last 20 messages to manage context
        tools: isAdmin ? [...ASSISTANT_TOOLS, ...ADMIN_TOOLS] : ASSISTANT_TOOLS,
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
