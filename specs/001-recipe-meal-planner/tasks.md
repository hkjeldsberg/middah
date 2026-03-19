# Tasks: Recipe Manager & Meal Planner

**Input**: Design documents from `/specs/001-recipe-meal-planner/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api.md ✅ quickstart.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all implementation tasks

## Path Conventions

- Next.js App Router: `src/app/` for pages and route handlers
- Components: `src/components/{recipe,meal-planner,ui}/`
- Shared logic: `src/lib/`, `src/hooks/`, `src/types/`

---

## Phase 1: Setup (Project Bootstrap)

**Purpose**: Create the Next.js project and wire up shared infrastructure used by all stories.

- [X] T001 Bootstrap Next.js project: `npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"` in the repo root (produces `package.json`, `tsconfig.json`, `tailwind.config.ts`, `src/app/`)
- [X] T002 Install dependencies: `npm install @supabase/supabase-js @supabase/ssr @dnd-kit/core @dnd-kit/sortable @anthropic-ai/sdk` (updates `package.json`)
- [X] T003 [P] Verify `tsconfig.json` has `"strict": true` and `@/*` path alias pointing to `./src/*`
- [X] T004 [P] Define all shared TypeScript types (Recipe, Ingredient, IngredientGroup, InstructionStep, InstructionGroup, MealPlan, MealPlanDay, RecipeSource, DayStatus) in `src/types/index.ts` per `data-model.md`
- [X] T005 [P] Set up Supabase server client using `createClient` with `SUPABASE_SERVICE_ROLE_KEY` in `src/lib/supabase/server.ts`
- [X] T006 [P] Set up Supabase browser client using `createBrowserClient` from `@supabase/ssr` with `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `src/lib/supabase/client.ts`
- [X] T007 [P] Create `.env.local` with all four environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- [X] T008 [P] Build NavBar component with links "Oppskrifter" (→ `/`) and "Middagsplan" (→ `/meal-planner`); mobile-friendly with ≥ 44 px tap targets in `src/components/ui/NavBar.tsx`
- [X] T009 [P] Build Footer component with GitHub and LinkedIn icon links; placeholder hrefs to be replaced with real URLs in `src/components/ui/Footer.tsx`
- [X] T010 [P] Build reusable EmptyState component (icon, Norwegian heading, optional CTA button props) in `src/components/ui/EmptyState.tsx`
- [X] T011 Wire NavBar and Footer into root layout; set `<html lang="no">`; remove default Next.js boilerplate in `src/app/layout.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and shared utilities that ALL user stories depend on.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [X] T012 Write all 7 table DDL statements and indexes from `data-model.md` to `supabase/migrations/001_initial.sql` and execute via the Supabase dashboard SQL Editor
- [X] T013 [P] Implement `scaleAmount(base, defaultServings, currentServings)` and `resolveTokens(text, ingredients, defaultServings, currentServings)` utilities in `src/lib/scaling.ts`
- [X] T014 [P] Implement Claude API wrapper with `generateMealTitles(cuisines: string[], days: number)` (uses `claude-haiku-4-5-20251001`) and `generateRecipe(mealTitle: string)` (uses `claude-sonnet-4-6`); both return Norwegian-language structured JSON in `src/lib/ai/claude.ts`
- [X] T015 [P] Create seed data mapping for all 38 recipes in `src/lib/seed.ts`: assign `category` and `protein_source` to each recipe by `id` (reference recipe names from `src/recipe-data/recipes.json`); export `SEED_MAPPINGS` record

**Checkpoint**: Schema migrated, scaling utilities ready, Claude wrapper implemented, seed mappings defined — all user stories can now proceed in parallel.

---

## Phase 3: User Story 1 — Recipe List & Recipe Detail View (Priority: P1) 🎯 MVP

**Goal**: Users can browse, filter, drag-drop reorder, create, edit, and view recipes with scaled portion sizes and keep-screen-on.

**Independent Test**: Create a recipe manually, apply category filter, drag to reorder, open detail page, change portion size — verify quantities update. No meal planner or AI needed.

### API Routes for User Story 1

