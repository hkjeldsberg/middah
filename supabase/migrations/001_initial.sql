-- Middah: Initial schema migration
-- Run this via the Supabase dashboard SQL Editor

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
