import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { generateMealTitles } from '@/lib/ai/claude'
import { rowToMealPlan, type MealPlanRow } from '@/types'

type Params = Promise<{ planId: string; dayId: string }>

async function fetchFullPlan(planId: string): Promise<MealPlanRow> {
  const { data } = await supabaseServer
    .from('meal_plans')
    .select('*, meal_plan_days(*)')
    .eq('id', planId)
    .single()
  return data as MealPlanRow
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { planId, dayId } = await params
  const body = await request.json()
  const { action, withDayId, cuisines, recipeId } = body

  if (action === 'skip') {
    await supabaseServer
      .from('meal_plan_days')
      .update({ status: 'skipped', meal_title: null })
      .eq('id', dayId)

  } else if (action === 'swap' && withDayId) {
    // Fetch both days
    const { data: days } = await supabaseServer
      .from('meal_plan_days')
      .select('id, meal_title, recipe_id, status')
      .in('id', [dayId, withDayId])

    if (!days || days.length !== 2) {
      return NextResponse.json({ error: 'Ugyldig handling' }, { status: 400 })
    }

    const [a, b] = days
    await Promise.all([
      supabaseServer.from('meal_plan_days').update({
        meal_title: b.meal_title,
        recipe_id: b.recipe_id,
        status: b.status,
      }).eq('id', a.id),
      supabaseServer.from('meal_plan_days').update({
        meal_title: a.meal_title,
        recipe_id: a.recipe_id,
        status: a.status,
      }).eq('id', b.id),
    ])

  } else if (action === 'regenerate') {
    const useCuisines = Array.isArray(cuisines) && cuisines.length > 0
      ? cuisines
      : ['indisk', 'thai', 'sør-amerikansk', 'skandinavisk', 'italiensk', 'middelhavet']

    let titles: string[]
    try {
      titles = await generateMealTitles(useCuisines, 1)
    } catch {
      return NextResponse.json({ error: 'AI-generering feilet. Prøv igjen.' }, { status: 502 })
    }

    await supabaseServer
      .from('meal_plan_days')
      .update({ meal_title: titles[0], status: 'suggested' })
      .eq('id', dayId)

  } else if (action === 'edit' && typeof body.mealTitle === 'string') {
    await supabaseServer
      .from('meal_plan_days')
      .update({ meal_title: body.mealTitle, status: 'suggested' })
      .eq('id', dayId)

  } else if (action === 'link' && recipeId) {
    await supabaseServer
      .from('meal_plan_days')
      .update({ recipe_id: recipeId })
      .eq('id', dayId)

  } else {
    return NextResponse.json({ error: 'Ugyldig handling' }, { status: 400 })
  }

  const plan = await fetchFullPlan(planId)
  return NextResponse.json(rowToMealPlan(plan))
}
