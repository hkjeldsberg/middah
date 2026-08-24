import type { Recipe } from '@/types'
import type { GeneratedRecipe } from '@/lib/ai/claude'

/**
 * Maps an AI-generated recipe onto the domain `Recipe` shape so it can be rendered
 * with the normal recipe components before it exists in the database.
 */
export function generatedToRecipe(gen: GeneratedRecipe, imagePath: string | null): Recipe {
  return {
    id: 'preview',
    name: gen.name,
    description: gen.description,
    servings: gen.servings,
    prepTime: gen.prep_time,
    category: gen.category,
    proteinSource: gen.protein_source,
    imagePath,
    source: 'ai-generated',
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    ingredientGroups: gen.ingredient_groups.map((g, gi) => ({
      id: `preview-g-${gi}`,
      recipeId: 'preview',
      name: g.name,
      displayOrder: gi,
      ingredients: g.ingredients.map((ing, ii) => ({
        id: `preview-i-${gi}-${ii}`,
        groupId: `preview-g-${gi}`,
        ingredientKey: ing.ingredient_key,
        displayName: ing.display_name,
        amount: ing.amount,
        unit: ing.unit,
        displayOrder: ii,
      })),
    })),
    instructionGroups: gen.instruction_groups.map((g, gi) => ({
      id: `preview-ig-${gi}`,
      recipeId: 'preview',
      name: g.name,
      displayOrder: gi,
      steps: g.steps.map((text, si) => ({
        id: `preview-s-${gi}-${si}`,
        groupId: `preview-ig-${gi}`,
        stepOrder: si,
        text,
      })),
    })),
  }
}

/** Shape accepted by `POST /api/recipes`. Images are uploaded separately, after save. */
export function recipeToCreatePayload(recipe: Recipe) {
  return {
    name: recipe.name,
    description: recipe.description,
    category: recipe.category,
    protein_source: recipe.proteinSource,
    servings: recipe.servings,
    prep_time: recipe.prepTime,
    source: 'ai-generated' as const,
    ingredientGroups: recipe.ingredientGroups?.map((g) => ({
      name: g.name,
      ingredients: g.ingredients.map((i) => ({
        ingredientKey: i.ingredientKey,
        displayName: i.displayName,
        amount: i.amount,
        unit: i.unit,
      })),
    })),
    instructionGroups: recipe.instructionGroups?.map((g) => ({
      name: g.name,
      steps: g.steps.map((s) => ({ text: s.text })),
    })),
  }
}
