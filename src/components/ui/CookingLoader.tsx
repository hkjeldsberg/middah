'use client'

import { useEffect, useState } from 'react'

/** Roughly tracks the real phases: yt-dlp fetches the reel, then Claude reads it. */
const DEFAULT_STAGES = [
  'Åpner reelen…',
  'Leser beskrivelsen…',
  'Fisker ut ingrediensene…',
  'Regner om mengdene…',
  'Oversetter til norsk…',
  'Setter sammen stegene…',
  'Pynter på oppskriften…',
]

interface CookingLoaderProps {
  stages?: string[]
  /** How long each message stays up, in ms. */
  interval?: number
}

export default function CookingLoader({
  stages = DEFAULT_STAGES,
  interval = 4000,
}: CookingLoaderProps) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    // Hold on the last message rather than looping — looping reads as "stuck".
    const id = setInterval(() => {
      setStage((s) => (s < stages.length - 1 ? s + 1 : s))
    }, interval)
    return () => clearInterval(id)
  }, [stages.length, interval])

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 py-10"
      role="status"
      aria-live="polite"
    >
      <svg
        width="88"
        height="80"
        viewBox="0 0 88 80"
        fill="none"
        aria-hidden="true"
        className="overflow-visible"
      >
        {/* Steam */}
        <g stroke="currentColor" className="text-gray-400" strokeWidth="2.5" strokeLinecap="round">
          <path d="M30 26c-3-4 3-7 0-11" className="animate-steam" style={{ animationDelay: '0s' }} />
          <path d="M44 22c-3-5 3-8 0-13" className="animate-steam" style={{ animationDelay: '0.5s' }} />
          <path d="M58 26c-3-4 3-7 0-11" className="animate-steam" style={{ animationDelay: '1s' }} />
        </g>

        <g className="animate-simmer origin-bottom">
          {/* Handles */}
          <g stroke="currentColor" className="text-gray-800" strokeWidth="4" strokeLinecap="round">
            <path d="M14 44h-6" />
            <path d="M74 44h6" />
          </g>

          {/* Pot body */}
          <path
            d="M14 38h60v18a14 14 0 0 1-14 14H28a14 14 0 0 1-14-14V38z"
            fill="currentColor"
            className="text-gray-900"
          />

          {/* Rim */}
          <rect x="10" y="32" width="68" height="8" rx="4" fill="currentColor" className="text-gray-700" />

          {/* Bubbles just under the rim */}
          <g fill="currentColor" className="text-gray-500">
            <circle cx="30" cy="50" r="3" className="animate-bubble" style={{ animationDelay: '0s' }} />
            <circle cx="44" cy="53" r="4" className="animate-bubble" style={{ animationDelay: '0.55s' }} />
            <circle cx="58" cy="50" r="3" className="animate-bubble" style={{ animationDelay: '1.1s' }} />
          </g>
        </g>
      </svg>

      {/* Indeterminate sweep — we cannot know real progress, so do not fake a percentage. */}
      <div className="w-56 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-gray-900 rounded-full animate-sweep" />
      </div>

      <p className="text-sm text-gray-600 min-h-5 transition-opacity">{stages[stage]}</p>
    </div>
  )
}
