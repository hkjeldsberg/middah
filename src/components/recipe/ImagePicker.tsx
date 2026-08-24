'use client'

import { useEffect, useState } from 'react'

interface ImagePickerProps {
  file: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}

/**
 * Picks a local image file and previews it before the recipe exists in the
 * database. The file is uploaded after the recipe is saved, once it has an id.
 */
export default function ImagePicker({ file, onChange, disabled = false }: ImagePickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <div className="space-y-2">
      <label htmlFor="recipe-image" className="block text-sm font-medium text-gray-700">
        Bilde <span className="text-gray-400">(valgfritt)</span>
      </label>

      {previewUrl ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Valgt bilde"
            className="w-32 h-24 object-cover rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Fjern
          </button>
        </div>
      ) : (
        <input
          id="recipe-image"
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-900 file:text-white hover:file:bg-gray-700 disabled:opacity-50"
        />
      )}

      <p className="text-xs text-gray-500">
        Du kan også legge til bilde senere ved å redigere oppskriften.
      </p>
    </div>
  )
}
