# Research: UI & Filter Improvements

**Branch**: `002-ui-filter-improvements` | **Date**: 2026-03-26

---

## Decision 1: Frontend-only Filtering Architecture

**Decision**: Move recipe filtering entirely to the client. The home page will fetch all recipes once (server-side, no filter params applied to the query). A new client component (`RecipeList`) will hold the full recipe array in state and apply category/protein filters via `useMemo` — no further network requests when filters change.

**Rationale**: The current architecture fetches from Supabase with server-side filter params on every URL change (Next.js RSC page re-render on navigation). This causes a full server round-trip per filter interaction. Moving to client-side filtering eliminates latency entirely after initial load. The recipe dataset is small (expected tens to low hundreds), making full-dataset client filtering practical.

**Alternatives considered**:
- Keep server filtering but add optimistic UI — rejected because it still requires a round-trip and adds complexity.
- SWR/React Query with client-side cache — rejected as overkill; simple `useMemo` on the already-loaded array is sufficient.

---

## Decision 2: Dynamic Filter Options (Hide Empty Categories)

**Decision**: Derive available filter options from the loaded recipe dataset at render time. Before rendering a `<select>` option for a category or protein, check if at least one recipe in the full (unfiltered) array has that value. Options with zero matches are excluded from the dropdown.

**Rationale**: This is a natural extension of Decision 1. Once all recipes are client-side, a single `useMemo` can compute the set of present categories and proteins. No extra API calls or backend changes required.

**Alternatives considered**:
- Separate API call to fetch distinct values — rejected because it's an extra round-trip when the data is already available.
- Always show all options with a "(0)" count — rejected because the spec requires hiding them, not counting them.

---

## Decision 3: Delete Recipe UI

**Decision**: Add a "Slett oppskrift" (delete recipe) button to `RecipeDetail.tsx` visible in non-preview mode. On click, show a native `window.confirm()` dialog for confirmation. On confirm, call the existing `DELETE /api/recipes/[id]` endpoint, then redirect to `/` using `router.push('/')`.

**Rationale**: The `DELETE /api/recipes/[id]` API route already exists and handles image cleanup from Supabase Storage before deleting the DB row. No backend changes needed — only UI work. A `window.confirm()` dialog is the simplest confirmation mechanism that requires no new components and meets the spec requirement of an explicit confirmation step.

**Alternatives considered**:
- Custom modal dialog — rejected as more complex than needed for a single action; native confirm is sufficient.
- Separate delete page — rejected; inline action from the detail page is the expected UX pattern.

---

## Decision 4: Hide Meal Planner Navigation

**Decision**: Remove the `/meal-planner` `<Link>` from `NavBar.tsx`. The page remains accessible at its URL. No redirects, guards, or access control changes.

**Rationale**: The requirement is purely visual — remove discoverability from the nav while preserving functionality. A one-line removal is the most minimal change with zero side effects.

**Alternatives considered**:
- Feature flag / env variable — rejected; adds complexity with no benefit since this is a permanent UX decision, not a temporary toggle.
- Route protection — rejected; the spec explicitly says the page should remain accessible via direct URL.

---

## Decision 5: Button Text Alignment

**Decision**: Add `flex items-center justify-center` to button elements that lack proper centering. The global CSS already enforces `min-height: 44px` on all buttons, but does not ensure flex centering. A global rule in `globals.css` will be added to enforce `display: flex; align-items: center; justify-content: center` on all `<button>` elements, complementing the existing `min-height` rule.

**Rationale**: A global CSS rule is the most minimal change — fixes all buttons in one place without touching individual component files. Tailwind utility classes on individual buttons could achieve the same but would require changes across many files.

**Alternatives considered**:
- Per-component fixes — rejected; too many files to touch and fragile (new buttons may not include the classes).
- CSS-in-JS or component wrapper — rejected; unnecessary abstraction.

---

## Decision 6: Style Aligned with middah.no

**Decision**: Update the app's visual style to match middah.no's minimal aesthetic. The primary change is adopting the **Geist** font family (the same font used on middah.no) via `next/font/google` (Geist is available on Google Fonts). Additionally, the color palette is already very close (white background, near-black text, black accent buttons). Minor refinements: use pure black (`#000`) for button backgrounds and the nav logo to sharpen the brand contrast, consistent with middah.no's high-contrast approach.

**Rationale**: Geist is the defining typographic element of middah.no's identity. Switching fonts is a targeted change with significant visual impact and minimal implementation complexity. The existing gray-900 palette already approximates the aesthetic — a small color calibration completes the alignment without a full redesign.

**Alternatives considered**:
- Full redesign with new layout — rejected; the spec asks to "resemble" middah.no, not to replicate it exactly. Typography and color are the highest-impact levers.
- Local Geist font files — rejected; `next/font/google` handles this cleanly with automatic optimization and no manual file management.

**Constitution notes**:
- Geist font via `next/font/google` adds no extra bundle weight (font is loaded via `<link>` with the Next.js font system, not bundled into JS).
- All existing `min-height: 44px` touch targets are preserved.
