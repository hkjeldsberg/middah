import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { generateRecipe } from '@/lib/ai/claude'
import { generateAndUploadRecipeImage } from '@/lib/ai/image'

// Extend timeout for Sonnet + DALL-E calls (requires Vercel Pro for > 10s)
export const maxDuration = 60

type Params = Promise<{ planId: string; dayId: string }>

export async function POST(_request: NextRequest, { params }: { params: Params }) {
  const { dayId } = await params

  const { data: day } = await supabaseServer
    .from('meal_plan_days')
    .select('meal_title')
    .eq('id', dayId)
    .single()

  if (!day?.meal_title) {
    return NextResponse.json({ error: 'Ingen tittel på denne dagen' }, { status: 400 })
  }

  let recipe
  let imagePath: string | null = null

  try {
    // Run recipe text and image generation in parallel
    ;[recipe, imagePath] = await Promise.all([
      generateRecipe(day.meal_title),
      generateAndUploadRecipeImage(day.meal_title),
    ])
  } catch (err) {
    console.error('[generate-recipe] feil:', err)
    return NextResponse.json({ error: 'AI-generering feilet. Prøv igjen.' }, { status: 502 })
  }

  return NextResponse.json({ recipe, imagePath })
}
