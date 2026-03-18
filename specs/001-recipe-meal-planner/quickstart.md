# Quickstart: Recipe Manager & Meal Planner

**Branch**: `001-recipe-meal-planner` | **Phase**: 1 | **Date**: 2026-03-18

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account (free tier is sufficient)
- An [Anthropic](https://console.anthropic.com) API key

---

## 1. Bootstrap the Next.js App

```bash
npx create-next-app@latest middah --typescript --tailwind --app --src-dir --import-alias "@/*"
cd middah
```

---

## 2. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr @dnd-kit/core @dnd-kit/sortable @anthropic-ai/sdk
```

| Package | Purpose | Size (gzip) |
|---------|---------|-------------|
| `@supabase/supabase-js` | Database + Storage client | ~45 KB |
| `@supabase/ssr` | Next.js App Router Supabase helpers | ~4 KB |
| `@dnd-kit/core` | Drag-and-drop core | ~17 KB |
| `@dnd-kit/sortable` | Sortable preset for dnd-kit | ~10 KB |
| `@anthropic-ai/sdk` | Claude API (server-side only) | 0 KB client |

---

## 3. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note: **Project URL**, **anon key**, **service role key** (Settings → API)
3. Go to **Storage** → Create bucket `recipe-images` → set to **Public**

---

## 4. Configure Environment Variables

**`.env.local`** (never commit this file):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-only
ANTHROPIC_API_KEY=sk-ant-...       # server-only
```

---

## 5. Run Database Migrations

In the Supabase dashboard → **SQL Editor**, run the following in order:

```sql
-- 1. recipes
CREATE TABLE recipes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  description   TEXT,
  servings      INTEGER     NOT NULL DEFAULT 2,
  prep_time     TEXT        NOT NULL,
  category      TEXT        NOT NULL,
  protein_source TEXT       NOT NULL,
  image_path    TEXT,
  source        TEXT        NOT NULL DEFAULT 'manual'
                            CHECK (source IN ('manual', 'ai-generated')),
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recipes_category        ON recipes (category);
CREATE INDEX idx_recipes_protein_source  ON recipes (protein_source);
CREATE INDEX idx_recipes_sort_order      ON recipes (sort_order);

-- 2. ingredient_groups
CREATE TABLE ingredient_groups (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  display_order INTEGER NOT NULL
);
CREATE INDEX idx_ingredient_groups_recipe ON ingredient_groups (recipe_id);

-- 3. ingredients
CREATE TABLE ingredients (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID    NOT NULL REFERENCES ingredient_groups(id) ON DELETE CASCADE,
  ingredient_key TEXT    NOT NULL,
  display_name   TEXT    NOT NULL,
  amount         NUMERIC NOT NULL,
  unit           TEXT    NOT NULL,
  display_order  INTEGER NOT NULL
);
CREATE INDEX idx_ingredients_group ON ingredients (group_id);

-- 4. instruction_groups
CREATE TABLE instruction_groups (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  display_order INTEGER NOT NULL
);
CREATE INDEX idx_instruction_groups_recipe ON instruction_groups (recipe_id);

-- 5. instruction_steps
CREATE TABLE instruction_steps (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID    NOT NULL REFERENCES instruction_groups(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  text       TEXT    NOT NULL
);
CREATE INDEX idx_instruction_steps_group ON instruction_steps (group_id);

-- 6. meal_plans
CREATE TABLE meal_plans (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE  NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. meal_plan_days
CREATE TABLE meal_plan_days (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id    UUID    NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  weekday    INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  status     TEXT    NOT NULL DEFAULT 'empty'
                     CHECK (status IN ('empty', 'suggested', 'skipped')),
  meal_title TEXT,
  recipe_id  UUID    REFERENCES recipes(id) ON DELETE SET NULL,
  UNIQUE (plan_id, weekday)
);
CREATE INDEX idx_meal_plan_days_plan ON meal_plan_days (plan_id);
```

---

## 6. Seed Pre-Existing Recipes

Copy the seed data into the project:
```bash
cp -r /path/to/src/recipe-data src/recipe-data
```

Start the dev server and run the seed endpoint once:
```bash
npm run dev
curl -X POST http://localhost:3000/api/seed
# → {"seeded": 38}
```

The seed endpoint (`src/app/api/seed/route.ts`) will:
1. Read `src/recipe-data/recipes.json`
2. Back-fill `category` and `protein_source` from the mapping in `src/lib/seed.ts`
3. Upload each `recipes-img/{id}.png` to Supabase Storage
4. Insert all relational rows

The seed endpoint is disabled in production (`NODE_ENV === 'production'` returns 403).

---

## 7. Development Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
npm run typecheck # tsc --noEmit
```

---

## 8. Project Structure

```
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
│       │   ├── route.ts                   # GET list, POST create
│       │   ├── reorder/route.ts           # PATCH bulk sort_order
│       │   └── [id]/
│       │       ├── route.ts               # GET, PUT, DELETE
│       │       └── image/route.ts         # POST upload image
│       ├── meal-plans/
│       │   ├── current/route.ts           # GET or create current week
│       │   ├── generate/route.ts          # POST generate titles
│       │   └── [planId]/days/[dayId]/
│       │       ├── route.ts               # PATCH skip/swap
│       │       └── generate-recipe/route.ts  # POST generate full recipe
│       └── seed/route.ts                  # POST seed dev data (dev only)
├── components/
│   ├── recipe/
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeGrid.tsx                 # dnd-kit sortable wrapper
│   │   ├── RecipeFilters.tsx
│   │   ├── RecipeDetail.tsx
│   │   ├── PortionControl.tsx
│   │   ├── WakeLockToggle.tsx
│   │   └── RecipeForm.tsx                 # create/edit form
│   ├── meal-planner/
│   │   ├── WeekView.tsx
│   │   ├── DaySlot.tsx
│   │   └── CuisineSelector.tsx
│   └── ui/
│       ├── NavBar.tsx
│       ├── Footer.tsx
│       └── EmptyState.tsx
├── hooks/
│   └── useWakeLock.ts                     # Web Screen Wake Lock API hook
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # Browser client (anon key)
│   │   └── server.ts                      # Server client (service role key)
│   ├── ai/
│   │   └── claude.ts                      # Claude API wrapper (Haiku + Sonnet)
│   ├── scaling.ts                         # Portion scaling + {token} replacement
│   └── seed.ts                            # Seed mapping + import logic
├── types/
│   └── index.ts                           # Shared TypeScript types
└── recipe-data/                           # Pre-existing seed data
    ├── recipes.json
    └── recipes-img/
```

---

## 9. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

In the Vercel dashboard → Project Settings → Environment Variables, add:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
```

The `api/seed` endpoint will return `403` in production automatically.

---

## 10. Key Implementation Notes

### Supabase clients

```typescript
// src/lib/supabase/server.ts  — Route Handlers only
import { createClient } from '@supabase/supabase-js'
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// src/lib/supabase/client.ts  — Client Components only
import { createBrowserClient } from '@supabase/ssr'
export const supabaseBrowser = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### Portion scaling

```typescript
// src/lib/scaling.ts
export function scaleAmount(base: number, defaultServings: number, currentServings: number) {
  return (base * currentServings) / defaultServings
}

export function resolveTokens(
  text: string,
  ingredients: Ingredient[],
  defaultServings: number,
  currentServings: number
): string {
  return text.replace(/\{(\w+)\}/g, (_, key) => {
    const ing = ingredients.find(i => i.ingredientKey === key)
    if (!ing) return `{${key}}`
    const scaled = scaleAmount(ing.amount, defaultServings, currentServings)
    return `${scaled % 1 === 0 ? scaled : scaled.toFixed(1)} ${ing.unit} ${ing.displayName}`
  })
}
```

### Wake Lock (iOS Safari note)

The `useWakeLock` hook returns `isSupported: false` on iOS Safari and Desktop Safari.
The `WakeLockToggle` component must render a disabled state with the Norwegian message:
`"Holde skjermen på støttes ikke på denne enheten"` rather than hiding the toggle.
