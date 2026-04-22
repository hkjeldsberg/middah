'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RecipeForm from '@/components/recipe/RecipeForm'
import type { RecipeFormData } from '@/components/recipe/RecipeForm'

export default function NewRecipePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: RecipeFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          category: data.category,
          protein_source: data.proteinSource,
          servings: data.servings,
          prep_time: data.prepTime,
          source: 'manual',
          ingredientGroups: data.ingredientGroups,
          instructionGroups: data.instructionGroups,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? 'Noe gikk galt')
        return
      }

      const recipe = await res.json()

      // Upload image if provided
      if (data.imageFile) {
        const formData = new FormData()
        formData.append('file', data.imageFile)
        await fetch(`/api/recipes/${recipe.id}/image`, {
          method: 'POST',
          body: formData,
        })
      }

      router.push(`/recipes/${recipe.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ny oppskrift</h1>
      <RecipeForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Lagre oppskrift"
      />
    </div>
  )
}
