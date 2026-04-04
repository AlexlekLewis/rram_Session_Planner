# Activity Library Integration Guide

## Overview

The Activity Library is a slide-out side panel that allows coaches to browse, search, and drag activities onto the session grid. It consists of 4 components:

### Components Created

1. **LibraryPanel.tsx** - Main slide-out panel (right side, 360px wide)
2. **ActivityCard.tsx** - Draggable activity cards within the library
3. **ActivityFilter.tsx** - Filter controls (category dropdown, tier toggles)
4. **TierSelector.tsx** - Popover to select tier variant when dropping activity

## File Locations

All components are in `/app/src/components/activity-library/`:
- `LibraryPanel.tsx`
- `ActivityCard.tsx`
- `ActivityFilter.tsx`
- `TierSelector.tsx`

## Integration Steps

### 1. Add to SessionGrid

In `SessionGrid.tsx`, add state and handlers:

```typescript
import { LibraryPanel } from "@/components/activity-library/LibraryPanel";
import { TierSelector } from "@/components/activity-library/TierSelector";
import { Activity } from "@/lib/types";

// Add state in SessionGrid
const [libraryOpen, setLibraryOpen] = useState(false);
const [tierSelector, setTierSelector] = useState<{
  activity: Activity;
  position: { x: number; y: number };
} | null>(null);

// Handle activity drag start from library
const handleActivityDragStart = (activity: Activity, e: React.DragEvent) => {
  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData("activity-id", activity.id);
};

// Handle activity drop on grid
const handleGridDrop = (e: React.DragEvent, laneStart: number, laneEnd: number, timeStart: string, timeEnd: string) => {
  e.preventDefault();
  const activityId = e.dataTransfer.getData("activity-id");

  if (activityId) {
    // Show tier selector to choose variant
    const activity = /* fetch or pass from library */;
    setTierSelector({
      activity,
      position: { x: e.clientX, y: e.clientY }
    });
  }
};

// Handle tier selection
const handleTierSelect = (tier: Tier) => {
  if (!tierSelector) return;

  const newBlock = onAddBlock({
    session_id: session.id,
    activity_id: tierSelector.activity.id,
    name: tierSelector.activity.name,
    category: tierSelector.activity.category,
    tier,
    lane_start: /* from drop context */,
    lane_end: /* from drop context */,
    time_start: /* from drop context */,
    time_end: /* from drop context */,
    colour: CATEGORY_COLOURS[tierSelector.activity.category],
    coaching_notes: "",
    coaching_points: tierSelector.activity[tier.toLowerCase()]?.coaching_points || [],
    player_groups: [],
    equipment: tierSelector.activity[tier.toLowerCase()]?.equipment || [],
    sort_order: blocks.length,
  });

  setTierSelector(null);
};
```

### 2. Add Library Toggle Button

Add a button in the session header to open/close the library:

```typescript
<button
  onClick={() => setLibraryOpen(!libraryOpen)}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
>
  {libraryOpen ? "Hide" : "Show"} Activity Library
</button>
```

### 3. Render Components

In the SessionGrid render:

```typescript
return (
  <div className="flex h-full">
    {/* Main grid */}
    <GridCanvas
      // ... props
      onDrop={handleGridDrop}
    />

    {/* Library panel */}
    <LibraryPanel
      isOpen={libraryOpen}
      onClose={() => setLibraryOpen(false)}
      onDragStart={handleActivityDragStart}
    />

    {/* Tier selector popover */}
    {tierSelector && (
      <TierSelector
        activity={tierSelector.activity}
        position={tierSelector.position}
        onSelect={handleTierSelect}
        onCancel={() => setTierSelector(null)}
      />
    )}
  </div>
);
```

## Features

### LibraryPanel
- Fixed position on right side (360px wide)
- Slides in/out with CSS transition
- Header with title and close button
- Search bar with icon
- Filter controls below search
- Activity list with scroll
- Shows filtered result count
- Fetches global activities from `sp_activities` table
- Client-side filtering by:
  - Search query (matches name, sub_category, tags)
  - Category filter (dropdown)
  - Tier filters (toggle buttons for R/P/E/G)

### ActivityCard
- Draggable (draggable="true")
- Shows category colored dot on left
- Activity name (font-semibold)
- Sub-category label (if present)
- Description (truncated to 2 lines)
- Tier availability badges (filled if tier has data, gray outline if not)
- Default duration in minutes
- Hover effects: slight shadow lift, grab cursor
- On drag: sets activity ID as drag data

### ActivityFilter
- Row of compact filter controls
- Category: dropdown select with all 13 categories
- Tier toggles: 4 small square buttons (R/P/E/G)
  - Active: filled with tier color, white text
  - Inactive: gray border, gray text
  - Click toggles on/off

### TierSelector
- Fixed position popover near drop location
- Title shows activity name
- 4 tier option cards (stacked vertically)
- Each shows: tier badge, tier name, first line of description
- Disabled/grayed if tier has no data
- Click selects tier and closes popover
- Cancel button
- Closes on Escape key
- Backdrop click to cancel

## Data Structure

### Activity Type (from @/lib/types)
```typescript
interface Activity {
  id: string;
  name: string;
  category: BlockCategory;
  sub_category?: string;
  description?: string;
  regression: TierDetail;      // R tier data
  progression: TierDetail;     // P tier data
  elite: TierDetail;           // E tier data
  gamify: GamifyDetail;        // G tier data
  default_duration_mins: number;
  default_lanes: number;
  equipment: string[];
  tags: string[];
  // ... other fields
}

interface TierDetail {
  description?: string;
  coaching_points?: string[];
  equipment?: string[];
}
```

## Constants Used

From `@/lib/constants`:
- `ALL_CATEGORIES` - array of all 13 block categories
- `CATEGORY_LABELS` - labels for each category
- `CATEGORY_COLOURS` - hex colors for each category
- `TIER_LABELS` - full names (Regression, Progression, Elite, Gamify)
- `TIER_COLOURS` - hex colors for each tier

## Styling

All components use:
- Tailwind CSS for layout and responsive design
- `cn()` utility from `@/lib/utils` for conditional classes
- Lucide React icons (X, Search)
- Inline styles for dynamic colors from constants

## Database Table

Activities are fetched from Supabase table `sp_activities` with:
- `is_global = true` (only show global activities)
- Order by `name` (ascending)
- All fields populated (regression, progression, elite, gamify data)
