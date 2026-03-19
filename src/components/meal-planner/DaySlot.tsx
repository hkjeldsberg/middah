'use client'

import { useState, useRef, useEffect } from 'react'
import type { MealPlanDay } from '@/types'

const WEEKDAYS = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']

interface DaySlotProps {
  day: MealPlanDay
  isSwapSource: boolean
  isSwapMode: boolean
  isLoading: boolean
  onSkip: () => void
  onSwapStart: () => void
  onSwapConfirm: () => void
  onRegenerate: () => void
  onGenerateRecipe: () => void
  onEditTitle: (newTitle: string) => void
}

export default function DaySlot({
  day,
  isSwapSource,
  isSwapMode,
  isLoading,
  onSkip,
  onSwapStart,
  onSwapConfirm,
  onRegenerate,
  onGenerateRecipe,
  onEditTitle,
}: DaySlotProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isSkipped = day.status === 'skipped'
  const isEmpty = day.status === 'empty'
  const isSuggested = day.status === 'suggested'

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  const startEdit = () => {
    setEditValue(day.mealTitle ?? '')
    setEditing(true)
    setMenuOpen(false)
  }

  const commitEdit = () => {
    setEditing(false)
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== day.mealTitle) onEditTitle(trimmed)
  }

  const handleMenuAction = (fn: () => void) => {
    setMenuOpen(false)
    fn()
  }

  const handleCardClick = () => {
    if (isSwapMode && !isSwapSource) onSwapConfirm()
  }

  return (
    <div
      className={`relative p-4 rounded-xl border transition-colors min-h-[120px] flex flex-col ${
        isSwapSource
          ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-900'
          : isSwapMode
          ? 'border-dashed border-gray-400 cursor-pointer hover:border-gray-900'
          : isSkipped
          ? 'border-gray-200 bg-gray-50 opacity-60'
          : 'border-gray-200 bg-white'
      }`}
      onClick={handleCardClick}
    >
      {/* Weekday label */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {WEEKDAYS[day.weekday]}
      </p>

      {/* Content */}
      <div className="flex-1">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        ) : isSkipped ? (
          <p className="text-sm text-gray-400 italic">Hoppet over</p>
        ) : isEmpty ? (
          <p className="text-sm text-gray-400">Ingen middag valgt</p>
        ) : editing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') setEditing(false)
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm font-medium text-gray-900 bg-transparent border-b border-gray-400 focus:outline-none focus:border-gray-900 leading-snug pr-6"
          />
        ) : (
          <p
            className="text-sm font-medium text-gray-900 leading-snug cursor-text hover:underline decoration-dotted pr-6"
            onClick={(e) => { e.stopPropagation(); if (!isSwapMode) startEdit() }}
            title="Klikk for å redigere"
          >
            {day.mealTitle}
          </p>
        )}
      </div>

      {/* Swap hint */}
      {isSwapMode && !isSwapSource && !isSkipped && (
        <p className="text-xs text-gray-500 mt-2">Klikk for å bytte</p>
      )}

      {/* Action menu — only when not in swap mode and not skipped */}
      {!isSwapMode && !isLoading && !isSkipped && (
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Handlinger"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-9 z-20 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm">
                {isSuggested && (
                  <button
                    onClick={() => handleMenuAction(startEdit)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    Rediger tittel
                  </button>
                )}
                <button
                  onClick={() => handleMenuAction(onRegenerate)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  Regenerer
                </button>
                {isSuggested && (
                  <button
                    onClick={() => handleMenuAction(onSwapStart)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    Bytt dag
                  </button>
                )}
                {isSuggested && (
                  <button
                    onClick={() => handleMenuAction(onGenerateRecipe)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    Lag oppskrift
                  </button>
                )}
                <button
                  onClick={() => handleMenuAction(onSkip)}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                >
                  Hopp over
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
