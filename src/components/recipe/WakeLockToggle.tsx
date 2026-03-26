'use client'

import { useWakeLock } from '@/hooks/useWakeLock'

export default function WakeLockToggle() {
  const { isActive, isSupported, toggle } = useWakeLock()

  if (!isSupported) {
    return (
      <p className="text-xs text-gray-400">
        Hold skjermen på støttes ikke på denne enheten
      </p>
    )
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-colors ${
        isActive
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-600'
      }`}
      aria-pressed={isActive}
      aria-label="Hold skjermen på"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      {isActive ? 'Skjerm på' : 'Behold skjermen på'}
    </button>
  )
}
