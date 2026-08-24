'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RecipeDetail from '@/components/recipe/RecipeDetail'
import ImagePicker from '@/components/recipe/ImagePicker'
import { generatedToRecipe, recipeToCreatePayload } from '@/lib/generatedToRecipe'
import { uploadRecipeImage } from '@/lib/recipeImage'
import type { Recipe } from '@/types'
import type { GeneratedRecipe } from '@/lib/ai/claude'

export default function RecipePreviewPage() {
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)
  const [dayId, setDayId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem('pendingRecipe')
    if (!raw) { router.replace('/meal-planner'); return }
    const { recipe: gen, planId: pid, dayId: did } = JSON.parse(raw) as {
      recipe: GeneratedRecipe
      planId: string
      dayId: string
    }
    setRecipe(generatedToRecipe(gen, null))
    setPlanId(pid)
    setDayId(did)
  }, [router])

  const handleSave = async () => {
    if (!recipe) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeToCreatePayload(recipe)),
      })

      if (!res.ok) {
        alert('Kunne ikke lagre oppskriften. Prøv igjen.')
        return
      }

      const saved = await res.json()

      if (imageFile) {
        await uploadRecipeImage(saved.id, imageFile)
      }

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

  return (
    <div className="space-y-6">
      <ImagePicker file={imageFile} onChange={setImageFile} disabled={isSaving} />
      <RecipeDetail recipe={recipe} previewMode onSave={handleSave} isSaving={isSaving} />
    </div>
  )
}
