'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex items-center h-14 gap-6">
        <Link
          href="/"
          className="text-lg font-semibold text-gray-900 hover:text-gray-600 transition-colors"
        >
          Middah
        </Link>
        <div className="flex gap-2">
          <Link
            href="/"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === '/'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Oppskrifter
          </Link>
          <Link
            href="/meal-planner"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === '/meal-planner'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Middagsplan
          </Link>
        </div>
      </div>
    </nav>
  )
}
