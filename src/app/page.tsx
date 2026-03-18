import { supabaseServer } from '@/lib/supabase/server'
import { rowToRecipe } from '@/types'
import type { RecipeRow } from '@/types'
import RecipeGrid from '@/components/recipe/RecipeGrid'
import RecipeFilters from '@/components/recipe/RecipeFilters'
import EmptyState from '@/components/ui/EmptyState'
import Link from 'next/link'

interface PageProps {
  searchParams: Promise<{ category?: string; proteinSource?: string }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const { category, proteinSource } = await searchParams

  let query = supabaseServer
    .from('recipes')
    .select('*')
    .order('sort_order', { ascending: true })

  if (category) query = query.eq('category', category)
  if (proteinSource) query = query.eq('protein_source', proteinSource)

  const { data } = await query
  const recipes = (data as RecipeRow[] ?? []).map(rowToRecipe)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Oppskrifter</h1>
        <Link
          href="/recipes/new"
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Ny oppskrift
        </Link>
      </div>

      <RecipeFilters />

      {recipes.length === 0 ? (
        <EmptyState
          heading="Ingen oppskrifter funnet"
          description={
            category || proteinSource
              ? 'Prøv å endre filtrene for å se flere oppskrifter.'
              : 'Kom i gang ved å legge til din første oppskrift.'
          }
          action={{ label: 'Legg til oppskrift', href: '/recipes/new' }}
        />
      ) : (
        <RecipeGrid initialRecipes={recipes} />
      )}
    </div>
  )
}
