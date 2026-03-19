import OpenAI from 'openai'
import { supabaseServer } from '@/lib/supabase/server'

const openai = new OpenAI()

export async function generateAndUploadRecipeImage(mealTitle: string): Promise<string | null> {
  try {
    const prompt = `Food photography of "${mealTitle}". Rustic wooden table, warm natural lighting, appetizing plating, vibrant colors, overhead shot. Classic food blog style.`

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid',
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) return null

    // Download the generated image
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) return null
    const buffer = await imageRes.arrayBuffer()

    // Upload to Supabase Storage
    const filename = `ai/${Date.now()}.png`
    const { error } = await supabaseServer.storage
      .from('recipe-images')
      .upload(filename, Buffer.from(buffer), {
        contentType: 'image/png',
        upsert: false,
      })

    if (error) {
      console.error('[image] upload feil:', error)
      return null
    }

    return filename
  } catch (err) {
    // Image generation is best-effort — never block recipe generation
    console.error('[image] generering feil:', err)
    return null
  }
}
