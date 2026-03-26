'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const ALL_CATEGORIES = [
  { value: 'middag', label: 'Middag' },
  { value: 'forrett', label: 'Forrett' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'frokost', label: 'Frokost' },
  { value: 'lunsj', label: 'Lunsj' },
  { value: 'bakst', label: 'Bakst' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'suppe', label: 'Suppe' },
]

const ALL_PROTEINS = [
  { value: 'kylling', label: 'Kylling' },
  { value: 'storfe', label: 'Storfe' },
  { value: 'svin', label: 'Svin' },
  { value: 'fisk', label: 'Fisk / Sjømat' },
  { value: 'vegetar', label: 'Vegetar' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'lam', label: 'Lam' },
  { value: 'annet', label: 'Annet' },
]

interface RecipeFiltersProps {
  availableCategories: string[]
  availableProteins: string[]
}

export default function RecipeFilters({ availableCategories, availableProteins }: RecipeFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category') ?? ''
  const proteinSource = searchParams.get('proteinSource') ?? ''

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/?${params.toString()}`)
    },
    [router, searchParams]
  )

  const visibleCategories = ALL_CATEGORIES.filter((c) => availableCategories.includes(c.value))
  const visibleProteins = ALL_PROTEINS.filter((p) => availableProteins.includes(p.value))

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={category}
        onChange={(e) => updateFilter('category', e.target.value)}
        className="h-11 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        aria-label="Filtrer etter kategori"
      >
        <option value="">Alle kategorier</option>
        {visibleCategories.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        value={proteinSource}
        onChange={(e) => updateFilter('proteinSource', e.target.value)}
        className="h-11 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        aria-label="Filtrer etter proteinkilde"
      >
        <option value="">Alle proteiner</option>
        {visibleProteins.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {(category || proteinSource) && (
        <button
          onClick={() => router.push('/')}
          className="h-11 px-3 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Nullstill filter
        </button>
      )}
    </div>
  )
}
