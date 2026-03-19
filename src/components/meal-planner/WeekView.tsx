'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DaySlot from './DaySlot'
import type { MealPlan, MealPlanDay } from '@/types'
import type { GeneratedRecipe } from '@/lib/ai/claude'

interface WeekViewProps {
  plan: MealPlan
  cuisines: string[]
  onPlanUpdate: (plan: MealPlan) => void
}

export default function WeekView({ plan, cuisines, onPlanUpdate }: WeekViewProps) {
  const router = useRouter()
  const [loadingDayId, setLoadingDayId] = useState<string | null>(null)
  const [swappingDayId, setSwappingDayId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const patchDay = async (dayId: string, body: Record<string, unknown>) => {
    setLoadingDayId(dayId)
    setError(null)
    try {
      const res = await fetch(`/api/meal-plans/${plan.id}/days/${dayId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Noe gikk galt')
        return
      }
      const updated = await res.json()
      onPlanUpdate(updated)
    } catch {
      setError('Nettverksfeil. Prøv igjen.')
    } finally {
      setLoadingDayId(null)
    }
  }

  const handleSkip = (day: MealPlanDay) => patchDay(day.id, { action: 'skip' })

  const handleRegenerate = (day: MealPlanDay) =>
    patchDay(day.id, { action: 'regenerate', cuisines })

  const handleEditTitle = (day: MealPlanDay, newTitle: string) =>
    patchDay(day.id, { action: 'edit', mealTitle: newTitle })

  const handleSwapStart = (day: MealPlanDay) => {
    setSwappingDayId(day.id)
  }

  const handleSwapConfirm = (targetDay: MealPlanDay) => {
    if (!swappingDayId) return
    const sourceId = swappingDayId
    setSwappingDayId(null)
    patchDay(sourceId, { action: 'swap', withDayId: targetDay.id })
  }

  const handleGenerateRecipe = async (day: MealPlanDay) => {
    setLoadingDayId(day.id)
    setError(null)
    try {
      const res = await fetch(`/api/meal-plans/${plan.id}/days/${day.id}/generate-recipe`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Noe gikk galt')
        return
      }
      const { recipe, imagePath } = await res.json() as { recipe: GeneratedRecipe; imagePath: string | null }
      sessionStorage.setItem('pendingRecipe', JSON.stringify({ recipe, imagePath, planId: plan.id, dayId: day.id }))
      router.push('/recipes/preview')
    } catch {
      setError('Nettverksfeil. Prøv igjen.')
    } finally {
      setLoadingDayId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {swappingDayId && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <span>Velg en dag å bytte med</span>
          <button onClick={() => setSwappingDayId(null)} className="ml-4 text-blue-500 hover:text-blue-700">Avbryt</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
        {plan.days.map((day) => (
          <DaySlot
            key={day.id}
            day={day}
            isLoading={loadingDayId === day.id}
            isSwapSource={swappingDayId === day.id}
            isSwapMode={swappingDayId !== null}
            onSkip={() => handleSkip(day)}
            onRegenerate={() => handleRegenerate(day)}
            onSwapStart={() => handleSwapStart(day)}
            onSwapConfirm={() => handleSwapConfirm(day)}
            onGenerateRecipe={() => handleGenerateRecipe(day)}
            onEditTitle={(title) => handleEditTitle(day, title)}
          />
        ))}
      </div>
    </div>
  )
}
