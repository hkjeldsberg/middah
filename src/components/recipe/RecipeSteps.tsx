'use client'

import { useState, useEffect } from 'react'
import type { InstructionGroup } from '@/types'

interface RecipeStepsProps {
  groups: InstructionGroup[]
  renderStep: (text: string) => React.ReactNode
  recipeId: string
}

type StepState = 'upcoming' | 'active' | 'done'

function storageKey(recipeId: string) {
  return `recipe-progress-${recipeId}`
}

export default function RecipeSteps({ groups, renderStep, recipeId }: RecipeStepsProps) {
  // Flatten all steps across groups into a single ordered list
  const allSteps = groups.flatMap((g) => g.steps)

  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  // Restore progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(storageKey(recipeId))
    if (!saved) return
    try {
      const { activeIndex: ai, doneIds: di } = JSON.parse(saved)
      setActiveIndex(ai ?? 0)
      setDoneIds(new Set(di ?? []))
    } catch {
      // ignore corrupt data
    }
  }, [recipeId])

  // Persist on change
  useEffect(() => {
    localStorage.setItem(
      storageKey(recipeId),
      JSON.stringify({ activeIndex, doneIds: [...doneIds] }),
    )
  }, [activeIndex, doneIds, recipeId])

  function getState(index: number, stepId: string): StepState {
    if (doneIds.has(stepId)) return 'done'
    if (index === activeIndex) return 'active'
    return 'upcoming'
  }

  function handleStepClick(index: number, stepId: string) {
    const state = getState(index, stepId)

    if (state === 'active') {
      // Mark done, advance to next undone step
      setDoneIds((prev) => new Set([...prev, stepId]))
      const next = allSteps.findIndex((s, i) => i > index && !doneIds.has(s.id))
      setActiveIndex(next === -1 ? index : next)
    } else if (state === 'done') {
      // Undo: unmark and make active again
      setDoneIds((prev) => {
        const next = new Set(prev)
        next.delete(stepId)
        return next
      })
      setActiveIndex(index)
    } else {
      // Jump to upcoming step
      setActiveIndex(index)
    }
  }

  function handleReset() {
    setActiveIndex(0)
    setDoneIds(new Set())
    localStorage.removeItem(storageKey(recipeId))
  }

  const allDone = doneIds.size === allSteps.length

  let globalIndex = 0

  return (
    <div>
      {groups.map((group, gi) => (
        <div key={group.id} className="mb-4">
          {groups.length > 1 && (
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              {group.name}
            </h3>
          )}
          <ol className="space-y-2">
            {group.steps.map((step) => {
              const index = globalIndex++
              const state = getState(index, step.id)

              return (
                <li
                  key={step.id}
                  onClick={() => handleStepClick(index, step.id)}
                  className={[
                    'flex items-start gap-3 rounded-lg px-3 py-2 cursor-pointer select-none transition-all',
                    state === 'active' && 'bg-orange-50 border-l-4 border-orange-400',
                    state === 'done' && 'opacity-40',
                    state === 'upcoming' && 'opacity-70 hover:opacity-90',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {/* Step number / checkmark */}
                  <span
                    className={[
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      state === 'done' && 'bg-green-500 text-white',
                      state === 'active' && 'bg-orange-400 text-white',
                      state === 'upcoming' && 'bg-gray-200 text-gray-500',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {state === 'done' ? '✓' : index + 1}
                  </span>

                  {/* Step text */}
                  <span
                    className={[
                      'text-sm leading-relaxed',
                      state === 'done' && 'line-through text-gray-400',
                      state === 'active' && 'text-gray-900 font-medium',
                      state === 'upcoming' && 'text-gray-700',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {renderStep(step.text)}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      ))}

      {/* Reset / completion row */}
      <div className="mt-4 flex items-center gap-3">
        {allDone && (
          <span className="text-sm font-medium text-green-600">Ferdig! God appetitt.</span>
        )}
        {doneIds.size > 0 && (
          <button
            onClick={handleReset}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Nullstill fremgang
          </button>
        )}
      </div>
    </div>
  )
}
