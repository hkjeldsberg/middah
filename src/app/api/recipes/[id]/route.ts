import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

export async function GET(_request: NextRequest, { params }: { params: Params }) {
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

  if (error || !data) {
    return NextResponse.json({ error: 'Ikke funnet' }, { status: 404 })
  }

  return NextResponse.json(data)
}

interface IngredientInput {
  ingredientKey: string
  displayName: string
  amount: number
  unit: string
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const body = await request.json()
  const { name, description, category, protein_source, servings, prep_time, ingredientGroups, instructionGroups } = body

  const { error: updateError } = await supabaseServer
    .from('recipes')
    .update({ name, description, category, protein_source, servings, prep_time })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Groups are replaced wholesale. Insert them in bulk rather than one round-trip
  // per group — a recipe with several groups used to take ~18 sequential calls to
  // Supabase, which made saving take over ten seconds.
  const replaceIngredients = async () => {
    await supabaseServer.from('ingredient_groups').delete().eq('recipe_id', id)
    if (!Array.isArray(ingredientGroups) || ingredientGroups.length === 0) return

    const { data: groups } = await supabaseServer
      .from('ingredient_groups')
      .insert(
        ingredientGroups.map((g: { name: string }, gi: number) => ({
          recipe_id: id,
          name: g.name,
          display_order: gi,
        }))
      )
      .select()
    if (!groups) return

    // Match on display_order rather than array position — insert order is not
    // something the client should have to trust.
    const idByOrder = new Map<number, string>(
      groups.map((g) => [g.display_order as number, g.id as string])
    )

    const rows = ingredientGroups.flatMap((group: { ingredients?: IngredientInput[] }, gi: number) => {
      const groupId = idByOrder.get(gi)
      if (!groupId || !Array.isArray(group.ingredients)) return []
      return group.ingredients.map((ing, ii) => ({
        group_id: groupId,
        ingredient_key: ing.ingredientKey,
        display_name: ing.displayName,
        amount: ing.amount,
        unit: ing.unit,
        display_order: ii,
      }))
    })

    if (rows.length) await supabaseServer.from('ingredients').insert(rows)
  }

  const replaceInstructions = async () => {
    await supabaseServer.from('instruction_groups').delete().eq('recipe_id', id)
    if (!Array.isArray(instructionGroups) || instructionGroups.length === 0) return

    const { data: groups } = await supabaseServer
      .from('instruction_groups')
      .insert(
        instructionGroups.map((g: { name: string }, gi: number) => ({
          recipe_id: id,
          name: g.name,
          display_order: gi,
        }))
      )
      .select()
    if (!groups) return

    const idByOrder = new Map<number, string>(
      groups.map((g) => [g.display_order as number, g.id as string])
    )

    const rows = instructionGroups.flatMap((group: { steps?: { text: string }[] }, gi: number) => {
      const groupId = idByOrder.get(gi)
      if (!groupId || !Array.isArray(group.steps)) return []
      return group.steps.map((step, si) => ({
        group_id: groupId,
        step_order: si,
        text: step.text,
      }))
    })

    if (rows.length) await supabaseServer.from('instruction_steps').insert(rows)
  }

  // The two halves touch different tables, so they can run at the same time.
  await Promise.all([replaceIngredients(), replaceInstructions()])

  const { data } = await supabaseServer.from('recipes').select('*').eq('id', id).single()
  return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  const { id } = await params

  // Get image path before deleting
  const { data: recipe } = await supabaseServer
    .from('recipes')
    .select('image_path')
    .eq('id', id)
    .single()

  if (recipe?.image_path) {
    await supabaseServer.storage.from('recipe-images').remove([recipe.image_path])
  }

  const { error } = await supabaseServer.from('recipes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
