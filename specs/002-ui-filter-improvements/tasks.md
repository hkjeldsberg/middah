# Tasks: UI & Filter Improvements

**Input**: Design documents from `/specs/002-ui-filter-improvements/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.
**Tests**: Not requested in specification — no test tasks included.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)

---

## Phase 1: Setup

**Purpose**: Verify environment readiness — no new npm packages required.

- [x] T001 Confirm `next/font/google` is available by checking `package.json` for `next` version ≥ 15.0.0 (Geist font is included in `next/font/google` with no additional install)

---

## Phase 2: Foundational (Blocking Prerequisite for US1 & US2)

**Purpose**: Create the `RecipeList` client component skeleton that both US1 and US2 build on. US3–US6 are independent and can start after Phase 1.

**⚠️ CRITICAL**: US1 and US2 cannot start until this phase is complete. US3, US4, US5, US6 can start in parallel with this phase.

- [x] T002 Create `src/components/recipe/RecipeList.tsx` as a `'use client'` component that accepts `recipes: Recipe[]` prop and renders `<RecipeFilters />` and `<RecipeGrid initialRecipes={recipes} />`

**Checkpoint**: `RecipeList` renders recipes and filters (without client-side logic yet) — US1/US2 work can now begin.

---

## Phase 3: User Story 1 — Frontend Recipe Filtering (Priority: P1) 🎯 MVP

**Goal**: Apply category and protein filters entirely in the browser using data already loaded on page render. No network request fires when filters change.

**Independent Test**: Open DevTools Network tab → load the home page → select a category filter → confirm no new XHR/fetch requests appear in the network log. Results update instantly.

### Implementation for User Story 1

- [x] T003 [US1] Update `src/app/page.tsx` to remove `category` and `proteinSource` filter params from the Supabase query and render `<RecipeList recipes={recipes} />` in place of `<RecipeGrid initialRecipes={recipes} />`
- [x] T004 [US1] Add `useSearchParams`-based filter state and `useMemo`-filtered recipe list to `src/components/recipe/RecipeList.tsx`; pass `filteredRecipes` to `<RecipeGrid initialRecipes={filteredRecipes} />`

**Checkpoint**: Category and protein filters work instantly client-side with no network round-trips. URL still updates on filter change (`?category=X`), preserving shareability.

---

## Phase 4: User Story 2 — Hide Empty Filter Options (Priority: P1)

**Goal**: Filter dropdowns only show categories and protein sources for which at least one recipe exists in the currently loaded dataset.

**Independent Test**: Ensure a recipe category exists in the DB for some but not all categories. Open the category dropdown — only categories with matching recipes appear.

### Implementation for User Story 2

- [x] T005 [US2] Add `useMemo` derivations for `availableCategories` and `availableProteins` (sets of non-empty values present in the full unfiltered `recipes` array) in `src/components/recipe/RecipeList.tsx`; pass as props to `<RecipeFilters availableCategories={...} availableProteins={...} />`
- [x] T006 [US2] Update `src/components/recipe/RecipeFilters.tsx` to accept `availableCategories: string[]` and `availableProteins: string[]` props; filter rendered `<option>` elements to only include options whose `value` is in the corresponding available set (the "Alle" empty-string option is always shown)

**Checkpoint**: No empty-result filter options appear in either dropdown.

---

## Phase 5: User Story 3 — Delete Recipe (Priority: P2)

**Goal**: Users can delete a recipe from the recipe detail page with a single confirmation step.

**Independent Test**: Navigate to any recipe page → click "Slett oppskrift" → click Cancel → recipe unchanged. Repeat → click OK → recipe is gone from the list and the page redirects to `/`.

### Implementation for User Story 3

- [x] T007 [US3] Add a "Slett oppskrift" button in the actions area of `src/components/recipe/RecipeDetail.tsx` (non-preview mode only); on click, call `window.confirm('Er du sikker på at du vil slette denne oppskriften?')`; on confirm, call `DELETE /api/recipes/${recipe.id}` and then `router.push('/')` on success; on API error, show `alert()` with the error message; add `useRouter` import from `next/navigation`

**Checkpoint**: Recipe can be deleted from the detail page. Cancel leaves recipe intact. Success redirects to recipe list.

---

## Phase 6: User Story 4 — Hide Meal Planner Navigation (Priority: P2)

**Goal**: The meal planner link is removed from the navigation bar. The `/meal-planner` page remains accessible via direct URL.

**Independent Test**: Load the app — confirm only "Oppskrifter" appears in the nav. Navigate directly to `/meal-planner` — page loads normally.

### Implementation for User Story 4

- [x] T008 [US4] Remove the `/meal-planner` `<Link>` block (lines 29–37) from `src/components/ui/NavBar.tsx`

**Checkpoint**: Nav shows only the "Oppskrifter" link. `/meal-planner` still loads when visited directly.

---

## Phase 7: User Story 5 — Button Text Alignment (Priority: P3)

**Goal**: All button labels are visually centered both horizontally and vertically within the button boundary on every page.

**Independent Test**: Visually inspect all buttons across the home page, recipe detail page, recipe form, and nav — no button label appears closer to one edge than the other.

### Implementation for User Story 5

- [x] T009 [US5] In `src/app/globals.css`, extend the existing `button` selector rule to add `display: flex; align-items: center; justify-content: center;` alongside the existing `min-height: 44px; min-width: 44px;` declarations

**Checkpoint**: All buttons render with centered text at every size.

---

## Phase 8: User Story 6 — Style Aligned with middah.no (Priority: P3)

**Goal**: The app uses the Geist font (the same geometric sans-serif used on middah.no), completing the visual alignment with the Middah brand identity.

**Independent Test**: Open the app and middah.no side by side — the font rendering (letter shapes, weight, spacing) should be recognizably the same typeface.

### Implementation for User Story 6

- [x] T010 [US6] In `src/app/layout.tsx`, import `{ Geist }` from `'next/font/google'`; instantiate it with `variable: '--font-sans'` and `subsets: ['latin']`; apply the generated `className` (e.g., `geist.variable`) to the `<html>` element — `tailwind.config.ts` already maps `font-sans` to `var(--font-sans)`, so no further changes are needed there

**Checkpoint**: App renders in Geist font. Visual comparison with middah.no confirms consistent typography.

---

## Final Phase: Polish & Validation

**Purpose**: End-to-end validation of all six user stories.

- [x] T011 Run `npm run dev` and walk through all acceptance scenarios from `specs/002-ui-filter-improvements/quickstart.md`; confirm each change works as specified and no regressions are visible in the recipe list, recipe detail, or meal planner pages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks US1 and US2 only
- **Phase 3 (US1)**: Depends on Phase 2 — fetch refactor and client-side filtering
- **Phase 4 (US2)**: Depends on Phase 3 — extends the same `RecipeList` component
- **Phase 5 (US3)**: Independent — can run in parallel with Phases 2–4
- **Phase 6 (US4)**: Independent — can run in parallel with Phases 2–5
- **Phase 7 (US5)**: Independent — can run in parallel with Phases 2–6
- **Phase 8 (US6)**: Independent — can run in parallel with Phases 2–7
- **Final Phase**: Depends on all story phases complete

### User Story Dependencies

```
T001 (Setup)
  └── T002 (RecipeList skeleton)
        ├── T003 → T004 (US1: filtering)
        │         └── T005 → T006 (US2: hide empty options)
        └── (not required for US3–US6)

