# Feature Specification: Recipe Manager & Meal Planner

**Feature Branch**: `001-recipe-meal-planner`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "Build an application that can help me organize both my custom created recipes (recipe list), but also work as a meal planner (meal planner page)..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recipe List & Recipe Detail View (Priority: P1)

A user opens the app and lands on the recipe list page. They see all their saved recipes
displayed as cards sorted by creation date. They can drag and drop cards to reorder them,
and apply filters to narrow by food category (e.g. dinner, pastry, aperitif, dessert) or
protein source (e.g. chicken, fish, vegetarian). Clicking a recipe card opens the recipe
detail page showing ingredients on the left and step-by-step instructions on the right.
The user adjusts the portion size and all ingredient quantities scale accordingly. When
cooking, the user can enable "keep screen on" to prevent the device from sleeping.

**Why this priority**: This is the core value of the app — organising and accessing recipes.
Without it, the meal planner has nothing to draw from and the app delivers no value.

**Independent Test**: Can be fully tested by creating a recipe, browsing the list with
filters active, and opening the recipe detail page with portion adjustment — without any
AI or meal planner functionality.

**Acceptance Scenarios**:

1. **Given** the recipe list has recipes, **When** the user applies a food-category filter,
   **Then** only matching recipes are displayed.
2. **Given** the recipe list has recipes, **When** the user drags a recipe card to a new
   position, **Then** the new order persists after a page refresh.
3. **Given** a recipe detail page is open with default portions, **When** the user increases
   portion size, **Then** all ingredient quantities scale proportionally and inline quantity
   references in instructions update to match.
4. **Given** the recipe detail page is open on a mobile device, **When** the user enables
   "keep screen on", **Then** the device does not dim or lock while the page is in focus.

---

### User Story 2 - Weekly Meal Planner (Priority: P2)

A user navigates to the meal planner page. They select one or more cuisines from a default
list (Indian, Thai, South American, Scandinavian, Italian, Mediterranean) and trigger meal
generation. The planner fills a 7-day week view with one dinner suggestion per day (title
only). For each suggested meal the user can: regenerate just that meal, swap it with another
day's meal, or skip it (mark the day as empty).

**Why this priority**: The AI-assisted meal planning feature differentiates the app from a
static recipe book. It builds on top of P1's recipe infrastructure but is independently useful.

**Independent Test**: Can be fully tested by generating a week of meals with selected cuisines,
performing a swap and a skip, and verifying the day view reflects changes — without saving
any recipes.

**Acceptance Scenarios**:

1. **Given** the user has selected at least one cuisine, **When** they trigger generation,
   **Then** a 7-day week view is populated with one meal title per day.
2. **Given** a generated week view, **When** the user regenerates a single day,
   **Then** only that day's meal changes; the remaining days are unaffected.
3. **Given** a generated week view, **When** the user swaps two days,
   **Then** the two meal titles exchange positions.
4. **Given** a generated week view, **When** the user skips a day,
   **Then** that day is marked as empty/skipped with a clear visual indicator.

---

### User Story 3 - Recipe Generation & Saving from Meal Planner (Priority: P3)

A user sees a meal title they like in the meal planner. They trigger full recipe generation
for that meal. The app generates a complete recipe (ingredients, instructions, preparation
time, food category, protein type) and displays it in the standard recipe detail view.
The user reviews it and saves it to their recipe list where it appears alongside all other
recipes.

**Why this priority**: This closes the loop between planning and the recipe library.
The app is useful without it (P1 + P2 standalone), but this feature significantly increases
the value of the meal planner.

**Independent Test**: Can be fully tested by generating a full recipe from a meal planner
suggestion, reviewing the recipe detail view, and confirming it appears in the recipe list
after saving.

**Acceptance Scenarios**:

1. **Given** a meal title in the planner, **When** the user triggers recipe generation,
   **Then** a complete recipe with ingredients, instructions, preparation time, food
   category, and protein source is generated and shown in the recipe detail view.
2. **Given** a generated recipe is shown, **When** the user saves it to the recipe list,
   **Then** it appears in the recipe list with thumbnail, title, and preparation time visible.
3. **Given** a saved recipe from the planner, **When** the user edits the portion size,
   **Then** quantities scale correctly as with any manually created recipe.

---

### Edge Cases

- What happens when no recipes exist yet? → Show an empty state with a clear call-to-action
  to create the first recipe or generate one via the meal planner.
- What happens if meal generation fails (network or AI error)? → Show a user-friendly error
  with a retry option; do not leave the day view in a broken state.
- What happens if the user sets portion size to zero or below? → Minimum portion size is 1;
  the decrement control is disabled at 1.
- What happens on narrow viewports (< 375 px wide)? → Ingredients and instructions stack
  vertically rather than side-by-side on the recipe detail page.
- What happens when the user swaps a day with itself? → No-op; no visible change.
- What happens if the user skips all 7 days? → All days show the skipped state; the week
  view remains and individual days can be regenerated.
- What happens if two filters return zero results? → Show an empty state message; do not
  hide the filter controls.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST display the recipe list page as the default landing page, sorted
  by creation date (newest first) by default.
- **FR-002**: Users MUST be able to reorder recipes via drag-and-drop on the list page, and
  the custom order MUST persist across sessions.
- **FR-003**: The recipe list MUST support filtering by food category (at minimum: dinner,
  pastry, aperitif, dessert, breakfast, snack).
- **FR-004**: The recipe list MUST support filtering by primary protein source (at minimum:
  chicken, beef, pork, fish/seafood, vegetarian, vegan).
