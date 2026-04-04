# RRA Session Planner — Cowork Project Instructions

## What This Project Is

Build a full-stack web application called **RRA Session Planner** for the Rajasthan Royals Academy Melbourne Elite Program. This is an internal coaching tool where the Head Coach, assistant coaches, guest coaches, and eventually players can log in to plan and view the 12-week T20 Elite Program (mid-April to early July 2026).

## Project Files

| File | Purpose |
|------|---------|
| `RRA_Session_Planner_Meta_Prompt.md` | **THE MAIN BUILD SPEC.** Complete PRD with database schema, data models, UI specs, interaction patterns, activity library, session structure. Read this FIRST and follow it exactly. |
| `brand-assets/BRAND_GUIDE.md` | Official Rajasthan Royals brand guidelines — colours, typography, logo rules |
| `brand-assets/BRAND_PROMPT.md` | Brand compliance system prompt with Tailwind config and CSS variables |
| `brand-assets/Logo_Pink_Transparent.png` | RRA Melbourne logo with transparent background (2000×2000) |
| `brand-assets/Logo_Pink.png` | RRA Melbourne logo on black background (original) |
| `fonts/Montserrat-Bold.ttf` | Montserrat Bold font file |
| `fonts/Montserrat.zip` | Complete Montserrat font family |
| `reference-docs/Elite_Program_Planner.xlsx` | Current planning spreadsheet (Sheet1=budget, Month 1=session overview, Session Plans=detailed plans, Activity Library=39 activities with R/P/G tiers) |
| `reference-docs/Elite_Program_Planner___Extended_Activity_Library.xlsx` | Extended activity library with Elite (E) tier additions for 18-22 age group |

## Tech Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **UI:** React + Tailwind CSS + shadcn/ui
- **Drag & Drop:** @dnd-kit/core + @dnd-kit/sortable
- **Grid Interaction:** Custom implementation (mouse-drag cell selection like Google Sheets)
- **Database:** Supabase (PostgreSQL) — project ref: `pudldzgmluwoocwxtzhw`
- **Realtime:** Supabase Realtime (auto-save every change, live multi-user sync)
- **Auth:** Supabase Auth (email/password + magic link, role-based)
- **Font:** Montserrat ONLY (Google Fonts import)

## Brand Compliance — Non-Negotiable

- **Font:** Montserrat is the ONLY font. Never use Inter, Arial, Helvetica, or any other.
- **Pink:** `#E11F8F` — primary accent, CTAs, active states
- **Blue:** `#1226AA` — structural/navigation colour
- **Navy:** `#001D48` — ONLY in gradients, never flat
- **Gradient:** `linear-gradient(135deg, #001D48 0%, #1226AA 40%, #E11F8F 100%)`
- **Logo:** Use transparent version. Never distort, recolour, or rotate.

## Build Order

Follow the phased approach in the meta prompt:

1. **Phase 1 — Foundation:** Supabase schema, auth, month view, session list, basic grid rendering
2. **Phase 2 — Grid Interactions:** Drag-to-select, block rendering, move, resize, auto-save, undo/redo
3. **Phase 3 — Activity Library:** Side panel, drag-drop to grid, R/P/E/G tiers, copy/paste, seed data
4. **Phase 4 — Multi-user & Polish:** Realtime sync, dark mode, offline support, player view, PDF export

## Key Design Decisions Already Made

- **8 columns** on the session grid (3 machines + 4 long lanes + 1 "Other Location")
- **5-minute time increments** with 15-minute major gridlines
- **R/P/E/G tier system** on every activity (Regression → Progression → Elite → Gamify)
- **13 colour-coded categories** for visual heat-mapping of the grid
- **Auto-save with 500ms debounce** — no save button, optimistic UI
- **Copy Hour** is the killer feature — duplicate an hour of blocks for group rotation

## Start Here

Read `RRA_Session_Planner_Meta_Prompt.md` end to end. It contains everything: the three view levels (Month → Session List → Session Grid), complete database schema, data models, interaction patterns, activity library with all 40+ activities, specialist coach assignments, coaching framework principles, and file structure.
