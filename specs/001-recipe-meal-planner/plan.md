# Implementation Plan: Recipe Manager & Meal Planner

**Branch**: `001-recipe-meal-planner` | **Date**: 2026-03-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-recipe-meal-planner/spec.md`

## Summary

A Norwegian-language web application for organising personal recipes and generating
AI-assisted weekly dinner plans. Built with Next.js (App Router, TypeScript) using
Supabase PostgreSQL for data storage and Supabase Storage for recipe images. Claude
Haiku generates weekly meal titles; Claude Sonnet generates full recipes. The app runs
on both mobile and desktop browsers, with drag-and-drop recipe reordering and a
screen wake lock for cooking mode.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+
**Primary Dependencies**: Next.js 15, @supabase/supabase-js, @supabase/ssr,
  @dnd-kit/core + @dnd-kit/sortable, @anthropic-ai/sdk, Tailwind CSS
**Storage**: Supabase PostgreSQL (recipes, meal plans) + Supabase Storage public bucket
  (recipe images)
**Testing**: None required for initial release (per spec — tests not requested)
**Target Platform**: Mobile browsers (iOS Safari, Android Chrome) + desktop browsers;
  deployed on Vercel
**Project Type**: Web application (full-stack Next.js)
**Performance Goals**: Recipe list loads in < 2 s on mobile; portion scaling updates
  in < 200 ms (client-side, no network); meal title generation in < 10 s
**Constraints**: Mobile-first responsive layout; touch targets ≥ 44 px;
  client bundle lean (dependencies justified in Complexity Tracking below)
**Scale/Scope**: Single user; ~100 recipes; 2 main pages; 38 pre-seeded recipes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post Phase 1 design — all pass.*

### I. Mobile-First, Cross-Platform ✅

- Tailwind CSS responsive utilities (`sm:`, `md:`) enforce mobile-first layout.
- `RecipeCard`, `DaySlot`, and all interactive controls sized to ≥ 44 px touch target.
- dnd-kit uses Pointer Events API — unified mouse + touch; no hover-only interactions.
- Recipe detail view stacks ingredients and instructions vertically on viewports < 375 px.

### II. Simplicity & Minimalism ✅ (2 exceptions — justified in Complexity Tracking)

- No UI component library; components are hand-built with Tailwind CSS.
- No external state management library; React built-in state only.
- No form library; native HTML form elements.
- No ORM or query builder; direct Supabase client calls.
- 2 dependencies exceed or approach the 50 KB limit — documented below.

### III. User Experience First ✅

- Drag-and-drop reorder uses optimistic UI (list updates immediately; PATCH call fires
  in background).
- Recipe list uses skeleton placeholders during initial load.
- Wake Lock unsupported on iOS Safari → `WakeLockToggle` shows a Norwegian disabled
  message, not silent failure.
- All AI generation errors return actionable Norwegian error messages with retry option.
- Offline: recipe list and detail pages degrade to an empty-state message (constitution
  requirement); no broken UI.

## Project Structure

### Documentation (this feature)

```text
specs/001-recipe-meal-planner/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                         # Root layout: NavBar + Footer
│   ├── page.tsx                           # Recipe list (landing page)
│   ├── recipes/
│   │   ├── new/page.tsx                   # Create recipe form
│   │   └── [id]/
│   │       ├── page.tsx                   # Recipe detail view
│   │       └── edit/page.tsx              # Edit recipe form
│   ├── meal-planner/
│   │   └── page.tsx                       # Weekly meal planner
│   └── api/
│       ├── recipes/
│       │   ├── route.ts                   # GET list+filter, POST create
│       │   ├── reorder/route.ts           # PATCH bulk sort_order
│       │   └── [id]/
│       │       ├── route.ts               # GET detail, PUT update, DELETE
│       │       └── image/route.ts         # POST upload image
│       ├── meal-plans/
│       │   ├── current/route.ts           # GET or create current week plan
│       │   ├── generate/route.ts          # POST generate meal titles (Claude Haiku)
│       │   └── [planId]/days/[dayId]/
│       │       ├── route.ts               # PATCH skip / swap
│       │       └── generate-recipe/
│       │           └── route.ts           # POST generate full recipe (Claude Sonnet)
│       └── seed/route.ts                  # POST seed dev data (dev only)
├── components/
│   ├── recipe/
│   │   ├── RecipeCard.tsx                 # thumbnail + title + prepTime
│   │   ├── RecipeGrid.tsx                 # dnd-kit SortableContext wrapper
│   │   ├── RecipeFilters.tsx              # category + protein source selectors
│   │   ├── RecipeDetail.tsx               # two-column ingredients/instructions
│   │   ├── PortionControl.tsx             # +/- stepper, min 1
│   │   ├── WakeLockToggle.tsx             # toggle + unsupported state
│   │   └── RecipeForm.tsx                 # create / edit form
│   ├── meal-planner/
│   │   ├── WeekView.tsx                   # 7-day grid
│   │   ├── DaySlot.tsx                    # individual day card + action menu
│   │   └── CuisineSelector.tsx            # multi-select cuisine chips
│   └── ui/
│       ├── NavBar.tsx                     # links: Oppskrifter | Middagsplan
│       ├── Footer.tsx                     # GitHub + LinkedIn links
│       └── EmptyState.tsx                 # reusable empty/error placeholder
├── hooks/
│   └── useWakeLock.ts                     # Screen Wake Lock API, SSR-safe
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # createBrowserClient (anon key)
│   │   └── server.ts                      # createClient (service role key)
│   ├── ai/
│   │   └── claude.ts                      # Haiku (titles) + Sonnet (recipes)
│   ├── scaling.ts                         # scaleAmount() + resolveTokens()
│   └── seed.ts                            # seed mapping + batch insert logic
├── types/
│   └── index.ts                           # Recipe, Ingredient, MealPlan, etc.
└── recipe-data/                           # Pre-existing seed data (migrated here)
    ├── recipes.json
    └── recipes-img/
```

**Structure Decision**: Single Next.js project. The App Router colocates frontend pages
and backend Route Handlers under `src/app/`. No separate backend process or repo.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| `@supabase/supabase-js` + `@supabase/ssr` ~45–55 KB gzipped (at/above 50 KB limit) | Required to interact with Supabase DB and Storage; no lighter client exists | Direct `fetch` calls to the Supabase REST API would require reimplementing auth headers, error handling, and storage upload logic — more code, same dependency on Supabase |
| `@dnd-kit/core` + `@dnd-kit/sortable` ~27 KB gzipped | Drag-and-drop reordering is an explicit core requirement (FR-002) | Native HTML5 drag-and-drop has poor mobile touch support; implementing from scratch adds ~same code size without accessibility or touch support |
