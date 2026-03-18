# Data Model: Recipe Manager & Meal Planner

**Branch**: `001-recipe-meal-planner` | **Phase**: 1 | **Date**: 2026-03-18

## Storage

- **Database**: Supabase PostgreSQL
- **File storage**: Supabase Storage — public bucket named `recipe-images`
- **Local seed data**: `src/recipe-data/recipes.json` + `src/recipe-data/recipes-img/`

---

## Database Schema

### `recipes`

Core recipe metadata. One row per recipe.

```sql
CREATE TABLE recipes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  description   TEXT,
  servings      INTEGER     NOT NULL DEFAULT 2,
  prep_time     TEXT        NOT NULL,  -- display string, e.g. "30 min", "Under 30 min"
  category      TEXT        NOT NULL,  -- see Category enum below
  protein_source TEXT       NOT NULL,  -- see ProteinSource enum below
  image_path    TEXT,                  -- storage path, e.g. "recipes/uuid.png"
  source        TEXT        NOT NULL DEFAULT 'manual'
                            CHECK (source IN ('manual', 'ai-generated')),
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipes_category       ON recipes (category);
CREATE INDEX idx_recipes_protein_source ON recipes (protein_source);
CREATE INDEX idx_recipes_sort_order     ON recipes (sort_order);
```

### `ingredient_groups`

Named sections within a recipe's ingredient list (e.g. "Saus", "Wok").

```sql
CREATE TABLE ingredient_groups (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE INDEX idx_ingredient_groups_recipe ON ingredient_groups (recipe_id);
```

### `ingredients`

Individual ingredients within a group. `ingredient_key` is the token identifier used
in instruction step text for portion scaling (e.g. `"kyllingfilet"` → `{kyllingfilet}`).

```sql
CREATE TABLE ingredients (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID    NOT NULL REFERENCES ingredient_groups(id) ON DELETE CASCADE,
  ingredient_key TEXT    NOT NULL,  -- unique within a recipe; matches {token} in steps
  display_name   TEXT    NOT NULL,
  amount         NUMERIC NOT NULL,
  unit           TEXT    NOT NULL,
  display_order  INTEGER NOT NULL
);

CREATE INDEX idx_ingredients_group ON ingredients (group_id);
```

### `instruction_groups`

Named sections within a recipe's instruction list (mirrors ingredient_groups naming).

```sql
CREATE TABLE instruction_groups (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     UUID    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE INDEX idx_instruction_groups_recipe ON instruction_groups (recipe_id);
```

### `instruction_steps`

Ordered steps within an instruction group. Steps may contain `{ingredient_key}` tokens
that are resolved at render time to display scaled quantities.

```sql
CREATE TABLE instruction_steps (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID    NOT NULL REFERENCES instruction_groups(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  text       TEXT    NOT NULL  -- may contain {ingredient_key} tokens
);

CREATE INDEX idx_instruction_steps_group ON instruction_steps (group_id);
```

### `meal_plans`

One row per week. `week_start` is always the Monday of that week (ISO date).

```sql
CREATE TABLE meal_plans (
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start  DATE  NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `meal_plan_days`

One row per day per meal plan (7 rows per plan). `weekday` 0 = Monday, 6 = Sunday.

```sql
CREATE TABLE meal_plan_days (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID    NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  weekday     INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  status      TEXT    NOT NULL DEFAULT 'empty'
                      CHECK (status IN ('empty', 'suggested', 'skipped')),
  meal_title  TEXT,
  recipe_id   UUID    REFERENCES recipes(id) ON DELETE SET NULL,
  UNIQUE (plan_id, weekday)
);

