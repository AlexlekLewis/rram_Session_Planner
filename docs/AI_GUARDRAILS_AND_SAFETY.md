# AI Guardrails & Safety Framework

## Core Principle

**The AI is an assistant coach, not the head coach.** Every suggestion is a recommendation. Every grid action requires the coach's approval. The AI never acts unilaterally on the session plan.

---

## 1. Action Safety Levels

### Level 1: Auto-Execute (Low Risk)
Actions the AI can execute immediately after showing them in chat:
- Search the activity library
- Provide information about coaching frameworks
- Answer questions about the current session state
- Calculate session statistics (total batting time, coach utilisation, etc.)

### Level 2: Preview + Confirm (Medium Risk)
Actions that modify the grid — shown as a preview card in chat, coach clicks "Apply" to execute:
- Add a single block to the grid
- Move a block to a new position
- Update block properties (coach, tier, coaching notes)
- Delete a single block

### Level 3: Batch Preview + Confirm (High Risk)
Actions that make multiple changes — shown as a numbered list of changes, coach reviews all before clicking "Apply All":
- Build an entire session plan (10+ blocks)
- Copy hour (duplicating blocks)
- Clear a time range
- Restructure existing blocks

### Level 4: Never Auto-Execute
Actions that always require manual intervention:
- Create new activities in the library (coach must review R/P/E/G content)
- Delete sessions entirely
- Modify program phases or squad configuration
- Any action affecting data shared across coaches

---

## 2. Anti-Hallucination Guardrails

### 2.1 Activity References
- The AI can ONLY reference activities that exist in the `sp_activities` table
- If asked about an activity that doesn't exist, it must say "I don't see that in your library. Would you like to create it?"
- It must NEVER invent activity names, coaching points, or equipment lists that aren't in the database

### 2.2 Coaching Science Claims
- The AI provides coaching guidance based on the documented RRA framework (GFR, Kinetic Chain, Intent Clarity, etc.)
- It does NOT cite specific research studies unless they are included in the knowledge base
- When asked for evidence, it says: "The RRA framework emphasises [principle]. For specific research, I'd recommend consulting [appropriate resource]."

### 2.3 Player Claims
- The AI has NO information about individual player abilities
- It must NEVER say "Player X would benefit from..." unless the coach has explicitly shared that context in the conversation
- It CAN say "For players who struggle with [skill], consider [approach]" — keeping it general

### 2.4 Outcome Predictions
- The AI must NEVER guarantee training outcomes
- "This drill helps develop X" not "This drill will improve their X by Y%"
- "Players often find this engaging" not "Players love this drill"

---

## 3. Fact-Verification Protocol

Every AI response that contains a coaching recommendation is checked against:

### Tier 1: Verified Facts (Hard-Coded)
These are built into the system prompt and cannot be overridden:
- Lane configuration (8 lanes, types, labels)
- Time grid (5-minute increments, session duration)
- Batting rules (3 balls max, running 3s)
- Tier definitions (R=simplified, P=added complexity, E=match pace, G=competition)
- Phase dates and goals
- Squad schedules

### Tier 2: Knowledge Base (Loaded at Runtime)
These come from the database and are always current:
- Activity library (56+ activities with tier data)
- Session history (what's already planned)
- Coach roster (who's available)

### Tier 3: Coaching Principles (In System Prompt)
These are well-documented frameworks included in the AI's context:
- Constraints-Led Approach (CLA)
- Ground Force Reaction (GFR)
- Kinetic Chain Sequencing
- Intent Clarity
- Decision Speed > Execution Quality

### Tier 4: General Knowledge (AI's Training)
The AI can draw on general cricket and coaching knowledge BUT must:
- Distinguish between "the RRA framework says" and "generally in cricket coaching"
- Acknowledge when something is opinion vs. established practice
- Never present general knowledge as RRA-specific policy

---

## 4. Push-Back Rules

The AI must push back in these scenarios:

| Scenario | AI Response |
|----------|------------|
| Session with no warm-up | "I notice there's no warm-up planned. Daily Vitamins typically starts each session — should I add it at the beginning?" |
| Session exceeds physical capacity | "This session has 90 minutes of continuous high-intensity work with no water break. I'd recommend adding a 5-minute transition at the halfway point." |
| All lanes doing the same thing | "All 8 lanes are running the same drill. This means groups aren't rotating — is that intentional, or should we set up parallel activities?" |
| No cool-down | "There's no cool-down or debrief at the end. The last 10 minutes could include a mental performance module — would that work?" |
| Tier mismatch | "You've selected Elite (E) tier for a drill in the Explore phase. The Explore phase typically starts at Regression (R). Should I adjust?" |
| Over-scheduled specialist | "Jarryd Rodgers is assigned to 5 blocks simultaneously across lanes 2-6. He can only be in one place — should we split this into rotation groups?" |
| Missing variety | "This 2-hour session is 100% batting. Consider adding fielding, S&C, or mental performance to develop well-rounded cricketers." |

---

## 5. Audit Trail

Every AI interaction is logged:

```typescript
interface AuditEntry {
  timestamp: string;
  session_id: string;
  user_id: string;
  user_message: string;
  ai_response: string;
  actions_proposed: Action[];
  actions_accepted: Action[];
  actions_rejected: Action[];
}
```

This allows:
- Review of what the AI suggested vs. what was accepted
- Pattern analysis (does the AI frequently suggest things coaches reject?)
- Accountability (who made which changes and why)
- Training data for improving the AI's suggestions over time

---

## 6. Multi-Coach Safety

### Data Isolation
- Each AI conversation is scoped to ONE session
- The AI cannot read or modify other sessions
- The AI cannot access other coaches' conversations
- Chat history is per-session, not global

### Conflict Detection
- Before executing any block placement, the AI checks `hasCollision()`
- If a collision is detected, it reports it and suggests alternatives
- It never overwrites another coach's blocks

### Role Enforcement
- The AI checks the user's role before suggesting actions
- Guest coaches see read-only suggestions (no "Apply" buttons)
- Players don't see the AI assistant at all
- Only head_coach and assistant_coach can execute AI suggestions

---

## 7. Continuous Improvement

### Feedback Loop
After each AI action, the chat shows:
- "Was this helpful?" (thumbs up/down)
- Feedback stored in audit trail
- Patterns reviewed to improve system prompt

### Knowledge Base Updates
- When coaches create new activities, they're automatically available to the AI
- When coaching framework updates, the system prompt is updated
- No "drift" — the AI always operates on current data

---

## 8. Emergency Off-Switch

If the AI produces harmful or incorrect suggestions:
1. **Per-session disable** — Coach can close the panel and it stays closed
2. **Per-user disable** — Head coach can disable AI for specific users via settings
3. **Global disable** — Environment variable `NEXT_PUBLIC_AI_ENABLED=false` turns it off for everyone
4. **No data dependency** — The app works perfectly without the AI. It's additive, not load-bearing.
