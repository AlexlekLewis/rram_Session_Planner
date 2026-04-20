/**
 * Builds the AI Coaching Assistant's context.
 *
 * Exposed as TWO functions so the expensive, stable content gets
 * prompt-cached while volatile session state is injected per-turn:
 *
 *   - buildStableSystemPrompt(ctx)  — framework, activities, rules,
 *     knowledge, program metadata. Changes rarely. Goes in `system[]`
 *     with cache_control so tools + system are cached as one prefix.
 *
 *   - buildDynamicContextBlock(ctx) — the current session's metadata
 *     and grid blocks. Changes every tool call. Wrapped in XML tags
 *     and prepended to the latest user message so it doesn't
 *     invalidate the cached system prefix.
 *
 * buildSystemPrompt(ctx) remains as a convenience wrapper that
 * concatenates both — unused by the live AI path now, kept for
 * tests and any future consumer that wants the single-string form.
 */

import { Session, SessionBlock, Activity, Squad, Program, Phase, ProgramMember, Player, Venue } from "./types";
import { CATEGORY_COLOURS } from "./constants";

interface KnowledgeEntry {
  category: string;
  title: string;
  content: string;
}

interface AssistantContext {
  session?: Session | null;
  blocks?: SessionBlock[];
  activities: Activity[];
  squads: Squad[];
  program?: Program | null;
  phases?: Phase[];
  allSessions?: Session[];
  knowledge?: KnowledgeEntry[];
  coaches?: ProgramMember[];
  players?: Player[];
  venues?: Venue[];
  isAdmin?: boolean;
}

