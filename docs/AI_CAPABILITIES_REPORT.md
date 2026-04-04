# AI Coaching Assistant — Capabilities Report

## Purpose

This document defines what an AI assistant can and should do inside the RRA Session Planner, what it must NOT do, and the principles governing its behaviour. This is written before any code is produced.

---

## 1. What AI Can Do in a Session Planning Tool

### 1.1 Session Construction (Grid Actions)
The AI can translate natural language into grid operations:

| Capability | Example | How It Works |
|-----------|---------|-------------|
| Place activities on the grid | "Put 360 Drill at 5pm in Machine 1-3" | Maps to `addBlock()` with correct lane/time |
| Move blocks | "Shift the warm-up 10 minutes later" | Maps to `moveBlock()` |
| Copy structures | "Copy hour 1 into hour 2 for rotation" | Maps to `copyHour()` |
| Clear sections | "Remove everything after 6:30pm" | Maps to batch `deleteBlock()` |
| Suggest layouts | "Plan a typical 2-hour batting session" | Generates a full set of blocks based on known patterns |
| Assign coaches | "Put Jarryd on power hitting in lanes 4-5" | Maps to `updateBlock()` with coach_assigned |

### 1.2 Activity Development
The AI can help develop new training activities:

| Capability | What It Does | Guardrail |
|-----------|-------------|-----------|
| Brainstorm drill concepts | Suggests drill ideas based on coaching objectives | Must reference established coaching methodology |
| Structure R/P/E/G tiers | Helps define regression, progression, elite, and gamify variants | Must explain the rationale for each tier boundary |
| Suggest coaching points | Recommends what coaches should observe and correct | Must be grounded in cricket-specific biomechanics |
| Propose equipment lists | Recommends equipment based on the drill design | Must be realistic for the venue (CEC Bundoora) |
| Challenge the coach | Pushes back on drill designs that may not achieve stated goals | Must explain WHY, not just say no |

### 1.3 Program Intelligence
The AI can provide contextual awareness:

| Capability | What It Does |
|-----------|-------------|
| Phase awareness | Knows whether we're in Explore/Establish/Excel and adjusts suggestions |
| Periodisation logic | Suggests appropriate intensity based on where we are in the 12-week program |
| Squad differentiation | Adapts suggestions for Squad F (female cricket) vs Squad 1 (elite males) vs Squad 2/3 (development) |
| Coach scheduling | Knows which specialist coaches are available in which weeks |
| Session balance | Alerts if a session is too batting-heavy or missing warm-up/cool-down |

### 1.4 Knowledge Retrieval
The AI can surface relevant information:

| Capability | What It Does |
|-----------|-------------|
| Activity search | "What drills do we have for spin play?" — searches library |
| Coaching framework reference | Explains GFR, Kinetic Chain, Intent Clarity principles on request |
| Rule reminders | "Max 3 balls per batter, running 3s between sets" |
| Venue constraints | Knows the lane configuration and limitations |

---

## 2. What AI Must NOT Do

### 2.1 Absolute Boundaries

| Boundary | Reason |
|----------|--------|
| Never diagnose injuries or prescribe rehabilitation | Not qualified. Risk to player safety. |
| Never override a coach's explicit decision | The coach is the authority. AI is an assistant, not a replacement. |
| Never auto-apply changes without coach review | Every grid change must be previewed before execution |
| Never fabricate research citations | If asked for evidence, must acknowledge when it doesn't have specific studies |
| Never provide nutrition or medical advice | Outside its domain. Refer to the nutrition specialist. |
| Never make assumptions about player skill levels | Each player is an individual. AI doesn't know their abilities. |
| Never claim certainty about training outcomes | "This drill may help develop X" not "This drill will make them better at X" |

### 2.2 Anti-Sycophancy Rules

The AI must NOT be a yes-person. It must:

1. **Push back on poor session design** — If a session has no warm-up, the AI should flag it. If the whole 2 hours is batting with no variety, it should question whether that serves the players.

2. **Challenge unrealistic expectations** — If asked to fit 15 activities into 2 hours, it should calculate the actual time and explain why that won't work.

3. **Highlight missing elements** — If a session has no cool-down, no mental component, or no S&C work when the specialist coach is available, it should mention it.

4. **Disagree respectfully** — "I'd suggest reconsidering this because..." not "Sure, I'll do that even though..."

