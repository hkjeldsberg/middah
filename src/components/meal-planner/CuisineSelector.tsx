'use client'

const CUISINES = [
  { value: 'indisk', label: 'Indisk' },
  { value: 'thai', label: 'Thai' },
  { value: 'sør-amerikansk', label: 'Sør-Amerikansk' },
  { value: 'skandinavisk', label: 'Skandinavisk' },
  { value: 'italiensk', label: 'Italiensk' },
  { value: 'middelhavet', label: 'Middelhavet' },
  { value: 'kinesisk', label: 'Kinesisk' },
  { value: 'spansk', label: 'Spansk' },
  { value: 'meksikansk', label: 'Meksikansk' },
  { value: 'tyrkisk', label: 'Tyrkisk' },
  { value: 'gresk', label: 'Gresk' },
  { value: 'georgisk', label: 'Georgisk' },
  { value: 'middle-east', label: 'Midtøsten' },
]

interface CuisineSelectorProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function CuisineSelector({ selected, onChange }: CuisineSelectorProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      if (selected.length > 1) onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Kjøkken</p>
      <div className="flex flex-wrap gap-2">
        {CUISINES.map((c) => {
          const active = selected.includes(c.value)
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => toggle(c.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors min-h-[44px] ${
                active
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-600'
              }`}
            >
              {c.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
