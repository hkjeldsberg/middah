/** Hero images render at most ~1200px wide, so anything larger is wasted upload. */
const MAX_EDGE = 1600
const JPEG_QUALITY = 0.85

/**
 * Downscales a photo in the browser before upload. A 4 MB phone picture becomes
 * a few hundred KB, which matters a lot on a slow or flaky uplink — large
 * uploads to Supabase Storage stall and die with ECONNRESET part-way through.
 *
 * Falls back to the original file if anything about the conversion fails.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

  try {
    // `from-image` applies EXIF orientation, so phone photos keep the right way up.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file

    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    )
    if (!blob) return file

    // Keep the original if re-encoding somehow made it bigger.
    if (blob.size >= file.size) return file

    const base = file.name.replace(/\.[^.]+$/, '') || 'bilde'
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file
  }
}

/**
 * Uploads an image for an already-saved recipe. Best-effort: a failed upload
 * must not lose the recipe the user just saved.
 */
export async function uploadRecipeImage(recipeId: string, file: File): Promise<boolean> {
  const prepared = await shrinkImage(file)

  const formData = new FormData()
  formData.append('file', prepared)

  try {
    const res = await fetch(`/api/recipes/${recipeId}/image`, {
      method: 'POST',
      body: formData,
    })
    return res.ok
  } catch {
    return false
  }
}
