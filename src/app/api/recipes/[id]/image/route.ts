import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { withRetryResult } from '@/lib/retry'

type Params = Promise<{ id: string }>

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Ingen fil valgt' }, { status: 400 })
  }

  const rawExt = file.name.includes('.') ? file.name.split('.').pop() : null
  const ext = (rawExt || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png'
  const storagePath = `recipes/${id}.${ext}`
  const buffer = await file.arrayBuffer()

  // Remove existing image if present
  await supabaseServer.storage.from('recipe-images').remove([storagePath])

  const { error: uploadError } = await withRetryResult(
    () =>
      supabaseServer.storage
        .from('recipe-images')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        }),
    { label: `bildeopplasting ${storagePath}` }
  )

  if (uploadError) {
    console.error('[image] upload feil:', uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabaseServer.storage
    .from('recipe-images')
    .getPublicUrl(storagePath)

  const { error: updateError } = await withRetryResult(
    // The query builder is a thenable, not a Promise — await it so the retry
    // helper gets a real one.
    async () =>
      await supabaseServer.from('recipes').update({ image_path: storagePath }).eq('id', id),
    { label: `image_path ${id}` }
  )

  if (updateError) {
    console.error('[image] kunne ikke oppdatere image_path:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ imagePath: storagePath, imageUrl: urlData.publicUrl })
}
