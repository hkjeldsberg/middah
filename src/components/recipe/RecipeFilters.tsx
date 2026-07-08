'use client'

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
  searchQuery: string
  onSearchChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  proteinSource: string
  onProteinSourceChange: (value: string) => void
  onReset: () => void
}

export default function RecipeFilters({
  availableCategories,
  availableProteins,
  searchQuery,
  onSearchChange,
  category,
  onCategoryChange,
  proteinSource,
  onProteinSourceChange,
  onReset,
}: RecipeFiltersProps) {
  const visibleCategories = ALL_CATEGORIES.filter((c) => availableCategories.includes(c.value))
  const visibleProteins = ALL_PROTEINS.filter((p) => availableProteins.includes(p.value))

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Søk etter oppskrift…"
        className="h-11 px-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        aria-label="Søk etter oppskrift"
      />

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="h-11 pl-3 pr-10 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none bg-no-repeat"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
          backgroundPosition: 'right 0.75rem center',
        }}
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
        onChange={(e) => onProteinSourceChange(e.target.value)}
        className="h-11 pl-3 pr-10 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 appearance-none bg-no-repeat"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23374151' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
          backgroundPosition: 'right 0.75rem center',
        }}
        aria-label="Filtrer etter proteinkilde"
      >
        <option value="">Alle proteiner</option>
        {visibleProteins.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {(category || proteinSource || searchQuery) && (
        <button
          onClick={onReset}
          className="h-11 px-3 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Nullstill filter
        </button>
      )}
    </div>
  )
}
