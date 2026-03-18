import type { IngredientGroup } from '@/types'

export function scaleAmount(
  base: number,
  defaultServings: number,
  currentServings: number
): number {
  return (base * currentServings) / defaultServings
}

function formatAmount(amount: number): string {
  if (amount % 1 === 0) return amount.toString()
  return (Math.round(amount * 10) / 10).toString()
}

export type IngredientMapEntry = {
  amount: number
  unit: string
  displayName: string
}

export function buildIngredientMap(
  ingredientGroups: IngredientGroup[]
): Record<string, IngredientMapEntry> {
  const map: Record<string, IngredientMapEntry> = {}
  for (const group of ingredientGroups) {
    for (const ing of group.ingredients) {
      map[ing.ingredientKey] = {
        amount: ing.amount,
        unit: ing.unit,
        displayName: ing.displayName,
      }
    }
  }
  return map
}

export function resolveTokens(
  text: string,
  ingredientMap: Record<string, IngredientMapEntry>,
  defaultServings: number,
  currentServings: number
): string {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    const ing = ingredientMap[key]
    if (!ing) return match
    const scaled = scaleAmount(ing.amount, defaultServings, currentServings)
    return `${formatAmount(scaled)} ${ing.unit} ${ing.displayName}`
  })
}
