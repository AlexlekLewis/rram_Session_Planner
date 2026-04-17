# RRA Session Planner — Head Coach UX Audit

**Audit Date:** 2026-04-17  
**Reviewer:** UX Designer / Product Strategist  
**Perspective:** Head Coach (Alex Lewis) planning sessions on desktop Mon-Wed evenings, reviewing trackside on mobile Thu-Sun  
**Codebase Review:** Complete component walkthrough from login → session grid → settings

---

## JOURNEY 1: MONDAY NIGHT PLANNING (DESKTOP)

### Finding 1.1: No Phase Context in Session Detail View
**Severity:** MEDIUM  
**Journey Step:** Click session day → /dashboard/session/[id]  

**What the head coach expects:**
- Clear visual banner showing "We're in Phase 1: Explore" with dates and training theme
- Reference to phase goals (Discover, Acquire, Progress, Expand) while designing the session
- Session theme context (e.g., "Week 3: Skill Acquisition focus")

**What the app actually does:**
- Session header shows: Date, time, squad badges, specialist coaches assigned
- NO phase context displayed anywhere on the session edit page
- Coach must mentally context-switch back to the calendar to recall the phase

**Code Location:**  
`/app/src/app/dashboard/session/[id]/page.tsx` (lines 37-290)  
`/app/src/components/calendar/PhaseBanner.tsx` — exists but only on Month View, not Session View

**Recommended Fix:**
Display a compact PhaseBanner or inline phase indicator in the session header alongside the theme/date. Reuse the PhaseBanner component from the month view.

**Downchain Risk:**
- Coach relies on memory for periodisation rules
- Risk of misaligned tier (e.g., Elite tier activities in Explore phase)

---

### Finding 1.2: Grid Block Creation Workflow is Ambiguous
**Severity:** MEDIUM  
**Journey Step:** "How do I add a block?" → Drag to select → CreateBlockModal appears

**What the head coach expects:**
- Clear visual cue that dragging creates blocks (like Google Sheets cell selection)
- Modal immediately ready for input, name field focused
- Quick category/tier selection before confirming

**What the app actually does:**
- Drag-to-select works smoothly; modal appears at cursor position
- Modal input field is focused (✓ good)
- However: Category defaults to "batting", tier defaults to "R" — no visual warning if wrong
- Coach must actively verify category before confirming (easy to miss)
- No preview of the block's colour until confirmation

**Code Location:**  
`/app/src/components/session-grid/SessionGrid.tsx` (lines 55-77)  
`/app/src/components/session-grid/CreateBlockModal.tsx` (lines 32-80)

**Recommended Fix:**
- Add a small live preview swatch showing the selected category colour
- Highlight the category dropdown to draw attention it needs manual selection
- Add a tooltip on first-time use: "Drag to select cells → Choose activity → Confirm"

**Downchain Risk:**
- Coach accidentally creates "batting" blocks when they meant "fielding"
- No undo immediately visible, so mistake requires delete + recreate

---

### Finding 1.3: Copy Hour Dialog — Limited Visibility of Slots
**Severity:** LOW  
**Journey Step:** Click "Copy Hour" button → CopyHourDialog opens

**What the head coach expects:**
- See all available time slots clearly
- Preview of what will be copied (source lane/time)

**What the app actually does:**
- Dialog shows dropdowns with 15-minute intervals (every 3rd slot)
- Validation messages (overlap warning, session boundary) work correctly
- HOWEVER: If session is 2 hours (17:00-19:00), only 5 options show: 17:00, 17:15, 17:30, 17:45, 18:00
- Coach sees limited granularity; doesn't know they could copy a 20-minute range

**Code Location:**  
`/app/src/components/session-grid/CopyHourDialog.tsx` (lines 24-25)  
Uses `filter((_, i) => i % 3 === 0)` — reduces 24 slots (5-min) to 8 slots (15-min)

**Recommended Fix:**
- Show 5-minute granularity option (advanced toggle)
- OR: Add a visual timeline diagram showing the range being copied