- [X] T016 [P] [US1] Implement `GET /api/recipes` (list; query params: `category?`, `proteinSource?`; ordered by `sort_order`) and `POST /api/recipes` (create recipe with ingredient/instruction groups in a transaction) in `src/app/api/recipes/route.ts`
- [X] T017 [P] [US1] Implement `GET /api/recipes/[id]` (full detail including ingredient and instruction groups), `PUT /api/recipes/[id]` (replace all groups), `DELETE /api/recipes/[id]` (cascade + delete image from storage) in `src/app/api/recipes/[id]/route.ts`
- [X] T018 [P] [US1] Implement `PATCH /api/recipes/reorder` (accept `[{id, sortOrder}]` array; batch update `sort_order` column) in `src/app/api/recipes/reorder/route.ts`
- [X] T019 [P] [US1] Implement `POST /api/recipes/[id]/image` (accept `multipart/form-data`; upload to Supabase Storage `recipe-images` bucket; update `image_path` in recipes table; return `imageUrl`) in `src/app/api/recipes/[id]/image/route.ts`
- [X] T020 [P] [US1] Implement `POST /api/seed` (reads `src/recipe-data/recipes.json`; uses `SEED_MAPPINGS` from `src/lib/seed.ts`; uploads images to storage; batch inserts all recipes and related rows; returns 403 when `NODE_ENV === 'production'`) in `src/app/api/seed/route.ts`

### Recipe List Components

- [X] T021 [P] [US1] Build RecipeCard component (thumbnail `<img>` from public Supabase URL, title, prep time; entire card is a link to `/recipes/[id]`; min 44 px height) in `src/components/recipe/RecipeCard.tsx`
- [X] T022 [P] [US1] Build RecipeFilters component (two `<select>` elements: food category and protein source; Norwegian option labels matching enums in `data-model.md`; "Alle" default option) in `src/components/recipe/RecipeFilters.tsx`
- [X] T023 [US1] Build RecipeGrid component using `@dnd-kit/core` `DndContext` and `@dnd-kit/sortable` `SortableContext`; on drag end fires `PATCH /api/recipes/reorder` after optimistic local reorder; wraps RecipeCard items in `src/components/recipe/RecipeGrid.tsx`
- [X] T024 [US1] Build recipe landing page: fetch recipe list server-side from `GET /api/recipes`; render RecipeFilters (client-side filter re-fetch) + RecipeGrid + EmptyState when list is empty in `src/app/page.tsx`

### Recipe Detail Components

- [X] T025 [P] [US1] Build PortionControl component (+/- buttons with `min={1}`; displays current portion count; Norwegian "porsjoner" label; all controls ≥ 44 px) in `src/components/recipe/PortionControl.tsx`
- [X] T026 [P] [US1] Implement `useWakeLock` hook: SSR-safe (`typeof navigator` guard); requests lock on mount; re-requests on `visibilitychange` when page becomes visible; exposes `{ isActive, isSupported, toggle }` in `src/hooks/useWakeLock.ts`
- [X] T027 [P] [US1] Build WakeLockToggle component: toggle switch bound to `useWakeLock`; when `isSupported === false` renders disabled state with Norwegian text "Holde skjermen på støttes ikke på denne enheten" in `src/components/recipe/WakeLockToggle.tsx`
- [X] T028 [US1] Build RecipeDetail component: two-column layout (ingredients left, instructions right) collapsing to single column below `sm:` breakpoint; integrates PortionControl (state lifted here) and calls `resolveTokens()` on instruction step text to display scaled quantities; includes WakeLockToggle in `src/components/recipe/RecipeDetail.tsx`
- [X] T029 [US1] Build recipe detail page: fetch full recipe server-side from `GET /api/recipes/[id]`; render RecipeDetail; include edit link (→ `/recipes/[id]/edit`) and delete button (calls `DELETE /api/recipes/[id]`, navigates to `/`) in `src/app/recipes/[id]/page.tsx`

### Recipe Create / Edit

- [X] T030 [P] [US1] Build RecipeForm component: fields for name, description, category (select), protein_source (select), servings (radio: 2 or 4), prep_time (text), image upload (file input); dynamic ingredient group builder (add/remove groups and rows); dynamic instruction group builder; all labels in Norwegian; accepts optional `initialData` prop for edit mode in `src/components/recipe/RecipeForm.tsx`
- [X] T031 [US1] Build create recipe page: render RecipeForm; on submit call `POST /api/recipes` then `POST /api/recipes/[id]/image` if image selected; navigate to `/recipes/[id]` on success in `src/app/recipes/new/page.tsx`
- [X] T032 [US1] Build edit recipe page: fetch full recipe from `GET /api/recipes/[id]`; render RecipeForm pre-filled with `initialData`; on submit call `PUT /api/recipes/[id]` then `POST /api/recipes/[id]/image` if new image selected in `src/app/recipes/[id]/edit/page.tsx`

### Seed Execution