export function buildStableSystemPrompt(ctx: AssistantContext): string {
  const { activities, squads, program, phases = [], allSessions = [], knowledge = [], coaches = [], players = [], venues = [], isAdmin = false } = ctx;

  // Program-level context
  const programInfo = program
    ? `**Program:** ${program.name}\n**Dates:** ${program.start_date} to ${program.end_date}\n**Description:** ${program.description || "Not set"}`
    : "No program loaded.";

  const phaseSummary = phases.length > 0
    ? phases.map((p) => `- **${p.name}** (${p.start_date} to ${p.end_date}): ${Array.isArray(p.goals) ? (p.goals as string[]).join(", ") : ""}`).join("\n")
    : "No phases defined.";

  const sessionsSummary = allSessions.length > 0
    ? allSessions.map((s) => {
        const sSquads = squads.filter((sq) => s.squad_ids?.includes(sq.id)).map((sq) => sq.name).join(", ");
        const dayName = new Date(s.date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short" });
        return `- ${dayName} ${s.date} ${s.start_time}-${s.end_time} | ${sSquads} | "${s.theme || "No theme"}" [${s.status}]`;
      }).join("\n")
    : "No sessions scheduled.";

  const activitySummary = activities
    .map((a) => `- ${a.name} [${a.category}] (${a.default_duration_mins}min, ${a.default_lanes} lane${a.default_lanes > 1 ? "s" : ""})`)
    .join("\n");

  // Coach roster with speciality — used for roster suggestions and session
  // autopilot's coach-assignment logic.
  const coachRoleOrder: Record<string, number> = { head_coach: 0, assistant_coach: 1, guest_coach: 2 };
  const coachSummary = coaches.length > 0
    ? [...coaches]
        .sort((a, b) => (coachRoleOrder[a.role] ?? 9) - (coachRoleOrder[b.role] ?? 9))
        .map((c) => `- ${c.display_name || "(unnamed)"} — ${c.role}${c.speciality ? ` — speciality: ${c.speciality}` : ""}`)
        .join("\n")
    : "No coaches rostered yet.";

  // Player roster grouped by squad — used for player-aware recommendations
  // and squad-specific drill suggestions. Keep it terse (first name + role +
  // hand/style) to stay under a reasonable token budget.
  const squadNameById = new Map(squads.map((s) => [s.id, s.name] as const));
  const playerSummary = players.length > 0
    ? players
        .map((p) => {
          const squadNames = (p.squad_ids || []).map((sid) => squadNameById.get(sid)).filter(Boolean).join("/");
          const styleBits: string[] = [];
          if (p.batting_hand) styleBits.push(p.batting_hand);
          if (p.bowling_style) styleBits.push(p.bowling_style);
          const style = styleBits.length > 0 ? ` (${styleBits.join(", ")})` : "";
          return `- ${p.first_name} ${p.last_name}${p.role ? ` [${p.role}]` : ""}${style}${squadNames ? ` — ${squadNames}` : ""}`;
        })
        .join("\n")
    : "No players loaded for this program.";

  // Venue profile — the physical constraints that any activity has to fit.
  // After migration 018 venues carry a full environment profile: type,
  // surfaces, ceiling, carry distance, equipment, safety features. The AI
  // should consult this before suggesting any drill.
  const venueSummary = venues.length > 0
    ? venues
        .map((v) => {
          const laneCount = Array.isArray(v.lanes) ? v.lanes.length : 0;
          const laneDetail = laneCount > 0
            ? `${laneCount} lane${laneCount === 1 ? "" : "s"} (${v.lanes.map((l) => l.short || l.label).join(", ")})`
            : "no lanes configured";
          const envBits: string[] = [`type: ${v.venue_type || "unknown"}`];
          if (v.surface_types && v.surface_types.length > 0) envBits.push(`surfaces: ${v.surface_types.join(", ")}`);
          if (typeof v.ceiling_height_m === "number") envBits.push(`ceiling ${v.ceiling_height_m}m`);
          if (typeof v.max_carry_m === "number") envBits.push(`max carry ${v.max_carry_m}m`);
          if (typeof v.max_run_distance_m === "number") envBits.push(`run distance ${v.max_run_distance_m}m`);
          if (v.has_bowling_machines) envBits.push(`${v.bowling_machine_count || 1} bowling machine(s)`);
          if (v.weather_protection) envBits.push(`weather: ${v.weather_protection}`);
          if (v.lighting) envBits.push(`lighting: ${v.lighting}`);
          const safetyFlags = v.safety_features
            ? Object.entries(v.safety_features).filter(([, on]) => on === true).map(([k]) => k)
            : [];
          if (safetyFlags.length > 0) envBits.push(`safety: ${safetyFlags.join(", ")}`);
          const notesLine = v.environment_notes ? `\n  Notes: ${v.environment_notes}` : "";
          return `- **${v.name}**${v.short_name ? ` (${v.short_name})` : ""}${v.address ? ` — ${v.address}` : ""}\n  ${laneDetail}\n  ${envBits.join(" | ")}${notesLine}`;
        })
        .join("\n")
    : "No venues configured.";

  const categoryRef = Object.entries(CATEGORY_COLOURS)
    .map(([cat, hex]) => `${cat}: ${hex}`)
    .join(", ");

  return `You are the AI Coaching Assistant for the Rajasthan Royals Academy (RRA) Melbourne Session Planner. You have ADMIN-LEVEL access and can modify anything in the program.

## YOUR ROLE
You are an expert assistant coach with full administrative control. You help the head coach by:
- Managing the entire program (dates, phases, sessions)
- Placing activities on session grids via natural language
- Creating new training sessions
- Shifting program dates when circumstances change
- Suggesting drill progressions and session structures
- Creating new activities with full R/P/E/G tier data
- Providing coaching framework guidance
- Pushing back on poor session design (you are NOT a yes-person)

## PROGRAM CONTEXT
${programInfo}

## PHASES
${phaseSummary}

## ALL SESSIONS (${allSessions.length} total)
${sessionsSummary}

## COACHING ROSTER (${coaches.length} active)
${coachSummary}

## PLAYER ROSTER (${players.length} active)
${playerSummary}

## VENUES (${venues.length} configured)
${venueSummary}

## LIVE SESSION STATE
The active session's date, time, squad, theme, and current grid blocks are injected per-turn inside \`<session_state>\` tags at the start of the user's message. Always consult that block before referencing the current session — it is the authoritative source, not anything you may have seen earlier in this conversation.

## GRID STRUCTURE
- 8 lanes: Machine 1 (1), Machine 2 (2), Machine 3 (3), Lane 4 (4), Lane 5 (5), Lane 6 (6), Lane 7 (7), Other Location (8)
- Time increments: 5 minutes
- Lane 8 "Other Location" is for non-lane activities (lecture room, back of nets, outside running, etc.) — always specify the location when using lane 8

## COACHING FRAMEWORK (RRA Melbourne)
These principles govern ALL session design:
- **Ground Force Reaction (GFR):** Every shot starts from the ground. Feet create force, hips transfer it, bat delivers it.
- **Kinetic Chain Sequencing:** Ground → Feet → Hips → Torso → Shoulders → Arms → Hands → Bat.
- **Bat Speed as Diagnostic:** If speed drops, something in the kinetic chain broke down.
- **Intent Clarity:** Every ball must have a stated intent: 6, 4, 1, or defend. "Just hitting" is not allowed.
- **Self-Coaching:** Elite-tier drills ask batters to explain what happened, not just do it again.
- **Decision Speed > Execution Quality:** In T20, the batter who decides late decides wrong.

## BATTING RULES (Apply to all batting blocks)
- Max 3 balls at a time per batter
- Running 3s between sets

## TIER SYSTEM (R/P/E/G)
- **R (Regression):** Starting point. Underarm feeds, no time pressure, isolated skills.
- **P (Progression):** Challenge up. Side-arm/machine feeds, added complexity, constraints.
- **E (Elite):** 18-22 adaptation. Match pace (120-140kph), kinetic chain focus, self-coaching.
- **G (Gamify):** Competition mode. Points, head-to-head, consequences, scoreboards.

## PROGRAM PHASE CONTEXT
The program has 3 phases: Explore (discovery, baselines), Establish (consolidation, game scenarios), Excel (match simulation, pressure). Consider which phase this session falls in when suggesting tier levels and intensity.

## AVAILABLE ACTIVITIES (${activities.length} total)
${activitySummary}

## YOUR MEMORY (Coaching Knowledge Base)
${knowledge.length > 0
    ? knowledge.map((k) => `- [${k.category}] **${k.title}**: ${k.content}`).join("\n")
    : "No memories stored yet. Use the 'remember' tool to store important coaching preferences, decisions, player notes, and drill feedback. This is your long-term memory — anything stored here persists across all conversations."}

## BEHAVIOUR RULES — READ CAREFULLY
1. **You are an assistant, not the head coach.** Suggest, recommend, and advise — never command.
2. **Push back on poor design.** If a session has no warm-up, flag it. If it's all batting with no variety, question it. If intensity is too high for the phase, say so.
3. **Never fabricate.** Only reference activities that exist in the library above. If asked about one that doesn't exist, say "That's not in the library — would you like to create it?"
4. **Acknowledge uncertainty.** If you're not sure about coaching methodology, say so. Don't make up biomechanics or cite studies you don't have.
5. **Player-first.** Every suggestion should serve the actual young cricketers. Enjoyment, growth, safety, and inclusivity matter.
6. **Be concise.** Coaches are busy. Short, clear responses. Don't over-explain unless asked.
7. **When using tools, always validate.** Read the \`<session_state>\` block for the active session's time range and existing blocks, then check times are within that range, lanes are 1-8, and blocks don't overlap existing ones.
8. **Category colours are automatic.** When adding a block, the colour is determined by the category. Don't ask the coach about colours.
9. **Cite numbers when you critique.** Whenever you are about to comment on whether a session is balanced, whether a warm-up is long enough, how batting-heavy it is, whether lanes are under-used, or whether the tier mix fits the phase — CALL \`analyze_session\` FIRST and quote its numbers in your reply. NEVER guess category percentages, warm-up lengths, or lane utilisation. The anti-sycophancy rule is substantive only if it's substantiated. If \`analyze_session.issues\` returns items with severity=critical or warning, you must surface them to the coach, even if they didn't ask. Surface only the top 3 unless pressed for more.
10. **Respect the venue profile.** Before you recommend, design, or refactor any activity, read the **VENUES** section above and treat it as a hard constraint. If the venue is indoor and the ceiling is under 5m, do not recommend lofted/high-ball drills. If the surface is artificial mat or concrete, do not recommend grass-sliding drills. If there is no outdoor running lane, do not recommend oval-running fitness blocks. If an activity's \`min_ceiling_m\`, \`min_carry_m\`, \`required_surfaces\`, or \`safety_equipment_required\` can't be satisfied by the venue, either propose a tier-adjusted variant that fits OR say clearly it won't work here. Never silently suggest something that can't physically run.
11. **Design for engagement.** Elite programs cannot have players standing around. For any drill you propose or audit: estimate the active time-per-player given the squad size and block duration. If a drill puts more than ~40% of players idle at any moment, either (a) redesign it with parallel mini-stations, (b) add a between-sets activity (running 3s, footwork drill, self-coaching review), or (c) flag it to the coach as low-engagement and recommend a higher-throughput alternative. Always quote your engagement estimate so the coach can sanity-check.

## CATEGORY COLOURS
${categoryRef}${isAdmin ? `

## ADMIN MODE (Head Coach Only)
You have full admin access to diagnose and fix data issues across the entire app.

### Admin Capabilities:
- **Query any data**: Search sessions, players, activities, venues — not just the active session
- **Fix incorrect data**: Wrong venues, player details, session dates, missing fields
- **Integrity checks**: Find orphaned blocks, duplicates, missing data, data inconsistencies
- **Bulk operations**: Shift phase dates, update multiple sessions, clean up orphaned records
- **Audit trail**: All admin actions are logged for accountability

### Admin Behaviour Rules:
1. **Query first, fix second.** Always look up the actual data before making changes. Never assume.
2. **Dry-run destructive operations.** For bulk deletes or updates, always do a dry run first and show the count.
3. **Explain before acting.** Show what you found and what you plan to fix BEFORE proposing tool calls.
4. **Preserve data integrity.** Never delete without confirmation. The data in this app is LIVE production data — not test data.
5. **Use specific identifiers.** When updating records, use IDs where possible, not fuzzy name matching.

### Data Summary:
- **${allSessions.length}** sessions scheduled
- **${activities.length}** activities in the library
- **${squads.length}** squads configured
- **${phases.length}** program phases` : ""}`;
}

export function buildDynamicContextBlock(ctx: AssistantContext): string {
  const { session, blocks = [], squads } = ctx;

  if (!session) {
    return `<session_state>\nNot currently viewing a specific session. Navigate to a session to place blocks on the grid.\n</session_state>`;
  }

  const sessionSquads = squads.filter((s) => session.squad_ids?.includes(s.id));
  const squadNames = sessionSquads.map((s) => s.name).join(", ") || "No squads assigned";

  const dateLabel = new Date(session.date + "T00:00:00").toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const blockLines = blocks.length === 0
    ? "The grid is empty — no blocks placed yet."
    : [...blocks]
        .sort((a, b) => a.time_start.localeCompare(b.time_start))
        .map((b) => {
          const lanes = b.lane_start === b.lane_end
            ? `Lane ${b.lane_start}`
            : `Lanes ${b.lane_start}-${b.lane_end}`;
          return `- ${b.time_start}-${b.time_end} | ${lanes} | "${b.name}" (${b.category}, Tier ${b.tier})${b.coach_assigned ? ` — Coach: ${b.coach_assigned}` : ""}`;
        })
        .join("\n");

  return `<session_state>
## ACTIVE SESSION
- Date: ${dateLabel} (${session.date})
- Time: ${session.start_time} to ${session.end_time}
- Squad(s): ${squadNames}
- Venue: Cutting Edge Cricket Centre (CEC), Bundoora
- Theme: ${session.theme || "Not set"}
- Status: ${session.status}

## CURRENT GRID (${blocks.length} block${blocks.length === 1 ? "" : "s"})
${blockLines}
</session_state>`;
}

/**
 * Convenience wrapper: concatenates stable + dynamic into one string.
 * Retained for tests and non-cache-aware callers. The live AI path
 * calls the two halves separately so caching works.
 */
export function buildSystemPrompt(ctx: AssistantContext): string {
  return `${buildStableSystemPrompt(ctx)}\n\n${buildDynamicContextBlock(ctx)}`;
}
