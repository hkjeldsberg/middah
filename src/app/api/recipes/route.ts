import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const proteinSource = searchParams.get('proteinSource')

  let query = supabaseServer
    .from('recipes')
    .select('*')
    .order('sort_order', { ascending: true })

  if (category) query = query.eq('category', category)
  if (proteinSource) query = query.eq('protein_source', proteinSource)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, description, category, protein_source, servings, prep_time, source, image_path, ingredientGroups, instructionGroups } = body

  if (!name || !category || !protein_source || !prep_time) {
    return NextResponse.json({ error: 'Mangler påkrevde felter' }, { status: 400 })
  }

  // Get max sort_order
  const { data: maxRow } = await supabaseServer
    .from('recipes')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const sortOrder = maxRow ? (maxRow.sort_order as number) + 1 : 0

  const { data: recipe, error } = await supabaseServer
    .from('recipes')
    .insert({
      name,
      description: description ?? null,
      category,
      protein_source,
      servings: servings ?? 2,
      prep_time,
      source: source ?? 'manual',
      sort_order: sortOrder,
      image_path: image_path ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const recipeId = recipe.id

  // Insert ingredient groups
  if (Array.isArray(ingredientGroups)) {
    for (let gi = 0; gi < ingredientGroups.length; gi++) {
      const group = ingredientGroups[gi]
      const { data: ig, error: igErr } = await supabaseServer
        .from('ingredient_groups')
        .insert({ recipe_id: recipeId, name: group.name, display_order: gi })
        .select()
        .single()
      if (igErr) continue

      if (Array.isArray(group.ingredients)) {
        const rows = group.ingredients.map((ing: {
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
        await supabaseServer.from('ingredients').insert(rows)
      }
    }
  }

  // Insert instruction groups
  if (Array.isArray(instructionGroups)) {
    for (let gi = 0; gi < instructionGroups.length; gi++) {
      const group = instructionGroups[gi]
      const { data: ig, error: igErr } = await supabaseServer
        .from('instruction_groups')
        .insert({ recipe_id: recipeId, name: group.name, display_order: gi })
        .select()
        .single()
      if (igErr) continue

      if (Array.isArray(group.steps)) {
        const rows = group.steps.map((step: { text: string }, si: number) => ({
          group_id: ig.id,
          step_order: si,
          text: step.text,
        }))
        await supabaseServer.from('instruction_steps').insert(rows)
      }
    }
  }

  return NextResponse.json(recipe, { status: 201 })
}