- [ ] T033 [US1] Run `POST /api/seed` endpoint in development (`curl -X POST http://localhost:3000/api/seed`) to populate the database with the 38 pre-existing recipes; verify the recipe list page displays all recipes with thumbnails

**Checkpoint**: Recipe list loads with thumbnails, category/protein filters work, drag-drop reorder persists after refresh, recipe detail shows two-column layout with scaled quantities, create and edit forms work, wake-lock toggle visible.

---

## Phase 4: User Story 2 — Weekly Meal Planner (Priority: P2)

**Goal**: User selects cuisines, generates a week of dinner titles, then per-day can regenerate, swap, or skip.

**Independent Test**: Open meal planner, select "Indisk" + "Italiensk", generate week, regenerate Monday, swap Tuesday ↔ Thursday, skip Wednesday — verify plan reflects all changes.

### API Routes for User Story 2

- [X] T03x [P] [US2] Implement `GET /api/meal-plans/current` (find or create meal plan for the ISO-week containing today; create 7 `meal_plan_days` rows with status `empty` if new; return full plan with days) in `src/app/api/meal-plans/current/route.ts`
- [X] T03x [P] [US2] Implement `POST /api/meal-plans/generate` (accept `{planId, cuisines[]}`; call `generateMealTitles()` for all non-skipped days; update `meal_title` and set `status = 'suggested'`; return updated plan) in `src/app/api/meal-plans/generate/route.ts`
- [X] T03x [P] [US2] Implement `PATCH /api/meal-plans/[planId]/days/[dayId]` (accept `{action: 'skip' | 'swap' | 'regenerate', withDayId?}`; for regenerate call `generateMealTitles()` for one day; for swap exchange `meal_title` and `recipe_id` between two days; for skip set `status = 'skipped'`; return updated plan) in `src/app/api/meal-plans/[planId]/days/[dayId]/route.ts`

### Meal Planner Components

- [X] T03x [P] [US2] Build CuisineSelector component: multi-select chip group with 6 default cuisines (Indisk, Thai, Sør-Amerikansk, Skandinavisk, Italiensk, Middelhavet); selected chips highlighted; at least one must be selected to enable generate button in `src/components/meal-planner/CuisineSelector.tsx`
- [X] T03x [P] [US2] Build DaySlot component: shows weekday name (Norwegian), meal title or empty/skipped placeholder; action menu button revealing options "Regenerer", "Bytt dag" (opens day picker), "Hopp over"; skeleton state during generation in `src/components/meal-planner/DaySlot.tsx`
- [X] T03x [US2] Build WeekView component: 7 DaySlot components in a responsive grid (1-col mobile, 7-col desktop); manages selected-for-swap state; handles all day-action callbacks and fires appropriate PATCH calls in `src/components/meal-planner/WeekView.tsx`
- [X] T04x [US2] Build meal planner page: fetch current plan from `GET /api/meal-plans/current`; render CuisineSelector + "Generer uke" button + WeekView; show Norwegian error message with retry on generation failure in `src/app/meal-planner/page.tsx`

**Checkpoint**: Meal planner generates 7 Norwegian dinner titles, individual days can be regenerated/swapped/skipped, week state persists in database.

---

## Phase 5: User Story 3 — Recipe Generation & Saving from Meal Planner (Priority: P3)

**Goal**: User generates a full recipe from a meal title in the planner, reviews it, and saves it to the recipe list.

**Independent Test**: From meal planner, click "Lag oppskrift" on a suggested meal → full recipe appears in recipe detail view → click "Lagre" → recipe appears in the recipe list.

- [X] T04x [US3] Implement `POST /api/meal-plans/[planId]/days/[dayId]/generate-recipe` (call `generateRecipe(mealTitle)` with Claude Sonnet; return structured recipe JSON matching the Recipe type; do NOT save to DB — caller decides) in `src/app/api/meal-plans/[planId]/days/[dayId]/generate-recipe/route.ts`
- [X] T04x [US3] Add "Lag oppskrift" action to DaySlot (only when `status === 'suggested'`); on click call generate-recipe endpoint and pass result via URL state/query to recipe preview page in `src/components/meal-planner/DaySlot.tsx`
- [X] T04x [US3] Build recipe preview page for AI-generated recipes: render RecipeDetail in read-only preview mode with "Lagre oppskrift" button; on save call `POST /api/recipes` (and image upload if applicable) then redirect to `/recipes/[id]` in `src/app/recipes/preview/page.tsx`
- [X] T04x [US3] After saving a generated recipe update the corresponding `meal_plan_days.recipe_id` by calling `PATCH /api/meal-plans/[planId]/days/[dayId]` with `{action: 'link', recipeId}`; add `link` action handler to the PATCH route in `src/app/api/meal-plans/[planId]/days/[dayId]/route.ts`

