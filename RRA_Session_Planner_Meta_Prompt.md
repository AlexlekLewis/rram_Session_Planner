# RRA Elite Program Session Planner — Build Meta Prompt

## Context for the Builder

You are building a full-stack web application called **RRA Session Planner** for the Rajasthan Royals Academy (RRA) Melbourne Elite Program. The Head Coach (Alex Lewis) needs a single interface where coaches, guest coaches, and eventually players can log in and plan/view the entire 12-week T20 Elite Program (mid-April to early July 2026).

This is NOT a generic calendar app. It is a **cricket academy session planning tool** with a very specific grid-based session designer at its core. Think of it as a cross between Google Calendar (for the month view), a Gantt chart (for session layout), and Google Sheets (for the drag-to-select grid interaction) — purpose-built for indoor cricket net facility planning.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 14+ (App Router) | TypeScript, server components where appropriate |
| **UI** | React + Tailwind CSS | shadcn/ui component library for base components |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable | For activity library → grid drag-drop |
| **Grid Interaction** | Custom implementation | Mouse-drag cell selection (like Google Sheets), NOT a library — this needs to be built from scratch for the lane × time grid |
| **Database** | Supabase (PostgreSQL) | Project ref: `pudldzgmluwoocwxtzhw` |
| **Realtime** | Supabase Realtime | Auto-save on every change, live sync for multi-user |
| **Auth** | Supabase Auth | Email/password + magic link, role-based (head_coach, assistant_coach, guest_coach, player) |
| **Hosting** | Vercel | Connected to Supabase |

---

## Brand Guidelines (Official RR Brand Compliance)

**CRITICAL: This app represents an official Rajasthan Royals franchise. Every pixel must comply with the brand guidelines below. No approximations.**

### Typography — Montserrat ONLY
- **Font:** Montserrat — the ONLY permitted font for ALL elements
- **Google Fonts import:** `https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap`
- **CSS:** `font-family: 'Montserrat', sans-serif;`
- **Weight hierarchy:**
  - Black/900 — Page titles, hero text
  - Bold/700 — Section headings, block labels on grid
  - SemiBold/600 — Subheadings, button text
  - Regular/400 — Body text, coaching notes
  - Light/300 — Captions, timestamps, secondary labels
- **NEVER** substitute with Arial, Helvetica, Inter, Roboto, or any other font

### Colour Palette — Primary
| Colour | Name | HEX | RGB | Usage |
|--------|------|-----|-----|-------|
| **Brand Pink** | RR Pink | `#E11F8F` | 229, 6, 149 | Primary accent, CTAs, active states, squad F badge |
| **Brand Blue** | Admiral Blue | `#1226AA` | 18, 38, 170 | Primary UI, headers, navigation, squad 1 badge |
| **Dark Navy** | Navy | `#001D48` | 2, 29, 69 | **ONLY in gradients** — never as flat colour |

### Colour Palette — Secondary
| Colour | Name | HEX | RGB | Usage |
|--------|------|-----|-----|-------|
| **Light Pink** | RF Pink | `#E96BB0` | 233, 107, 176 | Hover states, secondary accents |
| **Medium Blue** | RA Blue | `#0075C9` | 0, 117, 201 | Links, interactive elements |
| **Dark Charcoal** | Charcoal | `#323E48` | 50, 62, 72 | Body text, dark mode surfaces |