**Downchain Risk:**
- Coach thinks Copy Hour only works in 1-hour blocks (it doesn't)
- Misses the efficiency of copying custom ranges

---

### Finding 1.4: Save Status Display is Subtle
**Severity:** LOW  
**Journey Step:** Add/edit blocks → SaveIndicator shows in header

**What the head coach expects:**
- Clear confirmation that work is being saved automatically
- Visible indicator in the main header or corner

**What the app actually does:**
- SaveIndicator appears in header with icon + text ("Saved ✓", "Saving...", "Error!")
- Appears after 500ms debounce
- HOWEVER: Positioned in the session header (line 290: `<SaveIndicator status={saveStatus} />`)
- Text is small (text-xs, font-medium), easy to miss if coach is focused on grid

**Code Location:**  
`/app/src/components/shared/SaveIndicator.tsx` (lines 9-62)  
Session page header integration: `/app/src/app/dashboard/session/[id]/page.tsx` (line 290)

**Recommended Fix:**
- No code change needed; visual design sufficient
- Coach will notice "Error!" immediately
- Good as-is for MVP

**Downchain Risk:**
- None significant; auto-save is working

---

### Finding 1.5: Activity Library Not Discoverable Without Opening Panel
**Severity:** MEDIUM  
**Journey Step:** Coach wants to place "360 Drill" → Doesn't see where library is

**What the head coach expects:**
- Obvious button/icon to open Activity Library side panel
- Maybe labeled "Library" or icon that's intuitive

**What the app actually does:**
- LibraryPanel is opened via a button (likely hamburger or library icon), but NOT visible in current code review
- Search the page for the library toggle button... NOT FOUND in SessionGrid or main session page layout

**Code Location:**  
`/app/src/app/dashboard/session/[id]/page.tsx` (line 290+)  
Session page imports LibraryPanel but the button to toggle it is MISSING from visible JSX

**Recommended Fix:**
- Add a visible "📚 Activity Library" button in the session header or sidebar toggle
- Make it toggle the LibraryPanel open/closed
- Consider a keyboard shortcut (e.g., Alt+L)

**Downchain Risk:**
- CRITICAL: Coach cannot discover or use the Activity Library at all
- Forced to create all blocks manually from scratch
- This is a hidden feature, not a bug—but usability is broken

---

### Finding 1.6: Undo/Redo Status Not Visible
**Severity:** LOW  
**Journey Step:** Accidentally delete a block → Try Ctrl+Z

**What the head coach expects:**
- Visual confirmation undo worked (block reappears)
- Maybe a toast notification "Block restored"

**What the app actually does:**
- Undo/redo works silently; no confirmation shown
- Block reappears, but coach has to verify by looking at the grid
- useUndoRedo hook is implemented, but no toast or status feedback

**Code Location:**  
`/app/src/app/dashboard/session/[id]/page.tsx` (lines 149-165, keyboard shortcuts)  
`/app/src/hooks/useUndoRedo.ts` — works silently

**Recommended Fix:**
- Add a small toast notification when undo/redo executes: "Undo: Block deleted" or "Redo: Block restored"
- Visual feedback takes 200ms to appear, gives coach confidence

**Downchain Risk:**
- Low; coach can see the effect visually. Toast would be nice-to-have.

---

## JOURNEY 2: ASSIGNING COACHES & PLAYERS

### Finding 2.1: SessionCoachBar Lacks Clear Specialist Coach Selection Workflow
**Severity:** HIGH  
**Journey Step:** Session page → SessionCoachBar (coach allocation section)

**What the head coach expects:**
- Dropdown to assign "Jarryd Rodgers — Power Hitting" to specific session/lane
- Ability to set specialist coach's role (specialist_coach, squad_coach, assistant)
- See which specialist coaches are available this week

**What the app actually does:**
- SessionCoachBar displays rostered coaches grouped by role (Squad/Assistant/Specialist)
- "Add Coach" button opens a picker showing all unrostered coaches
- HOWEVER: No connection to availability or scheduling
- No "weekly specialist availability" context (e.g., "Jarryd available Weeks 3-12")
- Coach must manually remember: "Is Bowl Strong available this week?"

**Code Location:**  
`/app/src/components/session-grid/SessionCoachBar.tsx` (lines 42-189)  
Coach availability is passed but NOT displayed: `availability` prop is unused (line 37)

**Recommended Fix:**
- Display coach availability inline (e.g., green checkmark "Available this week")
- Add a link to "View specialist schedule" that opens a modal showing which weeks each specialist is booked
- Show coach notes/hourly rate as a tooltip

**Downchain Risk:**
- Coach double-books a specialist (assigns Bowl Strong to Week 5, forgetting they're already booked elsewhere)
- Scheduling conflicts discovered too late

---

### Finding 2.2: SquadAvailability is Read-Only; No Add Player Flow
**Severity:** HIGH  
**Journey Step:** Settings → Players Tab → See squad capacity

**What the head coach expects:**
- View which squads are at capacity
- Quickly add a new player to a recommended squad
- See how many females per squad (rule: min 4)

**What the app actually does:**
- SquadAvailability component displays stats (capacity, females needed)
- Shows "best pairings" for new players — ONE WEEKDAY + ONE WEEKEND squad
- HOWEVER: This is READ-ONLY; clicking does nothing
- To add a player, coach must navigate to PlayersTab, find the add button, fill a form
- No integration between "SquadAvailability says Squad F needs 2 females" and "add player to Squad F"

**Code Location:**  
`/app/src/components/settings/SquadAvailability.tsx` (lines 50-140)  
`/app/src/components/settings/PlayersTab.tsx` (lines 65+)  
No click handler on SquadAvailability cards

**Recommended Fix:**
- Make squad cards clickable; clicking opens the "Add Player" modal with that squad pre-selected
- Show a "Quick Add" button next to the squad that reads "Add Female (needed: 2)"
- Highlight undersupplied squads in red

**Downchain Risk:**
- Coach adds players to squads without checking capacity first
- Manual process creates friction between data visibility and action

---

### Finding 2.3: No Double-Booking Detection for Coaches
**Severity:** CRITICAL  
**Journey Step:** Assign specialist coach to multiple sessions simultaneously

**What the head coach expects:**
- System warns: "Jarryd is already assigned to Session B on Thursday 5pm — same time. OK to overbook?"
- Clear visibility of coach schedule across all sessions

**What the app actually does:**
- SessionCoachBar allows adding a coach to a session with no conflict checking
- No warning if coach is assigned to another session in the same time slot
- No global coach schedule view

**Code Location:**  
`/app/src/components/session-grid/SessionCoachBar.tsx` — no collision detection  
`/app/src/app/dashboard/session/[id]/page.tsx` — coach data loaded but not validated

**Recommended Fix:**
- Before roster a coach, check `sp_session_coaches` table for other assignments in same time range
- Show warning: "Jarryd is already coaching Session X (Thu 5-6pm). This session is Thu 5-7pm. 1-hour overlap."
- Add a "Coach Schedule" view in settings that shows all coach assignments across the month

**Downchain Risk:**
- MAJOR: Coach overbooking causes double-shifts or broken sessions
- No visibility until day-of or late in planning

---

## JOURNEY 3: TUESDAY NIGHT ON MOBILE (IPHONE — 375PX WIDTH)

### Finding 3.1: Grid Does Not Render at 375px Width
**Severity:** CRITICAL  
**Journey Step:** Open session on phone → Grid should show lanes + time

**What the head coach expects:**
- Horizontal scroll to see all 8 lanes
- Vertical scroll to see full 2-hour session
- Blocks visible with readable text

**What the app actually does:**
- SessionGrid uses CSS grid: `gridTemplateColumns: "64px minmax(600px, 1fr)"`
- Minimum column width for grid content is 600px (line 125 in SessionGrid.tsx)
- On 375px phone, this overflows and creates horizontal scroll of the ENTIRE grid
- Lane headers not pinned to top during horizontal scroll (sticky positioning might fail on mobile)
- Block text is text-xs (12px), readable but cramped

**Code Location:**  
`/app/src/components/session-grid/SessionGrid.tsx` (line 125)  
Sticky grid layout: `gridTemplateColumns: "64px minmax(600px, 1fr)"`

**Recommended Fix:**
- Use responsive grid: 
  - Desktop (>768px): minmax(600px, 1fr)
  - Mobile (<375px): minmax(320px, 1fr) or stack lanes vertically
- Or: Implement a mobile-specific condensed layout that shows 2-3 lanes at a time with swipe navigation
- Add horizontal scroll indicators (chevrons) on mobile

**Downchain Risk:**
- CRITICAL: App is unusable on phone during sessions
- Coach cannot check or adjust plan from trackside

---

### Finding 3.2: AI Assistant Panel Not Responsive to Mobile
**Severity:** MEDIUM  
**Journey Step:** Open Assistant to ask "Add 360 Drill at 5pm" on phone

**What the head coach expects:**
- AssistantPanel slides up from bottom (or side) without blocking grid
- Can still see the session while chatting with AI

**What the app actually does:**
- AssistantPanel is fixed right-side panel (w-96 = 384px)
- On 375px phone, panel OVERLAPS entire grid or is cut off
- No mobile drawer/bottom-sheet version
- Unusable one-handed while standing trackside

**Code Location:**  
`/app/src/components/ai-assistant/AssistantPanel.tsx` (line 99)  
`fixed right-0 top-0 h-full w-96` — hard-coded desktop layout

**Recommended Fix:**
- Implement responsive panel:
  - Desktop: Right side w-96
  - Mobile: Bottom drawer (h-2/3, bottom-0, left-0, right-0)
- Use swipe-down to close on mobile
- Make input field sticky at bottom for easy typing

**Downchain Risk:**
- AI assistant unusable on phone, even though that's when coach needs it most

---

### Finding 3.3: No Attendance Marking Feature (Missing Entirely)
**Severity:** CRITICAL  
**Journey Step:** During session, coach marks attendance as players arrive

**What the head coach expects:**
- Quick way to check off players as present
- Visual indicator (✓ present, ✗ absent, ? late)
- Syncs to Supabase for post-session reporting

**What the app actually does:**
- NO attendance feature exists in the codebase
- Only session planning (pre-session) is built
- No "Mark Attendance" tab or modal
- This is listed as out-of-scope in PRD ("attendance tracking exists in separate system")

**Code Location:**
- Feature completely missing

**Recommended Fix:**
- OUT OF SCOPE for this audit, but coach will expect it
- Document in onboarding: "Use [External System] for attendance; we'll sync later"

**Downchain Risk:**
- MAJOR: Coach has incomplete tool. Planning is done in this app, but session management isn't.

---

### Finding 3.4: Export PDF Button Works But Low Discoverability on Mobile
**Severity:** LOW  
**Journey Step:** Want to print session for printing display/hand out to players

**What the head coach expects:**
- "Export PDF" button in header, easy to find
- PDF shows grid + coaching notes in clean format
- Can email or AirDrop to assistant

**What the app actually does:**
- ExportPdfButton exists and is integrated into session header
- Works on desktop; layout may break on mobile PDF
- Button position in header might be hidden by other controls on small screens

**Code Location:**  
`/app/src/components/shared/ExportPdfButton.tsx`  
`/app/src/app/dashboard/session/[id]/page.tsx` (line 290)

**Recommended Fix:**
- Test PDF export at 375px width
- Consider showing export menu on mobile (PDF / Email / Share)
- Add a "Download" icon button that's always visible on mobile

**Downchain Risk:**
- Low; coach doesn't print often. Website snapshot is alternative.

---

## JOURNEY 4: ASSISTANT COACH ON-DUTY (MOBILE, READ-ONLY)

### Finding 4.1: Assistant Coach View is Empty/Not Implemented
**Severity:** CRITICAL  
**Journey Step:** Assistant coach logs in → /dashboard → What do they see?

**What the head coach expects:**
- Assistant sees ONLY their assigned lanes/blocks for today's session
- Can see coaching notes and player groups for their blocks
- Cannot edit (read-only confirmed)
- Can see time, activity names, tier, coach cues

**What the app actually does:**
- There is a `/dashboard/player/session/[id]/page.tsx` for read-only view
- However: This is hard-coded as "Player" view, not "Assistant Coach" view
- No filtering by coach role or assigned lanes
- Shows ALL blocks in the session (unfiltered)
- No lane-by-lane detail view
- ReadOnlyGrid displays everything; no "My Lanes" filtering

**Code Location:**  
`/app/src/app/dashboard/player/session/[id]/page.tsx`  
`/app/src/components/session-grid/ReadOnlyGrid.tsx` (no filtering)

**Recommended Fix:**
- Create a separate `/dashboard/assistant-coach/session/[id]` page
- Filter blocks by coach_assigned = current user
- Highlight coach's assigned lanes with a border or background colour
- Show a "Your Blocks" list sidebar with links to jump to each block
- Add coaching notes prominently (currently buried in BlockDetailPanel)

**Downchain Risk:**
- CRITICAL: Assistant coaches cannot use this app during sessions
- They get overwhelmed seeing all 8 lanes; can't find their own blocks
- Defeats the purpose of the read-only view for support staff

---

### Finding 4.2: No Lane-by-Lane Schedule for Assistants
**Severity:** HIGH  
**Journey Step:** Assistant wants to know "What do I do in lanes 4-5 from 5:45-6:00?"

**What the head coach expects:**
- Simple list or visual of blocks assigned to assistant
- Sorted by time
- Show lane(s) and activity name clearly

**What the app actually does:**
- ReadOnlyGrid shows the full grid with all blocks
- No way to filter or highlight lanes assigned to current user
- No "My Schedule" list view
- Assistant must scan the entire grid to find their blocks

**Code Location:**  
`/app/src/app/dashboard/player/session/[id]/page.tsx` (lines 15-80)  
ReadOnlyGrid has no role-based filtering

**Recommended Fix:**
- Add a sidebar "My Session Plan" that shows:
  ```
  5:00-5:15  Lanes 1-3  Daily Vitamins (R)
  5:15-5:30  Lanes 1-3  360 Drill (P)
  ...
  ```
- Clicking each block highlights it on the grid
- Mobile: Show as a collapsed list that expands on tap

**Downchain Risk:**
- Assistant coach is inefficient; spends 5 min per session looking for their blocks

---

## JOURNEY 5: SETTINGS & ONGOING ADMIN

### Finding 5.1: Adding a New Player is Multi-Step & Lacks Feedback
**Severity:** MEDIUM  
**Journey Step:** Settings → Players Tab → + Add Player → Form → Save

**What the head coach expects:**
- Click "Add Player" → Form appears with all fields
- Pre-fill squad based on availability recommendation
- Submit → Immediate success toast
- Player appears in list below

**What the app actually does:**
- PlayersTab has an "Add Player" button
- Modal opens with form fields (first name, last name, role, cricket type, batting hand, bowling style, squad)
- On submit: API call to Supabase
- Success: Modal closes, list refreshes
- HOWEVER: No toast notification confirming success
- If network error, unclear error message (generic "Failed to add player")

**Code Location:**  
`/app/src/components/settings/PlayersTab.tsx` (lines 80+)  
Form submission likely in useEffect hook; no toast integration visible

**Recommended Fix:**
- Add `import { toast } from "sonner"` (already in project)
- Show `toast.success("Player added: [Name]")` on success
- Show `toast.error("Failed to add player: [reason]")` on error
- Pre-select squad based on SquadAvailability recommendation

**Downchain Risk:**
- Low; coach will verify by checking the list. But clarity is missing.

---

### Finding 5.2: Coach Roster Management is Read-Only (Cannot Edit Roles)
**Severity:** MEDIUM  
**Journey Step:** Settings → Coaches Tab → Try to change a coach's speciality

**What the head coach expects:**
- See all coaches (head, assistants, guests, specialists)
- Click to edit: name, speciality, availability, hourly rate
- Save changes

**What the app actually does:**
- CoachRosterTable displays coaches read-only
- "Edit" button exists (Pencil icon) and opens CoachProfileModal
- Modal allows editing: name, email, role, speciality, bio
- BUT: No "availability" field (weeks available)
- No "hourly rate" field
- Changes submitted to Supabase; success is silent (no toast)

**Code Location:**  
`/app/src/components/coaches/CoachRosterTable.tsx`  
`/app/src/components/coaches/CoachProfileModal.tsx`

**Recommended Fix:**
- Add fields to CoachProfileModal:
  - availability_start_date
  - availability_end_date
  - hourly_rate
  - weekly_hour_capacity (for scheduling)
- Add toast success/error feedback on save
- Show a "Booked Weeks" calendar next to each coach

**Downchain Risk:**
- Coach cannot track specialist availability by week (e.g., Jarryd: Weeks 3-12)
- Manual tracking outside app

---

## MOBILE-SPECIFIC PAIN POINTS (SUMMARY)

### Aggregated Mobile Issues:

1. **Grid Layout Breaks at 375px** (CRITICAL)
   - Minimum column width of 600px forces horizontal scroll
   - Sticky headers may not work correctly on mobile Safari
   - Fix: Implement responsive grid or mobile drawer layout

2. **Assistant Panel Unusable on Phone** (MEDIUM)
   - 384px fixed sidebar overlaps content on 375px screen
   - Fix: Switch to bottom drawer on mobile

3. **No Mobile-First Onboarding**
   - New coach lands on mobile, no walkthrough
   - Fix: Add in-app tour (Shepherd.js or custom tooltips)

4. **Tap Targets Too Small**
   - Resize handles on GridBlock are 1.5px (line 59, GridBlock.tsx)
   - Hard to grab on touch screen
   - Fix: Increase to 8-10px; hide on small screens or use long-press menu

5. **No Swipe Navigation**
   - Coach can't swipe between sessions on mobile
   - Fix: Add swipe-to-navigate or add prev/next session buttons

---

## TOP 3 MISSING CAPABILITIES (Major Gaps)

### 1. CRITICAL: Activity Library is Hidden & Unusable
**Impact:** Coach cannot use pre-built activities, must recreate from scratch  
**Current State:** LibraryPanel imported but toggle button missing from UI  
**Required Fix:** 
- Add visible "Activity Library" button in session header
- Drag-from-library functionality is built; just needs discoverability
- Without this, the entire R/P/E/G tier system is inaccessible

### 2. CRITICAL: Coach Scheduling & Conflict Detection Missing
**Impact:** Can double-book specialists; no visibility into availability by week  
**Current State:** Coaches can be rostered to sessions, but no availability/conflict checking  
**Required Fix:**
- Add `sp_coach_availability` table: (coach_id, week_start, week_end, available: boolean)
- Check before rostering: "Jarryd already booked Thu 5-7pm, this session overlaps"
- Show coach availability calendar in coach settings
- Block double-bookings at form submit time

### 3. CRITICAL: Mobile Grid Rendering is Broken
**Impact:** App unusable on iPhone during sessions (the primary use case for trackside review)  
**Current State:** Hard-coded desktop layout with 600px minimum width  
**Required Fix:**
- Responsive grid: Use media query to adjust column width for mobile
- OR: Implement swipeable lane carousel for mobile (show 2-3 lanes at a time)
- OR: Mobile-specific simplified view with lane tabs
- Test at 375px, 667px, 1024px breakpoints

---

## ASSISTANT-COACH VIEW GAPS (SEPARATE SECTION)

### Finding A1: No "My Blocks" Filtering
Assistant coach sees ENTIRE session grid, all 8 lanes, all blocks. Should see only lanes assigned to them.

### Finding A2: Coaching Notes Hidden in Panel
Notes are in BlockDetailPanel (expandable), but assistant coach doesn't know notes exist. Should surface coaching cues prominently.

### Finding A3: No Real-Time Updates
If head coach edits blocks during session, assistant's read-only view doesn't refresh. Missing Realtime subscription on read-only view.

**Recommended Fix (All Three):**
- Create dedicated assistant coach page: `/dashboard/session/[id]/assistant`
- Show only blocks where `coach_assigned` includes current user
- Highlight those blocks with a border or background
- Add sidebar "Your Blocks" sorted by time
- Surface coaching_notes and coaching_points prominently above the grid
- Subscribe to realtime updates: `supabase.realtime.on('INSERT', ...)`

---

## CRITICAL ISSUES SUMMARY

| Issue | Severity | Journey | Impact |
|-------|----------|---------|--------|
| Activity Library hidden | CRITICAL | 1 | Cannot use pre-built drills; must recreate |
| Grid unusable on mobile | CRITICAL | 3 | App broken on phone (primary use case) |
| No coach scheduling/conflicts | CRITICAL | 2 | Can double-book specialists |
| Assistant coach view unfiltered | CRITICAL | 4 | Assistants see all blocks, can't find theirs |
| No phase context in session | MEDIUM | 1 | Tier choices not aligned with phase goals |
| Copy Hour limited visibility | LOW | 1 | Coach doesn't know custom ranges are possible |
| Specialist availability opaque | MEDIUM | 2 | Manual tracking required |
| Save status subtle | LOW | 1 | Coach unsure if work is saving |
| No attendance marking | CRITICAL | 3 | Out of scope (external system) but app feels incomplete |

---

## FILE REFERENCES

**Critical Files Reviewed:**

| Component | Path | Issue(s) |
|-----------|------|---------|
| SessionGrid | `/app/src/components/session-grid/SessionGrid.tsx` | Grid layout (mobile), missing library button |
| CreateBlockModal | `/app/src/components/session-grid/CreateBlockModal.tsx` | Category defaulting (1.2) |
| SessionCoachBar | `/app/src/components/session-grid/SessionCoachBar.tsx` | No availability display (2.1), no conflict detection |
| SquadAvailability | `/app/src/components/settings/SquadAvailability.tsx` | Read-only, no quick-add (2.2) |
| CopyHourDialog | `/app/src/components/session-grid/CopyHourDialog.tsx` | Limited slot visibility (1.3) |
| LibraryPanel | `/app/src/components/activity-library/LibraryPanel.tsx` | No toggle button in UI (1.5) |
| ReadOnlyGrid | `/app/src/components/session-grid/ReadOnlyGrid.tsx` | No role-based filtering (4.1) |
| Session Page | `/app/src/app/dashboard/session/[id]/page.tsx` | No phase context (1.1), missing library button |
| PlayersTab | `/app/src/components/settings/PlayersTab.tsx` | No success toast (5.1) |
| CoachProfileModal | `/app/src/components/coaches/CoachProfileModal.tsx` | Missing availability fields (5.2) |

---

## NEXT STEPS FOR PRODUCT TEAM

1. **Fix Showstopper Issues First:**
   - Add Activity Library toggle button (1 hour)
   - Implement coach conflict detection (4 hours)
   - Fix mobile grid layout (8 hours)
   - Add assistant coach view filtering (6 hours)

2. **Enhance Session Planning:**
   - Display phase context in session header (2 hours)
   - Add toast notifications for saves (1 hour)
   - Improve category selection UX (1 hour)

3. **Improve Mobile Experience:**
   - Responsive grid or drawer navigation (4 hours)
   - Bottom-drawer for AI assistant (2 hours)
   - Increase tap targets for touch (1 hour)

4. **Coach Management:**
   - Add coach availability tracking (6 hours)
   - Show specialist schedule in settings (3 hours)

---

## CONCLUSION

The **core session planning grid is solid** — drag-to-select, block editing, undo/redo, and auto-save all work. However, the app has **three critical gaps** that block core workflows:

1. **Discoverability:** Activity Library hidden, coach routing UI incomplete
2. **Scheduling:** No conflict detection or availability tracking for specialists
3. **Mobile:** Unusable on 375px phone, despite being a trackside tool

These are **not bugs** — they're architectural gaps that surface during real usage. Fixing them will unlock the full power of the planner for head coaches, assistants, and guest coaches.

The **best path forward** is to prioritize the three critical missing capabilities first, then address the medium-severity UX gaps. The foundation is strong; these are enhancements that make it production-ready.
