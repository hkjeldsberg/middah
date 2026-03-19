'use client'

import { useState, useEffect } from 'react'
import CuisineSelector from '@/components/meal-planner/CuisineSelector'
import WeekView from '@/components/meal-planner/WeekView'
import type { MealPlan } from '@/types'

export default function MealPlannerPage() {
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [cuisines, setCuisines] = useState(['indisk', 'thai', 'italiensk', 'middelhavet'])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/meal-plans/current')
      .then((r) => r.json())
      .then((data) => { setPlan(data); setLoading(false) })
      .catch(() => { setError('Kunne ikke laste ukeplanen. Prøv igjen.'); setLoading(false) })
  }, [])

  const handleGenerate = async () => {
    if (!plan) return
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/meal-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, cuisines }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Generering feilet. Prøv igjen.')
        return
      }
      const updated = await res.json()
      setPlan(updated)
    } catch {
      setError('Nettverksfeil. Prøv igjen.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-gray-500">Laster middagsplan…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Middagsplan</h1>

      {/* Cuisine selector + generate button */}
      <div className="p-4 border border-gray-200 rounded-xl space-y-4">
        <CuisineSelector selected={cuisines} onChange={setCuisines} />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || cuisines.length === 0}
          className="w-full sm:w-auto h-11 px-6 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? 'Genererer…' : 'Generer uke'}
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {plan && (
        <WeekView
          plan={plan}
          cuisines={cuisines}
          onPlanUpdate={setPlan}
        />
      )}
    </div>
  )
}