**Checkpoint**: Full recipe generated from meal title in Norwegian, displayed in recipe detail view, saveable to recipe list where it appears with thumbnail and preparation time.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that span all user stories.

- [X] T04x [P] Responsive layout audit: test every page at 375 px viewport; verify ingredient + instruction columns stack vertically on recipe detail; verify meal planner week view shows as single column on mobile
- [X] T04x [P] Touch target audit: measure all interactive elements (RecipeCard, NavBar links, action buttons, DaySlot menu, form inputs) on mobile; any element below 44 px × 44 px MUST be resized
- [X] T04x [P] Error state implementation: wrap all `fetch` calls in try/catch; render Norwegian actionable error messages with retry buttons in every component that calls an API; ensure no component is left in a loading state on network failure
- [X] T04x [P] Norwegian language audit: scan all `.tsx` files for any English UI strings, placeholders, or aria-labels; replace with Norwegian Bokmål equivalents
- [X] T04x Offline degradation: verify recipe list and detail pages show EmptyState (not a crash) when Supabase is unreachable; verify meal planner shows error state (not blank) when AI call fails

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Phase 1 complete (needs Supabase clients, TypeScript types)
- **US1 (Phase 3)**: Requires Phase 2 complete (needs DB schema + scaling lib)
- **US2 (Phase 4)**: Requires Phase 2 complete (needs DB schema + Claude lib); can run in parallel with US1
- **US3 (Phase 5)**: Requires US1 (recipe detail view) and US2 (meal planner DaySlot) to be complete
- **Polish (Phase N)**: Requires all desired user stories to be complete

### Within User Story 1

- T016–T020 (API routes): all parallel
- T021, T022, T025, T026, T030: all parallel
- T023 depends on T021 (RecipeCard must exist)
- T024 depends on T023 (RecipeGrid must exist)
- T027 depends on T026 (useWakeLock must exist)
- T028 depends on T025 and T027 (PortionControl + WakeLockToggle must exist)
- T029 depends on T028 (RecipeDetail must exist)
- T031 depends on T030 (RecipeForm must exist)
- T032 depends on T030 (RecipeForm must exist)
- T033 depends on T020 and T015 (seed route + seed mapping must exist)

### Within User Story 2

- T034–T036 (API routes): all parallel; T036 depends on T014 (Claude lib)
- T037, T038: parallel
- T039 depends on T038 (DaySlot must exist)
- T040 depends on T037 and T039 (CuisineSelector + WeekView must exist)

### Within User Story 3

- T041 depends on T014 (Claude lib must exist)
- T042 depends on T038 (DaySlot must exist) and T041
- T043 depends on T028 (RecipeDetail must exist)
- T044 depends on T036 (PATCH route must exist)

### Parallel Opportunities

```bash
# Phase 1 — all parallel after T001 + T002:
T003, T004, T005, T006, T007, T008, T009, T010  # run together

# Phase 2 — all parallel after T012:
T013, T014, T015  # run together

# Phase 3 — API routes:
T016, T017, T018, T019, T020  # run together

# Phase 3 — base components:
T021, T022, T025, T026, T030  # run together

# Phase 4 — API routes:
T034, T035, T036  # run together

# Phase 4 — components:
T037, T038  # run together

# Polish:
T045, T046, T047, T048  # run together
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T011)
2. Complete Phase 2: Foundational (T012–T015)
3. Complete Phase 3: User Story 1 (T016–T033)
4. **STOP and VALIDATE**: Recipe list functional with all 38 seeded recipes
5. Deploy to Vercel with all env vars configured

### Incremental Delivery

1. Setup + Foundational → Dev environment ready
2. User Story 1 → Recipe library fully functional (MVP)
3. User Story 2 → Meal planning added
4. User Story 3 → Full AI recipe loop complete
5. Polish → Production-ready

---

## Notes

- `[P]` tasks within the same phase operate on different files — safe to run in parallel
- All Norwegian text should use Bokmål (not Nynorsk)
- `resolveTokens()` in `src/lib/scaling.ts` is the single source of truth for portion scaling in instruction text
- Wake Lock is not supported on iOS Safari — always show the unsupported state gracefully
- The seed endpoint (`POST /api/seed`) must never run in production
- Supabase service role key must never appear in client-side code or be prefixed with `NEXT_PUBLIC_`