### Gradients
```css
--rr-gradient: linear-gradient(135deg, #001D48 0%, #1226AA 40%, #E11F8F 100%);
--rr-gradient-reverse: linear-gradient(135deg, #E11F8F 0%, #1226AA 60%, #001D48 100%);
```
- Gradient must spread equally from blue to pink
- Dark Navy (#001D48) is used ONLY in gradients, never as a flat background

### Logo
- **File:** `Logo_Pink_Transparent.png` (2000×2000, transparent background)
- **Variants:** Pink on white/light backgrounds, White on dark/gradient backgrounds
- **Rules:** NEVER re-arrange, re-size elements, re-colour, outline, rotate, distort, or add effects
- **Clear space:** Minimum = width of the 'R' from 'Royals' on all sides
- **Minimum web width:** 70px
- **Placement:** App header (small), login page (hero)

### Tailwind Config
```js
colors: {
  rr: {
    pink: '#E11F8F',
    blue: '#1226AA',
    navy: '#001D48',
    'light-pink': '#E96BB0',
    'medium-blue': '#0075C9',
    charcoal: '#323E48',
  }
},
fontFamily: {
  montserrat: ['Montserrat', 'sans-serif'],
}
```

### CSS Custom Properties
```css
:root {
  --rr-pink: #E11F8F;
  --rr-blue: #1226AA;
  --rr-navy: #001D48;
  --rr-light-pink: #E96BB0;
  --rr-medium-blue: #0075C9;
  --rr-charcoal: #323E48;
  --rr-gradient: linear-gradient(135deg, #001D48 0%, #1226AA 40%, #E11F8F 100%);
  --rr-gradient-reverse: linear-gradient(135deg, #E11F8F 0%, #1226AA 60%, #001D48 100%);
  --rr-font: 'Montserrat', sans-serif;
}
```

### Design Tone
- Professional, elite sport, clean, modern
- Dark mode primary (charcoal surfaces, not pure black)
- Brand gradient for hero sections and login
- Pink as the action/accent colour
- Blue as the structural/navigation colour

---

## Application Architecture — Three View Levels

The app has three hierarchical views. Users navigate down from Month → Session List → Session Grid.

### VIEW 1: MONTH VIEW (Program Calendar)

**Purpose:** At-a-glance view of the entire program month showing which squads train on which days, who the specialist coaches are, and what phase of the program we're in.

**Layout:**
- **Header bar:** Current month name, left/right arrows to navigate months, program phase indicator
- **Phase banner:** Sits above the calendar grid. Shows the current phase name (e.g., "Phase 1: Explore"), phase dates, and 3-5 key goals/outcomes for that phase in a styled card
- **Calendar grid:** Standard month calendar (Mon-Sun columns, 4-6 week rows)
- **Each day cell shows:**
  - Squad badge(s) operating that day (colour-coded: Squad F = pink, Squad 1 = blue, Squad 2 = green, Squad 3 = orange)
  - Session time (e.g., "5:00-7:00pm")
  - Specialist coach name(s) if assigned (e.g., "Joe Burns — Batting")
  - Click/tap a day to drill into the Session List view for that day
- **Non-training days** are greyed out
- **Today** has a highlight ring

**Data model (phases):**
```
phases {
  id: uuid
  name: string              // "Explore", "Establish", "Excel"
  description: text
  start_date: date
  end_date: date
  goals: jsonb              // ["Goal 1", "Goal 2", ...]
  program_id: uuid
  order: integer
}
```

**Data model (sessions — calendar level):**
```
sessions {
  id: uuid
  date: date
  start_time: time
  end_time: time
  venue_id: uuid
  squad_ids: uuid[]          // Which squads are training
  specialist_coaches: jsonb  // [{name, role, notes}]
  phase_id: uuid
  status: enum               // draft, published, completed
  created_by: uuid
  updated_at: timestamptz
}
```

### VIEW 2: SESSION LIST (Week/Session Overview)

**Purpose:** Shows all 8 sessions in a month (2 per week, 4 weeks) in a card-based list, giving a quick overview of what's planned for each session before diving into the detailed grid.

**Layout:**
- **Grouped by week:** "Week 1 (Apr 14-20)", "Week 2 (Apr 21-27)", etc.
- **Each session card shows:**
  - Date + day of week
  - Time slot
  - Squad(s) training
  - Venue
  - Session theme/focus (editable inline)
  - Planning status: Empty (red), In Progress (amber), Complete (green)
  - Specialist coach assignments
  - Click to open the Session Grid (View 3)
- **Bulk actions:** Copy session plan from one session to another, duplicate week
- **Quick stats sidebar:** Sessions planned vs remaining, coach utilisation across the month

### VIEW 3: SESSION GRID (The Core — Detailed Session Planner)

**Purpose:** This is the main planning canvas. A grid with **lanes across the top** and **time down the left side** where the coach drags, drops, and resizes activity blocks to plan exactly what happens in every lane at every moment of a session.

**This is the most complex and important view. Build it with extreme care.**

#### Grid Structure

**Columns (Lanes) — 8 total:**

| Column | ID | Label | Type | Width |
|--------|----|-------|------|-------|
| 1 | `machine-1` | Machine 1 | Bowling Machine | Standard |
| 2 | `machine-2` | Machine 2 | Bowling Machine | Standard |
| 3 | `machine-3` | Machine 3 | Bowling Machine | Standard |
| 4 | `lane-4` | Lane 4 | Long Lane | Standard |
| 5 | `lane-5` | Lane 5 | Long Lane | Standard |
| 6 | `lane-6` | Lane 6 | Long Lane | Standard |
| 7 | `lane-7` | Lane 7 | Long Lane | Standard |
| 8 | `other` | Other Location | Flexible | Standard |

**Column 8 — "Other Location" explained:**
This column captures everything that happens OUTSIDE the net lanes. When a coach creates a block in column 8, they type the specific location into the block's location field. Examples: "Back of nets" (warm-up area behind the lanes), "Upstairs lecture room" (for mental performance sessions, video review), "Outside — running" (fitness work), "External venue" (if a session moves offsite). This column is essential because sessions often have groups rotating between net lanes and non-lane activities (e.g., Group A in nets, Group B doing S&C out the back, Group C in the lecture room for mental performance).

**Rows (Time) — 5-minute increments:**
- For a 2-hour session (e.g., 5:00-7:00pm): 24 rows
- Each row = 5 minutes
- Row height: ~32px (adjustable)
- Time labels on the left: "5:00", "5:05", "5:10", etc.
- Major gridlines at 15-minute intervals (thicker/darker line)
- Minor gridlines at 5-minute intervals (thin, subtle)

**Grid dimensions:** 8 columns × 24 rows = 192 cells

#### Grid Interaction Model

**Creating blocks (mouse-drag selection):**
1. User clicks and holds on a cell (e.g., Machine 1, 5:00pm)
2. Drags across lanes and/or down through time slots
3. A blue selection highlight follows the mouse (like selecting cells in Google Sheets)
4. On mouse-up, a **new activity block** is created spanning the selected cells
5. A quick modal/popover appears to name the activity or select from the Activity Library
6. The block snaps to the grid (always aligns to 5-min rows and lane columns)

**Example:** Drag from Machine 1 at 5:00pm to Machine 3 at 5:25pm → creates a block spanning 3 lanes × 6 time slots (30 minutes across 3 machines).

**Moving blocks:**
- Click and drag an existing block to move it to a new position
- Block maintains its size (lanes × time) during the move
- Ghost/shadow shows where it will land
- Snap to grid on drop

**Resizing blocks:**
- Drag the bottom edge to extend/shrink time duration
- Drag the right edge to add/remove lanes
- Drag corners for both simultaneously
- Minimum size: 1 lane × 1 time slot (5 minutes)

**Copy & Paste:**
- Select one or more blocks (click, or Shift+click for multi-select)
- Ctrl/Cmd+C to copy
- Click a target cell, Ctrl/Cmd+V to paste
- "Copy Hour" button: Select all blocks in a time range (e.g., 5:00-6:00) and duplicate them into the next hour (6:00-7:00)
- "Copy Session" at the session list level to duplicate an entire session plan

**Right-click context menu on blocks:**
- Edit activity details
- Change colour/category
- Duplicate block
- Delete block
- Copy to clipboard
- Add coaching notes

#### Activity Block Data Model

```
session_blocks {
  id: uuid
  session_id: uuid           // FK to sessions
  activity_id: uuid | null   // FK to activities library (null if custom/unnamed)
  name: string               // Display name on block
  lane_start: integer        // 1-8 (which lane/column it starts on)
  lane_end: integer           // 1-8 (which lane/column it ends on, inclusive)
  time_start: time           // e.g., "17:00"
  time_end: time             // e.g., "17:25"
  colour: string             // Hex colour for the block (auto from category, overridable)
  category: enum             // batting, batting_power, pace_bowling, spin_bowling, wicketkeeping, fielding, fitness, mental, tactical, warmup, cooldown, transition, other
  tier: enum                 // R (regression), P (progression), E (elite), G (gamify) — which version of the activity is being run
  other_location: text       // Only used when lane includes column 8 — e.g., "Back of nets", "Upstairs lecture room", "Outside - running"
  coaching_notes: text       // Rich text notes for the coach
  coaching_points: jsonb     // Key coaching cues for this specific instance
  player_groups: jsonb       // Which players/groups assigned to this block (e.g., "Group A", "Squad F")
  equipment: jsonb           // Equipment needed for this block
  coach_assigned: text       // Which coach runs this block (e.g., "Squad Coach", "Jarryd Rodgers", "Bowl Strong")
  sort_order: integer        // Z-index for overlapping (if allowed)
  created_by: uuid
  updated_at: timestamptz
}
```

#### Activity Library (Slide-out Panel)

**Position:** Right-hand side panel, toggleable (hamburger/library icon)

**Structure:**
- Searchable + filterable list of activities
- **Filter by category:** Batting, Batting (Power), Pace Bowling, Spin Bowling, Wicketkeeping, Fielding, Fitness/S&C, Mental, Tactical, Warmup
- **Filter by tier:** R (Regression), P (Progression), E (Elite), G (Gamify) — each activity has up to 4 tier variants
- Each activity card shows: Name, category colour dot, tier badges (R/P/E/G available), default duration, sub-category tag
- **Drag from library → drop onto grid** to create a block pre-filled with that activity's details
- The dropped block auto-sizes based on the activity's default lane width and duration, but can be resized after placement
- When dropping, a quick popover asks: "Which tier?" (R/P/E/G) — this determines the coaching instructions that populate the block

**Tier System (R/P/E/G) — Critical Concept:**
Every activity in the library can have up to 4 versions:
- **(R) Regression** — Starting point. Underarm feeds, no time pressure, isolated skills, simplified environment
- **(P) Progression** — Challenge up. Side-arm/machine feeds, added complexity, resistance, constraints
- **(E) Elite** — 18-22 age adaptation. Match pace (120-140kph), kinetic chain focus, bat speed diagnostic, self-coaching emphasis
- **(G) Gamify** — Competition mode. Points systems, head-to-head, consequences, scoreboards

The tier is displayed as a small badge on the block in the grid (e.g., "(R)" or "(E)") so coaches can see at a glance what intensity each group is working at.

**Activities data model:**
```
activities {
  id: uuid
  name: string               // "360 Drill"
  category: enum             // batting, batting_power, pace_bowling, spin_bowling, wicketkeeping, fielding, fitness, mental, tactical, warmup, cooldown
  sub_category: text         // "Batting Zones", "Shot Selection", "Footwork / Power", etc.
  description: text          // Brief overview
  
  // Tier-specific instructions (each tier is a self-contained coaching brief)
  regression: jsonb          // { description, coaching_points[], equipment[] }
  progression: jsonb         // { description, coaching_points[], equipment[] }
  elite: jsonb               // { description, coaching_points[], equipment[] }
  gamify: jsonb              // { description, scoring_rules, consequence }
  
  default_duration_mins: int // e.g., 15
  default_lanes: int         // e.g., 2
  equipment: jsonb           // Master equipment list across all tiers
  tags: text[]               // Searchable tags: ["footwork", "spin", "zone awareness"]
  youtube_reference: text    // Optional video reference URL
  
  // Coaching methodology
  constraints_cla: text      // Constraints-Led Approach notes
  coaching_framework: jsonb  // { gfr_focus, kinetic_chain_focus, intent_clarity }
  
  // Rules
  max_balls_per_batter: int  // e.g., 3 (from "Batting Rules: Max 3 balls at a time per batter")
  between_sets_activity: text // e.g., "Running 3's between sets"
  
  created_by: uuid
  is_global: boolean         // Shared across all coaches vs personal
  updated_at: timestamptz
}
```

**Create new activity:**
- "+" button at top of library panel
- Full-create modal with tabs: General, Regression, Progression, Elite, Gamify
- OR create inline from a block on the grid ("Save as Activity" from context menu — saves the block as a new activity with the current tier pre-filled)
- Import from spreadsheet (bulk import from existing Excel activity library)

---

## Auto-Save & Persistence Strategy

**Every change auto-saves.** No save button. The user should never lose work.

**Implementation pattern:**
1. **Optimistic UI:** Update the local state immediately on every interaction
2. **Debounced save:** After 500ms of no changes, persist to Supabase
3. **Conflict resolution:** Last-write-wins with timestamp checking
4. **Save indicator:** Small "Saving..." / "Saved ✓" / "Offline — changes queued" indicator in the header
5. **Undo/Redo:** Maintain a local history stack (Ctrl+Z / Ctrl+Shift+Z) with at least 50 steps

**Supabase Realtime subscription:**
- Subscribe to changes on `session_blocks` filtered by `session_id`
- When another user modifies a block, update the local grid in real-time
- Show other users' cursors/selections if multiple coaches are planning simultaneously (Phase 2)

**Offline resilience:**
- Queue changes in IndexedDB if connection drops
- Sync when reconnected
- Show offline indicator

---

## Database Schema (Complete)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Programs (one per year/season)
CREATE TABLE programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,                    -- "RRA Melbourne T20 Elite 2026"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phases within a program
CREATE TABLE phases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goals JSONB DEFAULT '[]',
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venues
CREATE TABLE venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,                     -- "Cutting Edge Cricket Centre"
  short_name TEXT,                        -- "CEC"
  address TEXT,
  lanes JSONB NOT NULL,                   -- Lane configuration
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Squads
CREATE TABLE squads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                     -- "Squad F", "Squad 1", etc.
  colour TEXT NOT NULL,                   -- Hex colour for badges
  description TEXT,
  session_days JSONB,                     -- [{day: "Tuesday", time: "7:00-9:00pm"}]
  max_players INTEGER DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaches (users with coach role)
CREATE TABLE coaches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL,                     -- "head_coach", "assistant_coach", "guest_coach"
  speciality TEXT,                        -- "Batting", "Bowling", "Fielding"
  bio TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions (individual training sessions)
CREATE TABLE sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES phases(id),
  venue_id UUID REFERENCES venues(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  squad_ids UUID[] DEFAULT '{}',
  specialist_coaches JSONB DEFAULT '[]',
  theme TEXT,                             -- "Power hitting focus"
  status TEXT DEFAULT 'draft',            -- draft, published, completed
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Blocks (the core — individual blocks on the grid)
CREATE TABLE session_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  activity_id UUID,                       -- FK to activities (nullable for custom)
  name TEXT NOT NULL,
  lane_start INTEGER NOT NULL,            -- 1-8
  lane_end INTEGER NOT NULL,              -- 1-8
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  colour TEXT DEFAULT '#3B82F6',
  category TEXT DEFAULT 'other',          -- batting, batting_power, pace_bowling, spin_bowling, wicketkeeping, fielding, fitness, mental, tactical, warmup, cooldown, transition, other
  tier TEXT DEFAULT 'R',                  -- R, P, E, G (regression, progression, elite, gamify)
  other_location TEXT,                    -- Free text for column 8 (e.g., "Back of nets", "Lecture room")
  coaching_notes TEXT,
  coaching_points JSONB DEFAULT '[]',
  player_groups JSONB DEFAULT '[]',
  equipment JSONB DEFAULT '[]',
  coach_assigned TEXT,                    -- Name of coach running this block
  sort_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities Library (with R/P/E/G tier system)
CREATE TABLE activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,                 -- batting, batting_power, pace_bowling, spin_bowling, wicketkeeping, fielding, fitness, mental, tactical, warmup, cooldown
  sub_category TEXT,                      -- "Batting Zones", "Shot Selection", "Footwork / Power", etc.
  description TEXT,
  
  -- Tier-specific coaching instructions
  regression JSONB DEFAULT '{}',          -- { description, coaching_points[], equipment[] }
  progression JSONB DEFAULT '{}',         -- { description, coaching_points[], equipment[] }
  elite JSONB DEFAULT '{}',              -- { description, coaching_points[], equipment[] }
  gamify JSONB DEFAULT '{}',             -- { description, scoring_rules, consequence }
  
  default_duration_mins INTEGER DEFAULT 15,
  default_lanes INTEGER DEFAULT 1,
  equipment JSONB DEFAULT '[]',           -- Master equipment list
  tags TEXT[] DEFAULT '{}',
  youtube_reference TEXT,
  constraints_cla TEXT,                   -- Constraints-Led Approach notes
  coaching_framework JSONB DEFAULT '{}',  -- { gfr_focus, kinetic_chain_focus, intent_clarity }
  max_balls_per_batter INTEGER,          -- e.g., 3
  between_sets_activity TEXT,            -- e.g., "Running 3's between sets"
  created_by UUID REFERENCES auth.users(id),
  is_global BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE session_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- RLS Policies (coaches can read everything, write based on role)
CREATE POLICY "Authenticated users can read all" ON sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coaches can insert sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Coaches can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read blocks" ON session_blocks
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coaches can manage blocks" ON session_blocks
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read activities" ON activities
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coaches can manage activities" ON activities
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_program ON sessions(program_id);
CREATE INDEX idx_session_blocks_session ON session_blocks(session_id);
CREATE INDEX idx_activities_category ON activities(category);
```

---

## Venue Configuration (CEC Bundoora)

```json
{
  "id": "cec-bundoora",
  "name": "Cutting Edge Cricket Centre",
  "short_name": "CEC",
  "address": "Bundoora, VIC",
  "lanes": [
    { "id": 1, "label": "Machine 1", "type": "bowling_machine", "short": "M1" },
    { "id": 2, "label": "Machine 2", "type": "bowling_machine", "short": "M2" },
    { "id": 3, "label": "Machine 3", "type": "bowling_machine", "short": "M3" },
    { "id": 4, "label": "Lane 4", "type": "long_lane", "short": "L4" },
    { "id": 5, "label": "Lane 5", "type": "long_lane", "short": "L5" },
    { "id": 6, "label": "Lane 6", "type": "long_lane", "short": "L6" },
    { "id": 7, "label": "Lane 7", "type": "long_lane", "short": "L7" },
    { "id": 8, "label": "Other Location", "type": "other", "short": "OTH" }
  ]
}
```

**Other Location examples** (free-text entered on each block):
- "Back of nets" — warm-up area, S&C work, fielding drills
- "Upstairs lecture room" — mental performance sessions, video review, tactical briefings
- "Outside — running" — fitness work, running between wickets practice
- "External venue" — if a group moves offsite for any reason
- "Bowling area" — dedicated bowling-only space separate from batting lanes

---

## Squad Configuration (2026 Season)

| Squad | Colour | Days | Time | Target Group |
|-------|--------|------|------|-------------|
| Squad F | `#E11F8F` (Brand Pink) | Thu + Sun | 5-7pm / 2-4pm | Female Cricket |
| Squad 1 | `#1226AA` (Brand Blue) | Tue + Sat | 7-9pm / 4-6pm | Elite/Advanced Males |
| Squad 2 | `#16A34A` (Green) | Tue + Sat | 5-7pm / 2-4pm | Younger Dev Males |
| Squad 3 | `#F97316` (Orange) | Thu + Sun | 7-9pm / 4-6pm | Older Dev Males |

---

## User Roles & Permissions

| Feature | Head Coach | Assistant Coach | Guest Coach | Player |
|---------|-----------|----------------|-------------|--------|
| Month view | ✅ Full | ✅ Full | ✅ Read | ✅ Read (own squad) |
| Session list | ✅ Full | ✅ Full | ✅ Read | ✅ Read (own squad) |
| Session grid — view | ✅ | ✅ | ✅ | ✅ (own squad) |
| Session grid — edit | ✅ | ✅ | ❌ | ❌ |
| Activity library — view | ✅ | ✅ | ✅ | ❌ |
| Activity library — create/edit | ✅ | ✅ | ❌ | ❌ |
| Phase management | ✅ | ❌ | ❌ | ❌ |
| Squad management | ✅ | ❌ | ❌ | ❌ |
| Coach management | ✅ | ❌ | ❌ | ❌ |
| Copy/paste sessions | ✅ | ✅ | ❌ | ❌ |

---

## Key UI/UX Requirements

### Session Grid — Critical Interactions

1. **Drag-to-select (CREATE):** Click empty cell → drag across lanes/time → release → block created. This is the PRIMARY creation method. The selection highlight must be responsive and snappy (< 16ms per frame).

2. **Drag-to-move (MOVE):** Click existing block → drag to new position → release. Ghost preview during drag. Cannot overlap other blocks (collision detection required).

3. **Drag-to-resize (RESIZE):** Grab edge/corner handles on existing block → drag to resize. Bottom edge = duration. Right edge = lane width. Corner = both.

4. **Library drag-drop (CREATE FROM LIBRARY):** Drag activity card from side panel → drop onto grid. Block pre-fills with activity data and sizes to default dimensions. Can be resized after placement.

5. **Copy Hour:** Select time range → "Copy to next hour" button. Duplicates all blocks in the range, offset by the session duration. Essential for sessions where Hour 1 = Squad A rotation, Hour 2 = Squad B does the same thing.

6. **Undo/Redo:** Full undo/redo stack. Every grid operation (create, move, resize, delete) is undoable.

7. **Collision prevention:** Blocks cannot overlap. If a move/resize would cause overlap, either (a) prevent it with a red highlight, or (b) push adjacent blocks out of the way.

8. **Zoom:** Ability to zoom the time axis (5-min, 10-min, 15-min granularity). Default is 5-min.

### General UI Requirements

- **Responsive:** Works on desktop (primary), tablet (secondary). Mobile is view-only.
- **Dark mode:** Support for dark mode (coaches often plan in the evening).
- **Keyboard shortcuts:** Standard shortcuts for power users (Ctrl+Z, Ctrl+C, Ctrl+V, Delete, Escape to deselect).
- **Loading states:** Skeleton loaders for all views. Never show blank screens.
- **Toast notifications:** For save confirmation, errors, copy success, etc.

---

## Category Colour System

Activities are colour-coded by discipline so the grid instantly shows what's happening where at any moment — a visual "heat map" of the session.

| Category | Colour | Hex | Example Activities |
|----------|--------|-----|-------------------|
| Batting (General) | Blue | `#3B82F6` | 360 Drill, Hitting 3 Ways, Rapid Fire |
| Batting (Power) | Indigo | `#6366F1` | Must Go For 6, Helicopter, Slog Sweep |
| Pace Bowling | Red | `#EF4444` | Stock Ball Repetition, Yorker/Death Bowling |
| Spin Bowling | Pink | `#EC4899` | Flight & Drift, Spin Variations |
| Wicketkeeping | Cyan | `#06B6D4` | Glove Work, Standing Up, Stumping Drill |
| Fielding | Green | `#22C55E` | Catching Circuit, Ground Fielding, Relay Throws |
| Fitness / S&C | Purple | `#A855F7` | Strength & Mobility, Speed & Agility, Athletic Dev |
| Mental Performance | Violet | `#8B5CF6` | Visualisation, Pre-Performance Routines, Goal Setting |
| Tactical / Game Sim | Amber | `#F59E0B` | Death Over Auction, Imposters, IPL Auction |
| Warmup / Daily Vitamins | Teal | `#14B8A6` | Daily Vitamins, Cricket-Specific Warm-Up |
| Cooldown / Recovery | Slate | `#64748B` | Cool-down stretching, recovery protocols |
| Water / Transition | Grey | `#9CA3AF` | 5-min water breaks between blocks |
| Other | Neutral | `#D4D4D8` | Meetings, video review, non-categorised |

This colour system means a coach can glance at the grid and immediately see: "Lanes 1-3 are blue (batting), Lanes 4-5 are red (pace bowling), Lane 6-7 are green (fielding), Other Location is purple (S&C out the back)." It paints a picture of the whole centre at any moment in time.

---

## Initial Seed Data

### Default Program
```json
{
  "name": "RRA Melbourne T20 Elite Program 2026",
  "start_date": "2026-04-14",
  "end_date": "2026-07-04",
  "phases": [
    { "name": "Explore", "start_date": "2026-04-14", "end_date": "2026-05-09", "goals": ["Discovery-based skill acquisition", "Constraint-led exploration", "Baseline assessment", "Establish training culture"] },
    { "name": "Establish", "start_date": "2026-05-12", "end_date": "2026-06-06", "goals": ["Consolidate technique foundations", "Game scenario integration", "Tactical awareness development", "Peer coaching introduction"] },
    { "name": "Excel", "start_date": "2026-06-09", "end_date": "2026-07-04", "goals": ["Match simulation intensity", "Decision-making under pressure", "Individual development plans", "Program showcase preparation"] }
  ]
}
```

### Default Activities (Starter Library — 40 Activities from Existing Planning Docs)

Pre-populate with the complete activity library from the RRA coaching planning spreadsheets. Each activity has Regression, Progression, Elite, and Gamify tier descriptions.

**SKILL ACQUISITION — Physical / Technical Drills (23 activities):**
1. 360 Drill — Batting Zones — Batter nominates zone, works all 6 hitting zones
2. Hitting 3 Ways (6, 4, 1) — Shot Selection — Pre-select or called shot intent (boundary, four, single)
3. Opposite Hand Hitting — Bat Speed / Adaptability — Non-dominant hand batting for coordination
4. Rapid Fire — Hand-Eye / Reaction — High-tempo feeds testing contact quality
5. Attacking Footwork (Resistance Bands) — Footwork / Power — Shadow then live with bands
6. Dane Rampi (Everything Behind) — Placement / Wrists — All shots behind square only
7. Hurdle Hop to Spin — Footwork / Spin Play — Explosive advance over mini hurdles to spin
8. Closed vs Open Gate — Foot Position Awareness — Front foot gate selection for spin play
9. Heel-Toe Runway — Weight Transfer — Heel-first weight transfer against spin
10. Back Foot Heel Release — Back Foot Technique — Weight transfer on cuts and back foot punches
11. Pivot Power Station — Hip Rotation / Power — Front foot pivot for power generation
12. Ladder Feet to Live Ball — Agility / Transition — Speed ladder to batting stance transition
13. Must Go For 6 — Power Hitting — Maximum intent, loft mechanics, target zones
14. Sweeps — Sweep Technique — Conventional, reverse, and paddle sweep progression
15. Helicopter — Power / Wrist Work — Wrist roll and helicopter shot for yorker-length
16. Scoop Dog — Ramp / Innovation — Ramp and scoop shot over keeper
17. Switch Hitter — Adaptability — Stance change and opposite-side hitting
18. Inside Out — Loft / Placement — Inside-out loft over cover
19. Slog Sweep Showdown — Power Sweep — Slog sweep power and selection
20. Upper Cut Club — Short Ball / Wrists — Upper cut over slip/point off short balls
21. Chin Music — Short Ball Defence — Duck, sway, pull, hook off short pitch
22. Soft Hands Circle — Touch / Control — Dead-bat control within a circle
23. Mishit Recovery — Resilience / Scramble — Scoring off edges and mishits

**SKILL EXPANSION — Open Skills / Decision-Making Drills (16 activities):**
24. 9 Pin Bowling — Stump Protection — Protecting multiple stumps while scoring
25. Imposters — Deception / Game Sense — Secret target scoring, group deduction
26. Dice Roll — Decision Making — Random shot type assignment
27. Red Ball White Ball — Colour Recognition — Colour-cued attack/defend decisions
28. Blind Batting — Trust / Instinct — Reduced vision, trust hands and instinct
29. Distractions — Focus Under Pressure — Maintaining technique under cognitive load
30. 4 Colours Hitting — Reaction / Processing — Multi-colour response identification
31. Slot Ball — Shot Selection / Patience — Attack only the bad ball, defend the rest
32. Death Over Auction — Chase / Pressure — Target chase with scoreboard pressure
33. Powerplay Blitz — Attacking Intent — 360° attacking with field awareness
34. Relay Runners — Running / Communication — Pairs running, calling, turning
35. Partnership Powerplay — Pairs / Rotation — Pairs batting with role assignment
36. Middle Overs Masterclass — Placement / Rotation — Spin play with field manipulation
37. Fatigue Finisher — Fitness / Composure — Technique under physical fatigue
38. IPL Auction — Pre-Meditation / Commitment — Pre-committed shot selection
39. Reverse Roles — Versatility / Growth — Playing the opposite of natural style

**WARM-UP:**
40. Daily Vitamins — Warm-up Routine — Standard session warm-up (Rapid Fire, knee sweeps, underarm drives/cuts/pulls, weighted balls)

**MENTAL PERFORMANCE (8 session modules — delivered in "Other Location" column):**
M1. Performance Profiling
M2. Goal Setting
M3. Focus & Concentration
M4. Pressure Training
M5. Visualisation Intro
M6. Self-Talk Strategies
M7. Pre-Performance Routines
M8. Game Scenario Debrief

**S&C / ATHLETIC DEVELOPMENT (delivered by specialist — Jason Cox/Sol):**
S1. Strength & Mobility
S2. Athletic Development
S3. Speed & Agility
S4. Power Training
S5. Movement Screen (Assessment)
S6. Strength Assessment

**BOWLING ASSESSMENT (delivered by specialist — Bowl Strong):**
B1. Bowling Baseline Assessment
B2. Pace Assessment

---

## How Current Session Plans Map to the Grid

The existing Excel planning documents show a standard 2-hour session structure. Here's how a typical session maps to the grid:

```
TIME          LANES 1-3 (Machines)     LANES 4-7 (Long Lanes)     COL 8 (Other Location)
──────────────────────────────────────────────────────────────────────────────────────────
0:00-0:10     Daily Vitamins (Warmup)   Daily Vitamins (Warmup)    —
0:10-0:25     Drill 1 - Group A         Drill 1 - Group B          —
0:25-0:40     Drill 2 - Group A         Drill 2 - Group B          —
0:40-0:55     Drill 3 - Group A         Drill 3 - Group B          —
0:55-1:00     ──── Water / Transition ──── (grey block spanning all lanes)
1:00-1:15     Block 1 (Bowling/S&C)     Block 1 (Power Hitting)    S&C Work (Jason Cox)
1:15-1:30     Block 2 (Bowling/S&C)     Block 2 (Power Hitting)    S&C Work (Jason Cox)
1:30-1:45     Block 3 (cont.)           Block 3 (cont.)            —
1:45-1:50     ──── Water / Transition ──── (grey block spanning all lanes)
1:50-2:00     —                         —                          Mental Perf (Lecture Room)
```

**Key patterns from the planning docs:**
- Hour 1 is typically batting (Squad Coach + Assistant run parallel groups across lanes)
- Hour 2 splits: some lanes for specialist work (Power Hitting with Jarryd Rodgers), others for bowling/S&C
- Mental Performance is a 10-min block at the end, delivered in the lecture room (Column 8)
- Water/Transition breaks are 5-min grey blocks spanning all columns
- The Squad Coach and Assistant Coach each manage a group — activities mirror each other but groups rotate
- "Copy Hour" is critical: Hour 1 group A rotates to become Hour 2 group B

---

## Specialist Coaches & Assignments

| Coach | Speciality | Colour Code | Weeks Active | Rate |
|-------|-----------|-------------|-------------|------|
| Squad Coach (Alex Lewis) | Head Coach — all sessions | — | All weeks | Salaried |
| Assistant Coach | All sessions — runs parallel group | — | All weeks | Salaried |
| Jarryd Rodgers | Power Hitting Specialist | `#FFFF00` (Yellow) | Wk 3-12 | $150/hr |
| Matt Spoors | Batting | `#E97132` (Orange) | Wk 9-12 | $120/hr |
| Bowl Strong | Bowling Assessment & Coaching | `#FFC000` (Amber) | Wk 1 + Wk 5-8 | $120/hr |
| Baj | Cricket Mentoring / Bowling | `#D86DCD` (Purple) | Wk 5-8 | $40/hr |
| Zac Parr | Bowling | — | Wk 9-12 | $40/hr |
| Peter Hatz | Bowling Specialist | `#E49EDD` (Lilac) | Wk 8-12 | $200/hr |
| Jason Cox / Sol Athletic Dev | S&C / Athletic Development | `#DAF2D0` (Light Green) | Wk 2-4 | $90/hr |
| Cricket Mentoring (Mental) | Mental Performance | — | All weeks | TBC |
| Nutrition Specialist | Nutrition | — | Wk 1, 5, 9 | $150/session |

---

## Coaching Framework (Elite Layer Principles)

The app should store and surface these principles as contextual guidance when coaches are selecting activities:

| Principle | Description |
|-----------|------------|
| **Ground Force Reaction (GFR)** | Every shot starts from the ground. Feet create force, hips transfer it, bat delivers it. |
| **Kinetic Chain Sequencing** | Ground → Feet → Hips → Torso → Shoulders → Arms → Hands → Bat. If any link fires out of sequence, power leaks. |
| **Bat Speed as Diagnostic** | Bat speed isn't a goal — it's a diagnostic. If speed drops, something in the kinetic chain broke down. |
| **Intent Clarity** | Every ball in training must have a stated intent: 6, 4, 1, or defend. "Just hitting" is not allowed. |
| **Self-Coaching** | The elite layer asks batters to explain what happened, not just do it again. |
| **Match-Realistic Pressure** | Crowd noise, scoreboards, consequences, watching peers, time pressure. |
| **Decision Speed > Execution Quality** | In T20, the batter who decides late decides wrong. Prioritise HOW FAST the right decision is made. |

**Batting Rules (apply to all session grid blocks):**
- Max 3 balls at a time per batter
- Running 3's between sets

**Delivery Method — Month 1:**
- No live bowling in Month 1 — all deliveries via side-arm throwers or bowling machines
- Side-arm pace range for elite: 120-140kph depending on drill purpose
- Machine: use for consistent length/pace when the drill variable is the batter's technique
- Side-arm: use when the drill requires variation, deception, or responsiveness

---

## Monthly Progression Logic

Each month follows a deliberate pedagogical arc. This context should be visible in the Phase banner on the Month View.

**Month 1 (Explore Phase): ASSESS → ACQUIRE → PROGRESS → EXPAND**
- Week 1: Assessment — baselines for batting, bowling, mental, physical
- Week 2: Skill Acquisition at Regression level — isolated technique, underarm feeds
- Week 3: Skill Acquisition at Progression level — side-arm/machine, added complexity
- Week 4: Skill Expansion — open decision-making scenarios, game-like pressure

Each week's drill selection maps back to the previous week's foundations. Week 4's game scenarios directly test whether Week 2-3's technical work has been automated.

---

---

## Build Phases

### Phase 1: Foundation (Build First)
1. Supabase schema setup (all tables, RLS, realtime)
2. Auth flow (login, role-based routing)
3. Month View (read-only calendar with session display)
4. Session List View (card-based session list with status)
5. Basic Session Grid (static grid rendering with lane headers and time axis)

### Phase 2: Core Grid Interactions (Build Second)
1. Drag-to-select block creation on the grid
2. Block rendering with category colours
3. Block move (drag existing block)
4. Block resize (edge/corner handles)
5. Block delete (keyboard Delete key + right-click)
6. Auto-save to Supabase with debounce
7. Undo/Redo stack

### Phase 3: Activity Library & Advanced Features (Build Third)
1. Activity Library side panel with category + tier filtering
2. Drag from library to grid (with tier selection on drop)
3. Full activity CRUD with R/P/E/G tab interface
4. Seed database with all 40+ activities from existing spreadsheets
5. Create activity from grid block ("Save as Activity")
6. Copy/Paste blocks (Ctrl+C, Ctrl+V)
7. Copy Hour functionality
8. Copy Session between sessions
9. Right-click context menu
10. Coaching notes on blocks (expandable)
11. Coach assignment per block

### Phase 4: Multi-user & Polish (Build Fourth)
1. Supabase Realtime sync (multi-user editing)
2. Phase management (CRUD for program phases)
3. Squad/Coach management screens
4. Dark mode
5. Offline support (IndexedDB queue)
6. Player view (read-only, filtered to their squad)
7. Export session plan as PDF

---

## File Structure

```
/app
  /login                    # Auth pages
  /dashboard                # Main app shell
    /month                  # Month calendar view
    /sessions               # Session list view
    /session/[id]           # Session grid view
    /library                # Activity library management (full-page view)
    /settings               # Program, squad, coach management
  /api                      # API routes if needed
/components
  /ui                       # shadcn components
  /calendar                 # Month view components
    MonthCalendar.tsx
    DayCell.tsx
    PhaseBanner.tsx
  /session-list             # Session list components
    SessionCard.tsx
    WeekGroup.tsx
    CoachUtilisationSidebar.tsx
  /session-grid             # THE CORE — grid components
    SessionGrid.tsx          # Main grid container
    GridCanvas.tsx           # The lane × time grid (8 cols × n rows)
    GridBlock.tsx            # Individual activity block (with tier badge, coach name, category colour)
    GridSelection.tsx        # Drag-to-select overlay
    TimeAxis.tsx             # Left-side time labels (5-min increments, 15-min major lines)
    LaneHeader.tsx           # Top lane labels (M1, M2, M3, L4, L5, L6, L7, OTH)
    BlockContextMenu.tsx     # Right-click menu
    BlockDetailPanel.tsx     # Expandable detail panel for coaching notes, equipment, coaching points
    CopyHourDialog.tsx       # Copy hour modal
    OtherLocationInput.tsx   # Free-text input for column 8 blocks
  /activity-library         # Library panel
    LibraryPanel.tsx         # Slide-out side panel
    ActivityCard.tsx         # Draggable card with tier badges
    ActivityFilter.tsx       # Category + tier filter controls
    TierSelector.tsx         # R/P/E/G tier picker (shown on drop)
    CreateActivityModal.tsx  # Full modal with General/R/P/E/G tabs
  /shared                   # Shared components
    SaveIndicator.tsx
    UserAvatar.tsx
    SquadBadge.tsx
    TierBadge.tsx            # Small R/P/E/G badge component
    CategoryDot.tsx          # Coloured dot for category
/hooks
  useAutoSave.ts            # Debounced save hook
  useUndoRedo.ts            # Undo/redo state management
  useGridSelection.ts       # Mouse drag selection logic (8 cols)
  useRealtimeSync.ts        # Supabase realtime subscription
  useSessionBlocks.ts       # CRUD operations for blocks
  useActivityLibrary.ts     # Activity library CRUD and search
/lib
  supabase/
    client.ts               # Browser client
    server.ts               # Server client
    middleware.ts            # Auth middleware
  constants.ts              # Colours, lane config, time config, tier definitions
  types.ts                  # TypeScript types
  utils.ts                  # Utility functions
  seed-activities.ts        # Seed data for all 40+ activities from spreadsheets
```

---

## Critical Implementation Notes

### Grid Selection Algorithm (useGridSelection hook)
The grid selection needs to feel like selecting cells in Google Sheets. The implementation should:
1. Track `mousedown` position (start cell: lane 1-8 + time slot)
2. On `mousemove`, calculate the rectangular selection from start to current cell
3. Render a semi-transparent blue overlay on selected cells
4. On `mouseup`, create a block spanning the selection
5. If selection includes column 8 ("Other Location"), prompt for location text
6. Use `requestAnimationFrame` for smooth rendering
7. Track state: `{ isSelecting, startLane, startTime, endLane, endTime }`

### Auto-Save Pattern
```typescript
// useAutoSave.ts pattern
const SAVE_DELAY = 500; // ms

function useAutoSave(blocks: SessionBlock[], sessionId: string) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousBlocksRef = useRef<SessionBlock[]>();

  useEffect(() => {
    if (isEqual(blocks, previousBlocksRef.current)) return;
    
    setSaveStatus('saving');
    clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      try {
        await syncBlocksToSupabase(sessionId, blocks);
        setSaveStatus('saved');
        previousBlocksRef.current = blocks;
      } catch (err) {
        setSaveStatus('error');
      }
    }, SAVE_DELAY);

    return () => clearTimeout(timeoutRef.current);
  }, [blocks, sessionId]);

  return saveStatus;
}
```

### Block Collision Detection
Before placing or moving a block, check for overlaps:
```typescript
function hasCollision(newBlock: BlockPosition, existingBlocks: BlockPosition[]): boolean {
  return existingBlocks.some(existing => 
    newBlock.laneStart <= existing.laneEnd &&
    newBlock.laneEnd >= existing.laneStart &&
    newBlock.timeStart < existing.timeEnd &&
    newBlock.timeEnd > existing.timeStart
  );
}
```

---

## Success Criteria

1. **A coach can plan an entire 2-hour session in under 10 minutes** using drag-and-drop
2. **Every change is saved within 1 second** with no manual save action
3. **The grid feels responsive and snappy** — no lag on drag, resize, or selection
4. **Multiple coaches can view/edit simultaneously** without data loss
5. **The month view gives an instant overview** of the entire program at a glance
6. **The activity library grows organically** as coaches create and reuse activities
7. **Copy/paste workflows eliminate repetitive planning** — copy an hour, copy a session, copy a week

---

## What NOT to Build (Out of Scope for V1)

- Player attendance tracking (exists in separate system)
- Video analysis integration
- Player performance analytics
- Payment/registration management (handled by separate RRA system)
- Mobile-native app (responsive web only)
- AI-powered session suggestions (future Phase 5)
- Integration with external calendars (Google Calendar sync — future)
- Printing/PDF export of session plans (Phase 4)
