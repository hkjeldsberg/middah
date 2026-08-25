import { NextRequest, NextResponse } from 'next/server'
import { fetchInstagramMetadata, ReelError } from '@/lib/instagram'
import { extractRecipeFromText, NotARecipeError } from '@/lib/ai/claude'

// yt-dlp + Claude in sequence; well past the default serverless budget.
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const { url, text, instructions } = (await request.json()) as {
    url?: string
    text?: string
    instructions?: string
  }

  // Pasted text wins when both are present — it needs no yt-dlp, so it works
  // in environments where the binary is unavailable, and it covers recipes that
  // live in a pinned comment rather than the reel description.
  let sourceText = text?.trim() ?? ''

  if (!sourceText) {
    if (!url?.trim()) {
      return NextResponse.json({ error: 'Lim inn en lenke eller en tekst' }, { status: 400 })
    }

    try {
      const meta = await fetchInstagramMetadata(url)
      sourceText = meta.description
    } catch (err) {
      if (err instanceof ReelError) {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
      console.error('[import/extract] uventet feil fra yt-dlp:', err)
      return NextResponse.json({ error: 'Klarte ikke å hente reelen.' }, { status: 502 })
    }
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
