# Tasks: Fork and Knife Favicon

**Input**: Design documents from `/specs/003-fork-knife-favicon/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 = Branded Browser Tab Icon)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No project initialization required — this is an addition to an existing Next.js 15 App Router project.

- [x] T001 Confirm `src/app/` directory exists and contains `layout.tsx` (verify file-based icon convention is available)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No blocking prerequisites — no schema changes, no new dependencies, no configuration changes required. The Next.js App Router file-based favicon convention works out of the box.

**Checkpoint**: Phase 1 complete → User Story 1 can begin immediately

---

## Phase 3: User Story 1 - Branded Browser Tab Icon (Priority: P1) 🎯 MVP

**Goal**: A fork-and-knife icon appears in the browser tab, bookmarks, and mobile home-screen shortcut for all pages of the Middah app.

**Independent Test**: Run `npm run dev`, open `http://localhost:3000` in Chrome — the fork-and-knife icon must appear in the browser tab.

### Implementation for User Story 1

- [x] T002 [US1] Create fork-and-knife SVG icon at `src/app/icon.svg` with the following design:
  - Viewbox: `0 0 100 100`
  - A filled circle background in warm terracotta/amber color (e.g. `#C8773C` or similar warm food tone matching the app's palette in `src/app/globals.css`)
  - A white fork path on the left (three tines, straight handle) and white knife path on the right (single blade with spine), both centered vertically within the circle
  - Paths must be legible at 16×16px (keep geometry simple — no serifs, no decorative details)
  - SVG must have `xmlns="http://www.w3.org/2000/svg"` and no external dependencies

- [x] T003 [P] [US1] Create iOS home-screen icon at `src/app/apple-icon.png`:
  - Dimensions: 180×180 pixels
  - Rasterize from the SVG created in T002 (use any available tool: browser DevTools screenshot at 180px, Inkscape, ImageMagick, or the `sharp` CLI if available)
  - Format: PNG (no transparency required for Apple touch icon — solid background preferred)
  - Do NOT add the `sharp` package as a runtime dependency; use a one-off CLI tool or browser-based method

**Checkpoint**: Both files in place — run `npm run dev` and verify browser tab icon appears

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Cross-browser verification and cleanup

- [ ] T004 Verify favicon renders correctly across browsers per `specs/003-fork-knife-favicon/quickstart.md`:
  - Chrome desktop: icon visible in tab and bookmarks bar
  - Firefox desktop: icon visible in tab
  - Safari desktop: icon visible in tab
  - (Optional) iOS Safari: Add to Home Screen shows correct icon
- [x] T005 [P] Confirm no regressions in `layout.tsx` metadata — `next build` must complete without warnings related to icons

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: N/A — no blocking prerequisites
- **User Story 1 (Phase 3)**: Starts after T001 — T002 and T003 can run in parallel (different files)
- **Polish (Phase 4)**: Requires T002 and T003 complete

### User Story Dependencies

- **User Story 1 (P1)**: The entire feature — no other stories

### Within User Story 1

- T002 (`icon.svg`) and T003 (`apple-icon.png`) are independent files → run in parallel
- T004 and T005 verification tasks depend on both T002 and T003

### Parallel Opportunities

- T002 and T003 can be completed in parallel (different output files)
- T004 and T005 can be completed in parallel (read-only verification)

---

## Parallel Example: User Story 1

```bash
# Both icon files can be created simultaneously:
Task A: "Create src/app/icon.svg with fork-and-knife SVG design"
Task B: "Create src/app/apple-icon.png at 180×180px from SVG"

# Then verify in parallel:
Task C: "Cross-browser favicon verification per quickstart.md"
Task D: "Run next build and confirm no icon-related warnings"
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete T001: confirm directory
2. Complete T002: create `icon.svg`
3. Complete T003: create `apple-icon.png`
4. **VALIDATE**: Open app in browser — fork-and-knife icon must appear in tab
5. Complete T004 + T005: polish verification

### Incremental Delivery

This feature is a single atomic increment — there is only one user story. The MVP is the complete feature.

---

## Notes

- [P] tasks = different files, no shared state dependencies
- [US1] label maps all tasks to User Story 1 (Branded Browser Tab Icon)
- Next.js App Router file-based convention: no code changes to `layout.tsx` are needed
- `icon.svg` in `src/app/` is automatically picked up by Next.js — no manual `<link>` tags
- `apple-icon.png` in `src/app/` is automatically used for Apple touch icon metadata
- Total new files: 2 (`src/app/icon.svg`, `src/app/apple-icon.png`)
- Zero new npm dependencies
