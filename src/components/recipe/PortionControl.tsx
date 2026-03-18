'use client'

interface PortionControlProps {
  value: number
  onChange: (value: number) => void
}

export default function PortionControl({ value, onChange }: PortionControlProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Porsjoner:</span>
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Færre porsjoner"
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-semibold tabular-nums">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Flere porsjoner"
        >
          +
        </button>
      </div>
    </div>
  )
}
