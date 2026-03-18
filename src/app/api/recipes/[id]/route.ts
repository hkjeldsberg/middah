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

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const body = await request.json()
  const { name, description, category, protein_source, servings, prep_time, ingredientGroups, instructionGroups } = body

  const { error: updateError } = await supabaseServer
    .from('recipes')
    .update({ name, description, category, protein_source, servings, prep_time })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Replace ingredient groups
  await supabaseServer.from('ingredient_groups').delete().eq('recipe_id', id)
  if (Array.isArray(ingredientGroups)) {
    for (let gi = 0; gi < ingredientGroups.length; gi++) {
      const group = ingredientGroups[gi]
      const { data: ig } = await supabaseServer
        .from('ingredient_groups')
        .insert({ recipe_id: id, name: group.name, display_order: gi })
        .select()
        .single()
      if (!ig) continue
      if (Array.isArray(group.ingredients)) {
        await supabaseServer.from('ingredients').insert(
          group.ingredients.map((ing: {
            ingredientKey: string
            displayName: string
            amount: number
            unit: string
          }, ii: number) => ({
            group_id: ig.id,
            ingredient_key: ing.ingredientKey,
            display_name: ing.displayName,
            amount: ing.amount,
            unit: ing.unit,
            display_order: ii,
          }))
        )
      }
    }
  }

  // Replace instruction groups
  await supabaseServer.from('instruction_groups').delete().eq('recipe_id', id)
  if (Array.isArray(instructionGroups)) {
    for (let gi = 0; gi < instructionGroups.length; gi++) {
      const group = instructionGroups[gi]
      const { data: ig } = await supabaseServer
        .from('instruction_groups')
        .insert({ recipe_id: id, name: group.name, display_order: gi })
        .select()
        .single()
      if (!ig) continue
      if (Array.isArray(group.steps)) {
        await supabaseServer.from('instruction_steps').insert(
          group.steps.map((step: { text: string }, si: number) => ({
            group_id: ig.id,
            step_order: si,
            text: step.text,
          }))
        )
      }
    }
  }

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
