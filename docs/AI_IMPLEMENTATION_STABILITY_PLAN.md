# AI Implementation Stability Plan

## Core Rule: The AI Feature is Additive, Not Structural

The AI assistant is a panel that sits alongside the existing session planner. It uses the SAME APIs (`addBlock`, `updateBlock`, `deleteBlock`) that the manual UI uses. It does NOT introduce new data flows, new database tables for session data, or new state management patterns.

**If the AI feature were removed entirely, the app would work exactly as it does today.**

---

## 1. Blast Radius Analysis

### What the AI Feature Touches

| Layer | What Changes | What Does NOT Change |
|-------|-------------|---------------------|
| **UI** | New AssistantPanel component, new toolbar button | All existing components unchanged |
| **Hooks** | New useAssistant hook | Existing hooks (useSessionBlocks, useAutoSave, useUndoRedo, etc.) unchanged |
| **API** | New /api/assistant route | Existing Supabase queries unchanged |
| **Database** | New sp_assistant_logs table (audit only) | All 8 existing tables unchanged |
| **Auth** | Role check on assistant visibility | Existing RLS policies unchanged |
| **State** | Chat messages state in useAssistant | Block state managed by existing useSessionBlocks |

### What the AI Feature Does NOT Touch
- Session grid rendering (GridCanvas, GridBlock)
- Block collision detection
- Auto-save logic
- Undo/redo
- Realtime sync
- Copy/paste and Copy Hour
- Month view, Session list, Settings
- Activity library (read-only access from AI)
- RLS policies
- Authentication flow

---

## 2. Integration Pattern: Message Bus

The AI assistant communicates with the session grid through a **one-way callback pattern**:

```
AI decides to add a block
  → calls onAddBlock(blockData) callback
    → session page's addBlock() runs (same as manual creation)
      → undoRedo.pushState() is called (undo works)
      → blockManager.addBlock() updates state
      → useAutoSave detects change and saves
      → useRealtimeSync broadcasts to other users
```

**The AI NEVER bypasses the standard block management pipeline.** It enters the same code path as a mouse drag-to-create action. This means:
- Collision detection applies to AI actions
- Undo/redo captures AI actions
- Auto-save persists AI actions
- Realtime sync broadcasts AI actions
- RLS policies apply to AI actions

---

## 3. Failure Modes and Mitigations

| Failure | Impact | Mitigation |
|---------|--------|-----------|
| Claude API down | AI chat doesn't work | App works perfectly without AI. Show "AI assistant temporarily unavailable" |
| Claude returns invalid tool call | Block not created | Validate all tool call parameters before executing. Show error in chat. |
| Claude hallucinates activity name | Activity not found | Check activity exists in DB before creating block with activity_id |
| ANTHROPIC_API_KEY missing | API route returns 500 | Check env var at startup, disable AI button if missing |
| Rate limit exceeded | 429 error from Claude | Show "Please wait a moment" in chat. Retry with exponential backoff |
| Large conversation context | Slow or failed API calls | Trim chat history to last 20 messages. Session state is always current. |
| AI suggests overlapping blocks | Collision detected | Run hasCollision() before execution. Report conflict in chat. |

---

## 4. Testing Strategy for AI Feature

### Unit Tests (Before Integration)
- Tool call parameter validation (lane range, time format, category enum)
- System prompt construction (verify it includes correct session state)
- Action preview rendering
- Chat message parsing

### Integration Tests (After Integration)
- "Add 360 Drill at 5pm in lane 1" → verify block appears at correct position
- "Move the warm-up to 5:10" → verify block moved, old position empty
- "Delete everything after 6pm" → verify only blocks after 6pm removed
- Collision test: "Add block at 5pm lane 1" when block already there → verify error message
- Undo test: AI adds block → Ctrl+Z → block removed
- Auto-save test: AI adds block → wait 500ms → verify block in Supabase

### Live Browser Tests
- Open AI panel, type message, verify response appears
- Verify action preview shows before execution
- Verify "Apply" button executes the action
- Verify coach can reject an action
- Verify dark mode styling on chat panel
- Verify mobile: panel should be full-screen overlay on mobile

### Regression Tests (After AI Feature Ships)
Run the full 10/10 regression suite to verify:
- Login still works
- Month view still shows correct dates
- Session list still loads
- Grid still renders, drag-to-create still works
- Activity library still opens
- Settings still functional
- Dark mode still works
- Mobile still responsive
- Copy Hour still works
- PDF export still works

---

## 5. Dev Team Review Process

### Before Any AI Code Ships

1. **Architecture Review** — Does the AI feature touch any existing code path? If yes, document the exact change and verify it doesn't break existing behaviour.

2. **API Contract Review** — Does the tool call schema match the `addBlock`/`updateBlock`/`deleteBlock` signatures exactly? Any mismatch = rejected.

3. **System Prompt Review** — Is the system prompt providing accurate coaching information? Cross-reference with the meta prompt and ACTIVITY_LIBRARY_INTEGRATION.md.

4. **Safety Review** — Do the guardrails prevent hallucination, sycophancy, and harmful suggestions? Test with adversarial prompts.

5. **Regression Test** — Full 10/10 suite passes after AI feature is integrated.

### Ongoing

- Every AI-related code change gets its own commit (not bundled with other features)
- Commit messages clearly state what changed and why
- Memory file updated with any new learnings
- Dev team learnings file updated if new anti-patterns are discovered

---

## 6. Rollback Plan

If the AI feature causes any instability:

1. **Soft disable:** Set `NEXT_PUBLIC_AI_ENABLED=false` in `.env.local` → AI button disappears, all AI code is tree-shaken by Next.js
2. **Hard rollback:** Revert to the pre-AI commit (all AI code is in new files, existing files have minimal changes)
3. **Database:** The `sp_assistant_logs` table is independent. Dropping it has zero impact on the app.

---

## 7. Performance Considerations

| Concern | Approach |
|---------|----------|
| Claude API latency (1-3 seconds) | Stream responses so user sees text appearing in real-time |
| System prompt size | Keep under 8K tokens. Session state is summarised, not dumped raw |
| Chat history growth | Trim to last 20 messages. Older messages archived but not sent to API |
| Multiple users using AI simultaneously | Each user has independent API calls. No shared state. |
| Cost per request | Claude Haiku for simple queries, Sonnet for complex session planning. Estimated $0.01-0.05 per interaction |

---

## 8. Implementation Order

1. **API route first** — Build and test `/api/assistant` with tool definitions. Verify Claude returns correct tool calls for test prompts. No UI needed yet.
2. **useAssistant hook** — Build the state management. Message history, API calls, action parsing. Test with console.log.
3. **AssistantPanel UI** — Build the chat interface. Connect to hook. Verify messages display.
4. **Action execution** — Wire tool calls to `addBlock`/`updateBlock`/`deleteBlock`. Test with simple commands.
5. **Action preview** — Add the preview cards. Coach clicks "Apply" to execute.
6. **Push-back logic** — Add session balance checks, missing element detection.
7. **Regression test** — Full 10/10 suite.
8. **Ship.**
