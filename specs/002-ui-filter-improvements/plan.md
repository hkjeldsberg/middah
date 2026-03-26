# Implementation Plan: UI & Filter Improvements

**Branch**: `002-ui-filter-improvements` | **Date**: 2026-03-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ui-filter-improvements/spec.md`

## Summary

Six targeted UI and UX improvements to the Middah recipe app: move recipe filtering to the client to eliminate network round-trips, hide filter options with no matching recipes, add a delete button to the recipe detail page, remove the meal planner from the navigation bar, fix button text vertical alignment, and update typography to match the middah.no visual identity using the Geist font.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+
**Primary Dependencies**: Next.js 15.2.3, React 19, Tailwind CSS, @supabase/supabase-js, next/font/google (Geist)
**Storage**: Supabase PostgreSQL (no schema changes)
**Testing**: Manual visual/functional verification (no automated test suite yet)
**Target Platform**: Mobile and desktop browsers (iOS Safari, Android Chrome, Chrome, Firefox, Safari)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Filter interactions under 100ms (client-side, no network latency)
**Constraints**: All touch targets ≥ 44px (constitution), no new dependencies >50 KB gzipped
**Scale/Scope**: Small recipe dataset (tens to low hundreds of records); single-user app

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Check | Notes |
|-----------|-------|-------|
| I. Mobile-First, Cross-Platform | ✅ PASS | All changes are responsive; no desktop-only features introduced |
| II. Simplicity & Minimalism | ✅ PASS | Each change is the minimal modification: one CSS rule, one component removal, one new component |
| III. User Experience First | ✅ PASS | Client-side filtering directly improves perceived performance; delete confirm prevents accidental loss |

**Post-design re-check**: ✅ No violations. Geist font via `next/font/google` adds zero JS bundle weight. No new >50 KB dependencies introduced.

## Project Structure

### Documentation (this feature)

```text
specs/002-ui-filter-improvements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (modified files)

```text
src/
├── app/
│   ├── page.tsx                    # Remove filter params from server query; pass all recipes to RecipeList
│   ├── layout.tsx                  # Wire Geist font variable
│   └── globals.css                 # Add flex-centering rule for buttons
├── components/
│   ├── ui/
│   │   └── NavBar.tsx              # Remove meal planner <Link>
│   └── recipe/
│       ├── RecipeFilters.tsx       # Accept availableCategories/Proteins props; hide empty options
│       ├── RecipeDetail.tsx        # Add delete button (confirm → DELETE API → redirect)
│       └── RecipeList.tsx          # NEW: client component; holds all recipes, applies client-side filtering
└── tailwind.config.ts              # Add Geist font family variable
```

**Structure Decision**: Single Next.js project (Option 1). All changes are in existing files or one new component file. No new packages required except Geist font (already available via `next/font/google`, zero bundle overhead).

## Complexity Tracking

> No constitution violations. Table empty.

---

## Implementation Design

### Change 1 — Frontend Filtering Architecture

**Current state**: `src/app/page.tsx` (RSC) reads `searchParams`, applies `eq('category')` / `eq('protein_source')` filters to the Supabase query. Every URL change (filter selection) triggers a full server re-render and database round-trip.

**Target state**:
1. `page.tsx` fetches ALL recipes (no filter params applied to query) and renders `<RecipeList recipes={recipes} />`.
2. New `RecipeList.tsx` is a client component (`'use client'`) that:
   - Receives all recipes as props
   - Reads `category` / `proteinSource` from `useSearchParams()`
   - Applies filters via `useMemo` on the recipes array
   - Derives `availableCategories` and `availableProteins` (non-empty values present in the full dataset) via `useMemo`
   - Renders `<RecipeFilters availableCategories={...} availableProteins={...} />` and `<RecipeGrid initialRecipes={filteredRecipes} />`

### Change 2 — Hide Empty Filter Options

**Current state**: `RecipeFilters.tsx` renders a hardcoded list of all categories and proteins regardless of whether any recipes exist for them.

**Target state**: `RecipeFilters.tsx` accepts `availableCategories: string[]` and `availableProteins: string[]` props. It only renders `<option>` elements whose `value` is in the corresponding available set (plus the "All" empty-value option which is always shown).

### Change 3 — Delete Recipe

**Current state**: `RecipeDetail.tsx` shows Edit link and WakeLockToggle in non-preview mode. No delete UI exists.

**Target state**: Add a "Slett oppskrift" button in the actions area (alongside the Edit link). On click:
1. `window.confirm('Er du sikker på at du vil slette denne oppskriften?')` — if cancelled, do nothing.
2. Call `DELETE /api/recipes/${recipe.id}`.
3. On success (204), call `router.push('/')`.
4. On error, show a simple alert with the error message.

The `RecipeDetail` component must become aware of routing (needs `useRouter`). It already uses `'use client'`.

### Change 4 — Hide Meal Planner Navigation

**Current state**: `NavBar.tsx` renders two nav links: "Oppskrifter" and "Middagsplan".

**Target state**: Remove the "Middagsplan" `<Link>` block entirely. The `/meal-planner` page continues to exist and function — only its nav entry is removed.

### Change 5 — Button Text Alignment

**Current state**: `globals.css` sets `min-height: 44px; min-width: 44px` on `button`, `a`, `[role="button"]` but does not enforce flex centering. Some buttons appear off-centre vertically.

**Target state**: Extend the global rule to also set `display: flex; align-items: center; justify-content: center` on `<button>` elements. This is a one-line addition that fixes all current and future buttons globally.

### Change 6 — Style Aligned with middah.no (Geist Font)

**Current state**: `layout.tsx` has no custom font import. `globals.css` uses `font-family: system-ui, -apple-system, sans-serif`. `tailwind.config.ts` extends `fontFamily.sans` with `var(--font-sans)` but the variable is never set.

**Target state**:
1. In `layout.tsx`: import `Geist` from `next/font/google` and apply the CSS variable `--font-sans` to `<html>`.
2. `tailwind.config.ts` already maps `font-sans` to `var(--font-sans)` — no changes needed there.
3. No color changes required: `bg-gray-900` (≈#111827) is already close to the middah.no black-on-white aesthetic. The change is purely typographic.
