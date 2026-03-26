import { Suspense } from 'react'
import { supabaseServer } from '@/lib/supabase/server'
import { rowToRecipe } from '@/types'
import type { RecipeRow } from '@/types'
import RecipeList from '@/components/recipe/RecipeList'

export default async function HomePage() {
  const { data } = await supabaseServer
    .from('recipes')
    .select('*')
    .order('sort_order', { ascending: true })

  const recipes = (data as RecipeRow[] ?? []).map(rowToRecipe)

  return (
    <Suspense>
      <RecipeList recipes={recipes} />
    </Suspense>
  )
}