T001 (Setup)
  ├── T007 (US3: delete — independent)
  ├── T008 (US4: hide nav — independent)
  ├── T009 (US5: button alignment — independent)
  └── T010 (US6: Geist font — independent)
```

### Within Each User Story

- T003 before T004 (same file, sequential additions)
- T005 before T006 (T006 depends on props interface defined in T005)
- All other story tasks are single-task phases with no intra-phase ordering issues

### Parallel Opportunities

After T001 completes, the following can run simultaneously:
- **Track A** (US1/US2): T002 → T003 → T004 → T005 → T006
- **Track B** (US3): T007
- **Track C** (US4): T008
- **Track D** (US5): T009
- **Track E** (US6): T010

---

## Parallel Example: US3, US4, US5, US6 After Phase 1

```bash
# After T001 completes — these four can run in parallel (different files):
Task T007: "Add delete button to src/components/recipe/RecipeDetail.tsx"
Task T008: "Remove meal planner link from src/components/ui/NavBar.tsx"
Task T009: "Add flex-centering to button rule in src/app/globals.css"
Task T010: "Import Geist font in src/app/layout.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 — highest impact)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002)
3. Complete Phase 3: US1 — Frontend Filtering (T003, T004)
4. Complete Phase 4: US2 — Hide Empty Options (T005, T006)
5. **STOP and VALIDATE**: Confirm filters are instant and empty options are hidden
6. Continue with US3–US6 in any order

### Incremental Delivery

Each phase after Phase 2 is independently deployable:
- After Phase 3+4: Core filtering performance improved ✅
- After Phase 5: Delete recipe available ✅
- After Phase 6: Clean navigation ✅
- After Phase 7: Visual button polish ✅
- After Phase 8: Brand-aligned typography ✅

---

## Notes

- [P] tasks can run in parallel (different files, no blocking dependencies)
- [Story] label maps each task to its spec user story for traceability
- T007 uses the existing `DELETE /api/recipes/[id]` backend route — no server changes required
- T010 uses `next/font/google` which is part of Next.js — no `npm install` needed
- The `tailwind.config.ts` already wires `var(--font-sans)` to `font-sans` — T010 simply activates it
- Commit after each phase or story for clean git history
