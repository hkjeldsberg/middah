import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

type Params = Promise<{ id: string }>

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Ingen fil valgt' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'png'
  const storagePath = `recipes/${id}.${ext}`
  const buffer = await file.arrayBuffer()

  // Remove existing image if present
  await supabaseServer.storage.from('recipe-images').remove([storagePath])

  const { error: uploadError } = await supabaseServer.storage
    .from('recipe-images')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabaseServer.storage
    .from('recipe-images')
    .getPublicUrl(storagePath)

  await supabaseServer
    .from('recipes')
    .update({ image_path: storagePath })
    .eq('id', id)

  return NextResponse.json({ imagePath: storagePath, imageUrl: urlData.publicUrl })
}
