import { NextRequest, NextResponse } from 'next/server'
import { fetchReelMetadata, ReelError } from '@/lib/reel'
import { extractRecipeFromText, NotARecipeError } from '@/lib/ai/claude'

// yt-dlp + Claude in sequence; well past the default serverless budget.
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const { url, instructions } = (await request.json()) as {
    url?: string
    instructions?: string
  }

  if (!url?.trim()) {
    return NextResponse.json({ error: 'Mangler lenke' }, { status: 400 })
  }

  let sourceText: string
  try {
    const meta = await fetchReelMetadata(url)
    sourceText = meta.description
  } catch (err) {
    if (err instanceof ReelError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[import/extract] uventet feil fra yt-dlp:', err)
    return NextResponse.json({ error: 'Klarte ikke å hente reelen.' }, { status: 502 })
  }

  try {
    const recipe = await extractRecipeFromText(sourceText, instructions)
    return NextResponse.json({ recipe, sourceText })
  } catch (err) {
    if (err instanceof NotARecipeError) {
      return NextResponse.json({ error: err.message, sourceText }, { status: 422 })
    }
    console.error('[import/extract] AI-feil:', err)
    return NextResponse.json({ error: 'AI-tolkning feilet. Prøv igjen.' }, { status: 502 })
  }
}
