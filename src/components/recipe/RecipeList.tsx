'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Recipe } from '@/types'
import RecipeFilters from './RecipeFilters'
import RecipeGrid from './RecipeGrid'
import EmptyState from '@/components/ui/EmptyState'

const CATEGORIES = ['middag', 'forrett', 'dessert', 'frokost', 'lunsj', 'bakst', 'snacks', 'suppe']
const PROTEINS = ['kylling', 'storfe', 'svin', 'fisk', 'vegetar', 'vegan', 'lam', 'annet']

interface RecipeListProps {
  recipes: Recipe[]
}

export default function RecipeList({ recipes }: RecipeListProps) {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') ?? ''
  const proteinSource = searchParams.get('proteinSource') ?? ''

  const availableCategories = useMemo(
    () => CATEGORIES.filter((c) => recipes.some((r) => r.category === c)),
    [recipes]
  )

  const availableProteins = useMemo(
    () => PROTEINS.filter((p) => recipes.some((r) => r.proteinSource === p)),
    [recipes]
  )

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      if (category && r.category !== category) return false
      if (proteinSource && r.proteinSource !== proteinSource) return false
      return true
    })
  }, [recipes, category, proteinSource])

  if (recipes.length === 0) {
    return (
      <EmptyState
        heading="Ingen oppskrifter funnet"
        description="Kom i gang ved å legge til din første oppskrift."
        action={{ label: 'Legg til oppskrift', href: '/recipes/new' }}
      />
    )
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <RecipeFilters
          availableCategories={availableCategories}
          availableProteins={availableProteins}
        />
        <Link
          href="/recipes/new"
          className="ml-auto shrink-0 flex items-center justify-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Ny oppskrift
        </Link>
      </div>
      {filteredRecipes.length === 0 ? (
        <EmptyState
          heading="Ingen oppskrifter funnet"
          description="Prøv å endre filtrene for å se flere oppskrifter."
          action={{ label: 'Nullstill filter', href: '/' }}
        />
      ) : (
        <RecipeGrid initialRecipes={filteredRecipes} />
      )}
    </>
  )
}
