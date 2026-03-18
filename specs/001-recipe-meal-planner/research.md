# Research: Recipe Manager & Meal Planner

**Branch**: `001-recipe-meal-planner` | **Phase**: 0 | **Date**: 2026-03-18

## Decision Log

---

### 1. Drag-and-Drop Library

**Decision**: `@dnd-kit/core` + `@dnd-kit/sortable`

**Rationale**:
- Combined bundle: ~27 KB gzipped — well within the 50 KB constitution limit
- Uses the Pointer Events API, which unifies mouse and touch natively; no separate
  mobile handling required
- Full keyboard navigation and ARIA support out of the box
- Works in Next.js App Router with `'use client'` directive; no special configuration

**Alternatives considered**:
- `@hello-pangea/dnd` (maintained react-beautiful-dnd fork): ~45 KB gzipped, worse touch
  support, less accessible — rejected on bundle size and mobile-first grounds

---

### 2. Wake Lock API — iOS Safari Limitation

**Decision**: Use the Web Screen Wake Lock API with graceful degradation on unsupported
browsers. Display an informative toggle state rather than hiding the feature.

**Browser support**:
- Android Chrome (84+): ✅ Supported
- Desktop Chrome (84+): ✅ Supported
- Desktop Firefox (100+): ✅ Supported
- iOS Safari: ❌ Not supported
- Desktop Safari: ❌ Not supported

**Implementation pattern**:
- Custom `useWakeLock` hook in `src/hooks/useWakeLock.ts`
- SSR-safe: wake lock request only runs inside `useEffect` (never on server)
- Re-requests lock on `visibilitychange` event (browser releases lock when tab is hidden)
- Hook exposes `isSupported` flag — WakeLockToggle component shows
  "Ikke støttet på denne enheten" on iOS Safari rather than silently failing

**Rationale for not adding an iOS workaround (e.g. silent audio)**:
- Hacky approaches (silent audio playback) violate the Simplicity & Minimalism principle
- The feature degrades gracefully with a clear user message, satisfying the constitution's
  "error states MUST be actionable" requirement
- Capacitor native plugins would require a separate release track; out of scope for web-first v1

---

### 3. Supabase Client Setup

**Decision**: `@supabase/supabase-js` + `@supabase/ssr`

**Configuration**:
- `lib/supabase/server.ts` — `createClient` with `SUPABASE_SERVICE_ROLE_KEY`; used in
  all Route Handlers. Bypasses RLS.
- `lib/supabase/client.ts` — `createBrowserClient` from `@supabase/ssr` with
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`; used for client-side reads only.
- Since all write operations go through server-side Route Handlers with the service role
  key, **Row Level Security (RLS) is not required** for this single-user app.

**Bundle size**: ~45–55 KB gzipped combined (at constitution limit — justified in
Complexity Tracking in plan.md).

**Image upload**: multipart `FormData` → Route Handler → `supabaseServer.storage.upload()`
→ `getPublicUrl()`. Public bucket means image URLs are directly embeddable in `<img>` tags.

**Rationale**: Official Supabase libraries for Next.js App Router. No lighter alternative
exists for the full feature set (DB queries, storage, real-time if needed later).

---

### 4. Claude AI Model Selection

**Decision**:
- Meal title generation (7 titles per request): `claude-haiku-4-5-20251001`
- Full recipe generation (complete ingredient + instruction set): `claude-sonnet-4-6`

**Rationale**:
- Haiku is fast and cheap for simple structured generation (list of 7 meal names).
  At personal use volumes, cost is negligible.
- Sonnet produces more coherent, detailed recipes in Norwegian with better adherence
  to the `{ingredient_key}` token format required for portion scaling.
- Both called server-side only via Route Handlers; `ANTHROPIC_API_KEY` is never
  exposed to the client bundle.

**Prompt strategy**:
- Meal titles: structured JSON response with 7 Norwegian dinner names matching selected
  cuisines; one title per day.
- Recipe generation: structured JSON response matching the internal Recipe schema
  (ingredient groups with `ingredient_key` + `amount` + `unit`, instruction steps with
  `{token}` references). All text in Norwegian (Bokmål).

---

### 5. Data Seeding Strategy for 38 Existing Recipes

**Decision**: One-time seed via a `/api/seed` Route Handler (disabled in production via
`NODE_ENV` guard). The handler reads `src/recipe-data/recipes.json`, back-fills
`category` and `protein_source` fields (mapped manually per recipe), uploads images to
Supabase Storage, and inserts all relational rows in a single transaction.

**category / protein_source back-fill mapping** (to be completed during T001 in tasks):
The 38 existing recipes span dinner, soup, and baked goods categories. A full mapping
table will be produced as part of the seeding task.

**Rationale**: A code-driven seed script is preferable to a manual SQL dump — it is
repeatable, testable, and doesn't require manual Supabase UI work.

---

### 6. State Management

**Decision**: React built-in state only (`useState`, `useReducer`, `useContext`).
No external state management library.

**Rationale**:
- App has two independent pages (recipe list, meal planner); no global shared state
  beyond the current meal plan.
- Server state (recipe list, plan data) fetched via `fetch` in Server Components or
  Route Handlers; no need for React Query or SWR at this scale.
- Satisfies the Simplicity & Minimalism principle.

---

### 7. Styling

**Decision**: Tailwind CSS (bundled with Next.js via `create-next-app`).

**Rationale**:
- No additional install step; included in the standard `create-next-app --typescript` setup.
- Zero-runtime CSS-in-JS; optimal for bundle size.
- Responsive utilities (`sm:`, `md:`, `lg:`) enforce mobile-first layout naturally.
- No UI component library (e.g. shadcn, MUI) — components are hand-built to satisfy
  the Simplicity & Minimalism principle.
