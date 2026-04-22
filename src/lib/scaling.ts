import type { IngredientGroup } from '@/types'

export function normalizeIngredientKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

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
      const entry = { amount: ing.amount, unit: ing.unit, displayName: ing.displayName }
      map[normalizeIngredientKey(ing.ingredientKey)] = entry
      map[normalizeIngredientKey(ing.displayName)] = entry
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
  return text.replace(/\{([^}]+)\}/g, (match, key) => {
    const ing = ingredientMap[normalizeIngredientKey(key)]
    if (!ing) return match
    const scaled = scaleAmount(ing.amount, defaultServings, currentServings)
    return `${formatAmount(scaled)} ${ing.unit} ${ing.displayName}`
  })
}
