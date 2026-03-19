export type RecipeSource = 'manual' | 'ai-generated'
export type DayStatus = 'empty' | 'suggested' | 'skipped'

export interface Ingredient {
  id: string
  groupId: string
  ingredientKey: string
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
  text: string
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
  weekStart: string
  createdAt: string
  days: MealPlanDay[]
}

export interface MealPlanDay {
  id: string
  planId: string
  weekday: number
  status: DayStatus
  mealTitle: string | null
  recipeId: string | null
}

// Supabase DB row types (snake_case)
export interface RecipeRow {
  id: string
  name: string
  description: string | null
  servings: number
  prep_time: string
  category: string
  protein_source: string
  image_path: string | null
  source: RecipeSource
  sort_order: number
  created_at: string
  ingredient_groups?: IngredientGroupRow[]
  instruction_groups?: InstructionGroupRow[]
}

export interface IngredientGroupRow {
  id: string
  recipe_id: string
  name: string
  display_order: number
  ingredients: IngredientRow[]
}

export interface IngredientRow {
  id: string
  group_id: string
  ingredient_key: string
  display_name: string
  amount: number
  unit: string
  display_order: number
}

export interface InstructionGroupRow {
  id: string
  recipe_id: string
  name: string
  display_order: number
  instruction_steps: InstructionStepRow[]
}

export interface InstructionStepRow {
  id: string
  group_id: string
  step_order: number
  text: string
}

// Meal plan DB row types
export interface MealPlanRow {
  id: string
  week_start: string
  created_at: string
  meal_plan_days?: MealPlanDayRow[]
}

export interface MealPlanDayRow {
  id: string
  plan_id: string
  weekday: number
  status: DayStatus
  meal_title: string | null
  recipe_id: string | null
}

export function rowToMealPlan(row: MealPlanRow): MealPlan {
  return {
    id: row.id,
    weekStart: row.week_start,
    createdAt: row.created_at,
    days: (row.meal_plan_days ?? [])
      .sort((a, b) => a.weekday - b.weekday)
      .map((d) => ({
        id: d.id,
        planId: d.plan_id,
        weekday: d.weekday,
        status: d.status,
        mealTitle: d.meal_title,
        recipeId: d.recipe_id,
      })),
  }
}

// Helpers
export function rowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    servings: row.servings,
    prepTime: row.prep_time,
    category: row.category,
    proteinSource: row.protein_source,
    imagePath: row.image_path,
    source: row.source,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    ingredientGroups: row.ingredient_groups?.map((g) => ({
      id: g.id,
      recipeId: g.recipe_id,
      name: g.name,
      displayOrder: g.display_order,
      ingredients: g.ingredients.map((i) => ({
        id: i.id,
        groupId: i.group_id,
        ingredientKey: i.ingredient_key,
        displayName: i.display_name,
        amount: i.amount,
        unit: i.unit,
        displayOrder: i.display_order,
      })),
    })),
    instructionGroups: row.instruction_groups?.map((g) => ({
      id: g.id,
      recipeId: g.recipe_id,
      name: g.name,
      displayOrder: g.display_order,
      steps: g.instruction_steps.map((s) => ({
        id: s.id,
        groupId: s.group_id,
        stepOrder: s.step_order,
        text: s.text,
      })),
    })),
  }
}
