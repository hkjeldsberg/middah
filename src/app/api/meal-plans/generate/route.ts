import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { generateMealTitles } from '@/lib/ai/claude'
import { rowToMealPlan, type MealPlanRow } from '@/types'

async function fetchFullPlan(planId: string): Promise<MealPlanRow> {
  const { data } = await supabaseServer
    .from('meal_plans')
    .select('*, meal_plan_days(*)')
    .eq('id', planId)
    .single()
  return data as MealPlanRow
}

export async function POST(request: NextRequest) {
  const { planId, cuisines } = await request.json()

  if (!planId || !Array.isArray(cuisines) || cuisines.length === 0) {
    return NextResponse.json({ error: 'Ingen matretter valgt' }, { status: 400 })
  }

  // Fetch current days to know which to skip
  const { data: days } = await supabaseServer
    .from('meal_plan_days')
    .select('id, weekday, status')
    .eq('plan_id', planId)
    .order('weekday', { ascending: true })

  if (!days) {
    return NextResponse.json({ error: 'Plan ikke funnet' }, { status: 404 })
  }

  const activeDays = days // full regeneration includes previously skipped days

  let titles: string[]
  try {
    titles = await generateMealTitles(cuisines, activeDays.length)
  } catch {
    return NextResponse.json({ error: 'AI-generering feilet. Prøv igjen.' }, { status: 502 })
  }

  // Update each active day with a generated title
  await Promise.all(
    activeDays.map((day, i) =>
      supabaseServer
        .from('meal_plan_days')
        .update({ meal_title: titles[i] ?? null, status: 'suggested' })
        .eq('id', day.id)
    )
  )

  const plan = await fetchFullPlan(planId)
  return NextResponse.json(rowToMealPlan(plan))
}
