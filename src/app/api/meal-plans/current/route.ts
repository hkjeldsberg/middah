import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { rowToMealPlan, type MealPlanRow } from '@/types'

function getISOWeekMonday(): string {
  const d = new Date()
  const day = d.getUTCDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().split('T')[0]
}

async function fetchFullPlan(planId: string): Promise<MealPlanRow> {
  const { data } = await supabaseServer
    .from('meal_plans')
    .select('*, meal_plan_days(*)')
    .eq('id', planId)
    .single()
  return data as MealPlanRow
}

export async function GET() {
  const weekStart = getISOWeekMonday()

  const { data: existing } = await supabaseServer
    .from('meal_plans')
    .select('id')
    .eq('week_start', weekStart)
    .maybeSingle()

  let planId: string

  if (!existing) {
    const { data: newPlan, error } = await supabaseServer
      .from('meal_plans')
      .insert({ week_start: weekStart })
      .select()
      .single()

    if (error || !newPlan) {
      return NextResponse.json({ error: 'Kunne ikke opprette plan' }, { status: 500 })
    }

    await supabaseServer.from('meal_plan_days').insert(
      Array.from({ length: 7 }, (_, i) => ({
        plan_id: newPlan.id,
        weekday: i,
        status: 'empty',
      }))
    )

    planId = newPlan.id
  } else {
    planId = existing.id
  }

  const plan = await fetchFullPlan(planId)
  return NextResponse.json(rowToMealPlan(plan))
}