- **FR-005**: Each recipe card MUST display a thumbnail image, the recipe title, and the
  preparation time.
- **FR-006**: Clicking a recipe card MUST navigate to the recipe detail page.
- **FR-007**: The recipe detail page MUST display ingredients in a left panel and step-by-step
  instructions in a right panel (stacked vertically on narrow viewports per constitution).
- **FR-008**: The recipe detail page MUST provide a portion-size control; changing the value
  MUST proportionally scale all ingredient quantities and any inline quantity references in
  the instructions without a page reload.
- **FR-009**: Each recipe MUST store a default portion size of either 2 or 4, set at creation
  or generation time.
- **FR-010**: The recipe detail page MUST include a "keep screen on" toggle that prevents the
  device from sleeping while the page is active.
- **FR-011**: The app MUST include a meal planner page accessible via persistent top-level
  navigation from every page.
- **FR-012**: The meal planner MUST display a 7-day week view with one dinner slot per day.
- **FR-013**: Users MUST be able to select one or more cuisines from at least: Indian, Thai,
  South American, Scandinavian, Italian, Mediterranean.
- **FR-014**: Triggering meal generation MUST populate all non-skipped days with AI-suggested
  dinner titles based on the selected cuisines.
- **FR-015**: For each day in the meal planner, users MUST be able to regenerate that single
  meal independently without affecting other days.
- **FR-016**: For each day in the meal planner, users MUST be able to swap it with any other
  day's meal.
- **FR-017**: For each day in the meal planner, users MUST be able to skip that day (mark it
  as empty for that week).
- **FR-018**: For each meal title in the planner, users MUST be able to trigger full recipe
  generation, producing a complete recipe viewable in the recipe detail view.
- **FR-019**: Users MUST be able to save a planner-generated recipe to the recipe list from
  the recipe detail view.
- **FR-020**: The app MUST include a footer on all pages containing links to GitHub and
  LinkedIn.
- **FR-021**: Navigation between the recipe list and meal planner MUST be available on every
  page without requiring the user to navigate back first.
- **FR-022**: Users MUST be able to create recipes manually via an in-app form providing:
  title, food category, primary protein source, default portion size, preparation time,
  thumbnail image (uploaded by user), ingredient groups (name, quantity, unit), and
  step-by-step instruction groups.
- **FR-023**: The entire app UI MUST be presented in Norwegian (Bokmål). All labels,
  buttons, empty states, error messages, and generated content MUST use Norwegian.

### Key Entities

- **Recipe**: Title, description, thumbnail image filename, food category, primary protein
  source, default portions (2 or 4), preparation time (display string, e.g. "30 min"),
  ingredient groups (named sections each containing ingredients), instruction groups (named
  sections each containing steps), creation date, custom sort order,
  source (manual | ai-generated).
  *Note*: The pre-seeded dataset (`src/recipe-data/recipes.json`, 38 recipes) currently
  lacks `category` and `proteinSource` fields — these MUST be added to the data schema and
  back-filled for pre-existing recipes.
- **IngredientGroup**: Group name (e.g. "Saus", "Wok"), ordered list of Ingredients.
- **Ingredient**: Unique id, display name, base quantity (number), unit (string). The id is
  used as a `{placeholder}` token in instruction text to enable inline quantity scaling.
- **InstructionGroup**: Group name matching an IngredientGroup, ordered list of step strings.
  Steps may contain `{ingredient-id}` tokens that render with scaled quantities.
- **Meal Plan**: Week start date, array of 7 DaySlots.
- **DaySlot**: Weekday label, status (empty | suggested | skipped), meal title (or null),
  linked Recipe id (optional).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can browse, filter, and open a recipe within 3 taps/clicks from the
  landing page.
- **SC-002**: Drag-and-drop reordering works correctly on both desktop pointer and mobile
  touch without triggering accidental navigation or scroll interference.
- **SC-003**: Changing the portion size updates all displayed quantities within 200 ms with
  no page reload.
- **SC-004**: A full week of meal title suggestions is generated and displayed within 10
  seconds on a standard mobile network connection.
- **SC-005**: The "keep screen on" feature prevents device sleep for at least 10 minutes of
  continuous use on iOS Safari and Android Chrome.
- **SC-006**: The recipe detail page is fully readable and operable on a 375 px wide viewport
  without horizontal scrolling.
- **SC-007**: All filter combinations on the recipe list return accurate results (no false
  positives, no missed matches).

## Assumptions

- Recipe data is stored in a Supabase (PostgreSQL) backend. No user accounts or
  multi-user sync are required at this stage — the database serves a single user/owner.
- 38 pre-seeded recipes are provided in `src/recipe-data/recipes.json` with corresponding
  thumbnail images in `src/recipe-data/recipes-img/` (named `{id}.png`). These MUST be
  migrated to Supabase on first deploy. Their JSON schema will need `category` and
  `proteinSource` fields added and back-filled. Thumbnail images will be uploaded to
  Supabase Storage.
- Meal title generation and full recipe generation rely on an external AI service; the
  specific provider is a technical decision for the planning phase.
- Thumbnail images for AI-generated recipes may use a placeholder or AI-generated image;
  the specific approach is a technical decision.
- The footer GitHub and LinkedIn links point to the developer's own profiles; specific URLs
  will be provided during implementation.
- The app is a single-page application navigable between the two main pages without full
  browser reloads.
- All user-facing text, AI-generated content, and UI labels MUST be in Norwegian (Bokmål).
