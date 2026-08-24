'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import RecipeDetail from '@/components/recipe/RecipeDetail'
import ImagePicker from '@/components/recipe/ImagePicker'
import CookingLoader, { REEL_STAGES, TEXT_STAGES } from '@/components/ui/CookingLoader'
import { generatedToRecipe, recipeToCreatePayload } from '@/lib/generatedToRecipe'
import { uploadRecipeImage } from '@/lib/recipeImage'
import type { Recipe } from '@/types'
import type { GeneratedRecipe } from '@/lib/ai/claude'

export default function ImportReelPage() {
  const router = useRouter()

  const [mode, setMode] = useState<'url' | 'text'>('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [instructions, setInstructions] = useState('')
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const busy = isExtracting || isSaving

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsExtracting(true)
    try {
      const res = await fetch('/api/recipes/import/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'url' ? { url, instructions } : { text, instructions }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Noe gikk galt.')
        return
      }

      setRecipe(generatedToRecipe(data.recipe as GeneratedRecipe, null))
    } catch {
      setError('Fikk ikke kontakt med serveren.')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSave = async () => {
    if (!recipe) return
    setError(null)
    setIsSaving(true)
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeToCreatePayload(recipe)),
      })

      if (!res.ok) {
        setError('Kunne ikke lagre oppskriften. Prøv igjen.')
        return
      }

      const saved = await res.json()

      if (imageFile) {
        await uploadRecipeImage(saved.id, imageFile)
      }

      router.push(`/recipes/${saved.id}`)
    } catch {
      setError('Fikk ikke kontakt med serveren.')
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    setRecipe(null)
    setImageFile(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hent fra Instagram</h1>
        <p className="mt-1 text-gray-600">
          Lim inn en reel-lenke, eller teksten fra beskrivelsen, så lager Middah en
          oppskrift av den.
        </p>
      </div>

      <form onSubmit={handleExtract} className="space-y-4">
        <div className="inline-flex p-1 bg-gray-100 rounded-lg" role="tablist">
          {(['url', 'text'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === m
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {m === 'url' ? 'Lenke' : 'Lim inn tekst'}
            </button>
          ))}
        </div>

        {mode === 'url' ? (
          <div>
            <label htmlFor="reel-url" className="block text-sm font-medium text-gray-700">
              Instagram-lenke
            </label>
            <input
              id="reel-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="reel-text" className="block text-sm font-medium text-gray-700">
              Tekst fra reelen
            </label>
            <textarea
              id="reel-text"
              required
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Lim inn beskrivelsen — eller kommentaren — som inneholder oppskriften."
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              Virker overalt, og er eneste vei når oppskriften ligger i en kommentar.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="reel-instructions" className="block text-sm font-medium text-gray-700">
            Egne instruksjoner <span className="text-gray-400">(valgfritt)</span>
          </label>
          <textarea
            id="reel-instructions"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="F.eks. «gjør den vegetarisk», «skaler til 6 porsjoner», «dropp chili»"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            Gjelder begge inngangene, og har forrang over kildeteksten.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {isExtracting
              ? 'Henter…'
              : recipe
                ? 'Tolk på nytt'
                : 'Lag oppskrift'}
          </button>
          <Link
            href="/"
            className="flex flex-col justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Avbryt
          </Link>
        </div>
      </form>

      {error && (
        <p className="px-3 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </p>
      )}

      {isExtracting && (
        <CookingLoader stages={mode === 'url' ? REEL_STAGES : TEXT_STAGES} />
      )}

      {recipe && (
        <div className="pt-6 border-t border-gray-200 space-y-4">
          <ImagePicker file={imageFile} onChange={setImageFile} disabled={busy} />

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDiscard}
              disabled={busy}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Forkast
            </button>
            <span className="text-xs text-gray-500">
              Ingenting lagres før du trykker «Lagre oppskrift».
            </span>
          </div>

          <RecipeDetail recipe={recipe} previewMode onSave={handleSave} isSaving={isSaving} />
        </div>
      )}
    </div>
  )
}
