/**
 * Uploads an image for an already-saved recipe. Best-effort: a failed upload
 * must not lose the recipe the user just saved.
 */
export async function uploadRecipeImage(recipeId: string, file: File): Promise<boolean> {
  const formData = new FormData()
  formData.append('file', file)

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