CREATE INDEX idx_meal_plan_days_plan ON meal_plan_days (plan_id);
```

---

## Enumerations

These are enforced by `CHECK` constraints and validated in application code.

### Category

```
middag       -- Dinner
forrett      -- Starter / Aperitif
dessert      -- Dessert
frokost      -- Breakfast
lunsj        -- Lunch
bakst        -- Pastry / Baked goods
snacks       -- Snack
suppe        -- Soup
```

### ProteinSource

```
kylling      -- Chicken
storfe       -- Beef
svin         -- Pork
fisk         -- Fish / Seafood
vegetar      -- Vegetarian
vegan        -- Vegan
lam          -- Lamb
annet        -- Other
```

---

## TypeScript Types

Canonical types shared across frontend and API layer (`src/types/index.ts`).

```typescript
export type RecipeSource = 'manual' | 'ai-generated'
export type DayStatus   = 'empty' | 'suggested' | 'skipped'

export interface Ingredient {
  id: string
  groupId: string
  ingredientKey: string   // matches {token} in step text
  displayName: string
  amount: number
  unit: string
  displayOrder: number
}

export interface IngredientGroup {
  id: string
  recipeId: string
  name: string
  displayOrder: number
  ingredients: Ingredient[]
}

export interface InstructionStep {
  id: string
  groupId: string
  stepOrder: number
  text: string            // may contain {ingredientKey} tokens
}

export interface InstructionGroup {
  id: string
  recipeId: string
  name: string
  displayOrder: number
  steps: InstructionStep[]
}

export interface Recipe {
  id: string
  name: string
  description: string | null
  servings: number
  prepTime: string
  category: string
  proteinSource: string
  imagePath: string | null
  source: RecipeSource
  sortOrder: number
  createdAt: string
  ingredientGroups?: IngredientGroup[]
  instructionGroups?: InstructionGroup[]
}

export interface MealPlan {
  id: string
  weekStart: string       // ISO date string, always a Monday
  createdAt: string
  days: MealPlanDay[]
}

export interface MealPlanDay {
  id: string
  planId: string
  weekday: number         // 0 = Monday, 6 = Sunday
  status: DayStatus
  mealTitle: string | null
  recipeId: string | null
}
```

---

## Portion Scaling

Scaling is a **pure client-side rendering concern** — amounts are stored at base (default)
serving size in the database and multiplied at display time.

**Formula**: `scaledAmount = baseAmount * (currentServings / defaultServings)`

**Token resolution in instruction steps**:
1. Build a map: `{ [ingredientKey]: scaledAmount + unit }`
2. Replace all `{token}` occurrences in step text with the resolved value
3. Applied in `src/lib/scaling.ts` — a pure function with no side effects

Example:
```
Base: kyllingfilet = 400g, defaultServings = 2
Current: 4 servings → scale factor = 2
Step text: "Skjær {kyllingfilet} i strimler"
Rendered: "Skjær 800 g kyllingfilet i strimler"
```

---

## Supabase Storage

**Bucket name**: `recipe-images` (public)

**Path convention**: `{recipeId}.png` (or `{recipeId}.jpg` based on upload)

**Access**: Public URL pattern:
```
https://<project>.supabase.co/storage/v1/object/public/recipe-images/{recipeId}.png
```

The `image_path` column in `recipes` stores the storage path only (e.g. `"recipes/uuid.png"`),
not the full URL. The public URL is constructed at read time.

---

## Seed Data Migration

The 38 existing recipes in `src/recipe-data/recipes.json` require transformation:

| JSON field      | Target column(s)                                              |
|-----------------|---------------------------------------------------------------|
| `id`            | Used only for image filename lookup (`{id}.png`); new UUID generated |
| `name`          | `recipes.name`                                                |
| `description`   | `recipes.description`                                         |
| `servings`      | `recipes.servings`                                            |
| `prepTime`      | `recipes.prep_time`                                           |
| `ingredients`   | `ingredient_groups` + `ingredients` (keys → group names)      |
| `instructions`  | `instruction_groups` + `instruction_steps`                    |
| *(missing)*     | `recipes.category` — must be back-filled per recipe           |
| *(missing)*     | `recipes.protein_source` — must be back-filled per recipe     |
| `{id}.png`      | Upload to `recipe-images` bucket; store path in `image_path`  |
