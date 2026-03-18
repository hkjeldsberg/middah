'use client'

import { useState } from 'react'
import type { Recipe } from '@/types'
import { buildIngredientMap, resolveTokens, scaleAmount } from '@/lib/scaling'
import PortionControl from './PortionControl'
import WakeLockToggle from './WakeLockToggle'
import Link from 'next/link'

interface RecipeDetailProps {
  recipe: Recipe
  /** When true, shows Save button instead of Edit/Delete */
  previewMode?: boolean
  onSave?: () => Promise<void>
  isSaving?: boolean
}

function getImageUrl(imagePath: string | null): string {
  if (!imagePath) return ''
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${url}/storage/v1/object/public/recipe-images/${imagePath}`
}

export default function RecipeDetail({
  recipe,
  previewMode = false,
  onSave,
  isSaving = false,
}: RecipeDetailProps) {
  const [servings, setServings] = useState(recipe.servings)

  const ingredientMap = buildIngredientMap(recipe.ingredientGroups ?? [])

  return (
    <article className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{recipe.name}</h1>
          {recipe.description && (
            <p className="mt-1 text-gray-600">{recipe.description}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {recipe.prepTime}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {previewMode ? (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Lagrer…' : 'Lagre oppskrift'}
            </button>
          ) : (
            <>
              <Link
                href={`/recipes/${recipe.id}/edit`}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Rediger
              </Link>
              <WakeLockToggle />
            </>
          )}
        </div>
      </div>

      {/* Hero image */}
      {recipe.imagePath && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={getImageUrl(recipe.imagePath)}
          alt={recipe.name}
          className="w-full max-h-72 object-cover rounded-xl"
        />
      )}

      {/* Portion control */}
      <PortionControl value={servings} onChange={setServings} />

      {/* Two-column: ingredients | instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ingredients */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Ingredienser</h2>
          {recipe.ingredientGroups?.map((group) => (
            <div key={group.id} className="mb-4">
              {recipe.ingredientGroups!.length > 1 && (
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  {group.name}
                </h3>
              )}
              <ul className="space-y-1">
                {group.ingredients.map((ing) => {
                  const scaled = scaleAmount(ing.amount, recipe.servings, servings)
                  const formatted = scaled % 1 === 0 ? scaled : (Math.round(scaled * 10) / 10)
                  return (
                    <li key={ing.id} className="flex gap-2 text-sm text-gray-800">
                      <span className="font-medium tabular-nums w-16 shrink-0 text-right">
                        {formatted} {ing.unit}
                      </span>
                      <span>{ing.displayName}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </section>

        {/* Instructions */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Fremgangsmåte</h2>
          {recipe.instructionGroups?.map((group) => (
            <div key={group.id} className="mb-4">
              {recipe.instructionGroups!.length > 1 && (
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  {group.name}
                </h3>
              )}
              <ol className="space-y-2 list-decimal list-inside">
                {group.steps.map((step) => (
                  <li key={step.id} className="text-sm text-gray-800 leading-relaxed">
                    {resolveTokens(step.text, ingredientMap, recipe.servings, servings)}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      </div>
    </article>
  )
}
