import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const items: { id: string; sortOrder: number }[] = await request.json()

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Ugyldig forespørsel' }, { status: 400 })
  }

  const updates = items.map(({ id, sortOrder }) =>
    supabaseServer
      .from('recipes')
      .update({ sort_order: sortOrder })
      .eq('id', id)
  )

  await Promise.all(updates)

  return NextResponse.json({ updated: items.length })
}
