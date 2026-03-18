import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase/server'
import { rowToRecipe } from '@/types'
import type { RecipeRow } from '@/types'
import RecipeDetail from '@/components/recipe/RecipeDetail'

type Params = Promise<{ id: string }>

export default async function RecipePage({ params }: { params: Params }) {
  const { id } = await params

  const { data, error } = await supabaseServer
    .from('recipes')
    .select(`
      *,
      ingredient_groups (
        *,
        ingredients (*)
      ),
      instruction_groups (
        *,
        instruction_steps (*)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) notFound()

  const recipe = rowToRecipe(data as RecipeRow)

  return <RecipeDetail recipe={recipe} />
}