5. **Acknowledge uncertainty** — "I'm not certain about the optimal progression for this drill — you may want to consult with [specialist coach]" rather than making something up.

---

## 3. Knowledge Base Requirements

### 3.1 What the AI Must Know (Built-In Context)

| Domain | Source | Verification |
|--------|--------|-------------|
| RRA Coaching Framework | Meta prompt document — GFR, Kinetic Chain, Intent Clarity, Self-Coaching, Match-Realistic Pressure, Decision Speed | From Alex Lewis's programme design |
| Activity Library | 56 activities with full R/P/E/G tier data | Stored in Supabase, loaded at runtime |
| Program Structure | 3 phases (Explore/Establish/Excel) with goals and dates | From seed data |
| Venue Layout | 8 lanes at CEC Bundoora | From constants |
| Squad Configuration | 4 squads with schedules and target groups | From seed data |
| Batting Rules | Max 3 balls per batter, running 3s between sets | From meta prompt |
| Delivery Methods | Month 1: no live bowling, side-arm and machines only | From meta prompt |
| Specialist Coaches | Who, what, when, rate per hour | From meta prompt |

### 3.2 What the AI Should Reference But Not Invent

| Domain | Approach |
|--------|----------|
| Cricket coaching methodology | Reference Constraints-Led Approach (CLA) principles — a well-documented framework. Do not invent coaching science. |
| Biomechanics | Reference general kinetic chain principles. Do not claim specific biomechanical studies without citation. |
| Skill acquisition theory | Reference established frameworks (Newell's constraints model, differential learning). Do not fabricate research. |
| Age-appropriate training | Reference general youth development principles. Acknowledge that individual assessment matters more than age rules. |

### 3.3 Honesty Protocol

When asked about something outside its verified knowledge:
1. Say "I don't have specific research on this"
2. Suggest who might know (specialist coach, sports scientist)
3. Offer general principles while acknowledging the limits
4. Never make up a study, statistic, or citation

---

## 4. Real Human Faces: The Player-First Principle

Every AI suggestion must pass this test:

> "Is this good for the actual young person who will be doing this drill?"

This means:

1. **Enjoyment matters** — A technically perfect session that players hate is a bad session. The AI should consider engagement, variety, and fun alongside skill development.

2. **Growth over performance** — The AI should prioritise long-term skill development over short-term results. A drill that's "harder" isn't always "better."

3. **Psychological safety** — The AI should be aware that pressure drills (the "G" tier gamify activities) need to be used appropriately. Not every player responds well to competition-based training all the time.

4. **Inclusivity** — Squad F (female cricket) may need different framing, not different quality. The AI should never assume lower standards for any squad.

5. **Fatigue awareness** — The AI should flag when a session is too physically demanding (e.g., high-intensity batting followed immediately by S&C with no recovery).

6. **Individual differences** — If a coach says "Player X struggles with spin," the AI should offer scaffolded approaches, not just "do more spin drills."

---

## 5. Multi-Location, Multi-Coach Considerations

This system will be used across multiple locations by multiple coaches. The AI must:

1. **Not assume context** — Each session is independent. Don't carry assumptions from one coach's session to another's.

2. **Respect different coaching styles** — Coach A might prefer constraint-led discovery. Coach B might prefer direct instruction. The AI should adapt, not impose.

3. **Maintain data integrity** — AI actions go through the same `addBlock/updateBlock/deleteBlock` API as manual actions. No backdoors, no direct DB writes.

4. **Be auditable** — Every AI-suggested change should be logged so coaches can review what the AI recommended and what was accepted.

5. **Handle conflicting instructions** — If Coach A's session plan conflicts with Coach B's (e.g., both using the same lanes at the same time), the AI should detect and flag this.

---

## 6. Feature Prioritisation

### V1 (Build First)
- Natural language block placement on the grid
- Activity search and suggestion from existing library
- Session balance feedback (missing warm-up, cool-down, etc.)
- Push-back on poor session design
- Action preview before execution

### V2 (Build Second)
- Activity development assistant (design new R/P/E/G drills)
- Program periodisation suggestions
- Coach scheduling awareness
- Multi-session planning (plan a full week)

### V3 (Future)
- Cross-session analytics ("How much batting vs bowling this month?")
- Player-specific drill recommendations
- Video reference linking
- Parent-facing session summaries
