# Feature Specification: UI & Filter Improvements

**Feature Branch**: `002-ui-filter-improvements`
**Created**: 2026-03-26
**Status**: Draft
**Input**: User description: "Style resembling middah.no, hide meal planner nav, delete recipe, center button text, hide empty filter categories, frontend filtering"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Frontend Recipe Filtering (Priority: P1)

A user browsing recipes wants to filter by category or protein source. Currently, filtering triggers a backend request which is slow. Filtering should happen instantly using data already loaded in the browser, so results appear without any noticeable delay.

**Why this priority**: Filtering is a core discovery feature used on every visit. Slow filtering degrades the entire browse experience. This is the highest-impact change and a pure performance improvement.

**Independent Test**: Can be tested by loading the recipe list, applying a category filter, and verifying results appear instantly without a network request.

**Acceptance Scenarios**:

1. **Given** the recipe list is loaded, **When** a user selects a filter category, **Then** results update immediately without a network request
2. **Given** a filter is active, **When** the user clears the filter, **Then** all recipes are shown again instantly
3. **Given** all recipes are loaded, **When** multiple filters are combined, **Then** only recipes matching all selected filters are shown

---

### User Story 2 - Hide Empty Filter Options (Priority: P1)

A user opening the category or protein source filter dropdowns should only see options that have at least one matching recipe. Empty options clutter the UI and confuse users into selecting filters that produce zero results.

**Why this priority**: Tied with frontend filtering — this relies on all recipe data being available client-side, and together they eliminate the "no results" dead-end UX.

**Independent Test**: Can be tested by verifying that no filter option appears when zero recipes match that option.

**Acceptance Scenarios**:

1. **Given** a category has no recipes, **When** the filter dropdown is opened, **Then** that category is not listed as an option
2. **Given** a protein source has no recipes, **When** the protein source filter is opened, **Then** that source is not shown
3. **Given** all categories have at least one recipe, **When** the filter dropdown is opened, **Then** all categories appear

---

### User Story 3 - Delete Recipe (Priority: P2)

A user who has added a recipe wants to be able to delete it. The delete action should be accessible from within the recipe detail page and require a confirmation step to prevent accidental deletion.

**Why this priority**: Necessary for content management. Without deletion, incorrect or outdated recipes accumulate permanently.

**Independent Test**: Can be tested by navigating to a recipe page, deleting it, and confirming it no longer appears in the recipe list.

**Acceptance Scenarios**:

1. **Given** a user is on a recipe detail page, **When** they click delete, **Then** a confirmation prompt is shown
2. **Given** a confirmation prompt is shown, **When** the user confirms, **Then** the recipe is removed and the user is redirected to the recipe list
3. **Given** a confirmation prompt is shown, **When** the user cancels, **Then** no changes are made and the recipe remains

---

### User Story 4 - Hide Meal Planner Navigation (Priority: P2)

The meal planner is a secondary feature not meant for general discovery. Its navigation link should be removed from the main navigation, making it accessible only via direct URL.

**Why this priority**: Simplifies the main navigation and scopes the app's visible feature surface. Meal planner remains functional for users who know the link.

**Independent Test**: Can be tested by confirming the meal planner link is absent from navigation while the meal planner page still loads when its URL is visited directly.

**Acceptance Scenarios**:

1. **Given** the app navigation is visible, **When** a user views the nav items, **Then** no meal planner link is shown
2. **Given** the meal planner nav link is removed, **When** a user visits the meal planner URL directly, **Then** the page loads normally

---

### User Story 5 - Button Text Alignment (Priority: P3)

Button labels throughout the app should be visually centered — both horizontally and vertically — within their button boundaries. Currently some buttons have text positioned closer to one edge.

**Why this priority**: Visual polish. Important for quality but does not affect functionality.

**Independent Test**: Can be tested by visually inspecting all buttons across pages for centered label alignment.

**Acceptance Scenarios**:

1. **Given** any button in the app, **When** it is rendered, **Then** its label text is centered both horizontally and vertically within the button bounds
2. **Given** buttons of varying widths, **When** rendered, **Then** all text remains properly centered regardless of button size

---

### User Story 6 - Style Aligned with middah.no (Priority: P3)

The app's visual design should be updated to resemble the style of the middah.no website — including typography, color palette, spacing, and overall aesthetic. This gives the app a cohesive brand identity consistent with the Middah brand.

**Why this priority**: Brand consistency is valuable but not functionally blocking. Placed last as it is the broadest and most subjective change.

**Independent Test**: Can be tested by comparing the app side-by-side with middah.no and confirming the visual language (colors, fonts, spacing) is consistent.

**Typography**: Lora Variable (main — headings), Varela Round (secondary — body/UI)

**Acceptance Scenarios**:

1. **Given** the app is open, **When** compared with middah.no, **Then** the primary color palette matches
2. **Given** the app is open, **When** compared with middah.no, **Then** typography (font family, weights, sizes) is consistent
3. **Given** the app is open, **When** compared with middah.no, **Then** overall layout spacing and visual tone match the reference site

---

### Edge Cases

- What happens when all recipes are deleted — does the empty state display correctly with no filter options shown?
- What if a recipe is part of a meal plan and gets deleted — does the meal plan entry get cleaned up or left as an orphan?
- What if new recipes are added server-side while the user is browsing — does a page reload refresh the client-side data?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Filtering by category and protein source MUST occur client-side using already-loaded recipe data, without triggering new network requests
- **FR-002**: Filter option lists MUST only show categories and protein sources that have at least one matching recipe in the current dataset
- **FR-003**: Users MUST be able to delete a recipe from within the recipe detail page
- **FR-004**: Deletion MUST require explicit user confirmation before the recipe is removed
- **FR-005**: After successful deletion, the user MUST be redirected to the recipe list
- **FR-006**: The meal planner navigation link MUST be removed from the main navigation bar
- **FR-007**: The meal planner page MUST remain accessible via direct URL after its nav link is removed
- **FR-008**: All button labels throughout the app MUST be visually centered both horizontally and vertically within the button
- **FR-009**: The app's color palette, typography, and spacing MUST be updated to align with the visual style of the middah.no reference site

### Key Entities

- **Recipe**: A content item with category, protein source, title, and other attributes; must support deletion
- **Filter Option**: A derived value (category or protein source) that only appears as a selectable option when at least one recipe matches it

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Applying a recipe filter produces visible results in under 100ms (no network round-trip)
- **SC-002**: No filter option is displayed when zero recipes match that option
- **SC-003**: A recipe can be deleted in 2 interactions or fewer (click delete → confirm)
- **SC-004**: The meal planner navigation link is absent from the nav bar on all pages
- **SC-005**: All buttons across all pages display centered text with no visible edge misalignment
- **SC-006**: The app's visual design is recognizably consistent with middah.no when compared side-by-side

## Assumptions

- The full recipe dataset is loaded into the frontend on page load or first visit, making client-side filtering feasible without performance concerns
- Recipe deletion is available to any user with access to the recipe page (no role-based access control required at this stage)
- The middah.no website is publicly accessible and can be used as a visual reference for style matching
- Meal plan entries referencing a deleted recipe are acceptable to leave as orphaned references for now; data cleanup is out of scope
- Button alignment issues are CSS-level fixes, not structural component changes
