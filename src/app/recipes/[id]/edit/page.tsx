'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import RecipeForm from '@/components/recipe/RecipeForm'
import type { RecipeFormData } from '@/components/recipe/RecipeForm'
import type { Recipe } from '@/types'

export default function EditRecipePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/recipes/${id}`)
      .then(res => res.json())
      .then(data => {
        setRecipe(data)
        setLoading(false)
      })
  }, [id])

  const handleSubmit = async (data: RecipeFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          category: data.category,
          protein_source: data.proteinSource,
          servings: data.servings,
          prep_time: data.prepTime,
          ingredientGroups: data.ingredientGroups,
          instructionGroups: data.instructionGroups,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? 'Noe gikk galt')
        return
      }

      if (data.imageFile) {
        const formData = new FormData()
        formData.append('image', data.imageFile)
        await fetch(`/api/recipes/${id}/image`, {
          method: 'POST',
          body: formData,
        })
      }

      router.push(`/recipes/${id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 text-sm">Laster oppskrift…</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 text-sm">Oppskrift ikke funnet.</p>
      </div>
    )
  }

  const initialData: Partial<RecipeFormData> = {
    name: recipe.name,
    description: recipe.description ?? '',
    category: recipe.category,
    proteinSource: recipe.proteinSource,
    servings: recipe.servings as 2 | 4,
    prepTime: recipe.prepTime,
    ingredientGroups: recipe.ingredientGroups?.map(g => ({
      name: g.name,
      ingredients: g.ingredients.map(i => ({
        ingredientKey: i.ingredientKey,
        displayName: i.displayName,
        amount: String(i.amount),
        unit: i.unit,
      })),
    })),
    instructionGroups: recipe.instructionGroups?.map(g => ({
      name: g.name,
      steps: g.steps.map(s => ({ text: s.text })),
    })),
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Rediger oppskrift</h1>
      <RecipeForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Lagre endringer"
      />
    </div>
  )
}
