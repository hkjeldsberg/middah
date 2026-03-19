'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RecipeDetail from '@/components/recipe/RecipeDetail'
import type { Recipe } from '@/types'
import type { GeneratedRecipe } from '@/lib/ai/claude'

function generatedToRecipe(gen: GeneratedRecipe, imagePath: string | null): Recipe {
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

export default function RecipePreviewPage() {
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [dayId, setDayId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingRecipe')
    if (!raw) { router.replace('/meal-planner'); return }
    const { recipe: gen, imagePath: ip, planId: pid, dayId: did } = JSON.parse(raw) as {
      recipe: GeneratedRecipe
      imagePath: string | null
      planId: string
      dayId: string
    }
    setImagePath(ip ?? null)
    setRecipe(generatedToRecipe(gen, ip ?? null))
    setPlanId(pid)
    setDayId(did)
  }, [router])

  const handleSave = async () => {
    if (!recipe) return
    setIsSaving(true)
    try {
      const ingredientGroups = recipe.ingredientGroups?.map((g) => ({
        name: g.name,
        ingredients: g.ingredients.map((i) => ({
          ingredientKey: i.ingredientKey,
          displayName: i.displayName,
          amount: i.amount,
          unit: i.unit,
        })),
      }))
      const instructionGroups = recipe.instructionGroups?.map((g) => ({
        name: g.name,
        steps: g.steps.map((s) => ({ text: s.text })),
      }))

      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recipe.name,
          description: recipe.description,
          category: recipe.category,
          protein_source: recipe.proteinSource,
          servings: recipe.servings,
          prep_time: recipe.prepTime,
          source: 'ai-generated',
          image_path: imagePath,
          ingredientGroups,
          instructionGroups,
        }),
      })

      if (!res.ok) {
        alert('Kunne ikke lagre oppskriften. Prøv igjen.')
        return
      }

      const saved = await res.json()

      // Link recipe to meal plan day
      if (planId && dayId) {
        await fetch(`/api/meal-plans/${planId}/days/${dayId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'link', recipeId: saved.id }),
        })
      }

      sessionStorage.removeItem('pendingRecipe')
      router.push(`/recipes/${saved.id}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (!recipe) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-gray-500">Laster forhåndsvisning…</p>
      </div>
    )
  }

  return <RecipeDetail recipe={recipe} previewMode onSave={handleSave} isSaving={isSaving} />
}
