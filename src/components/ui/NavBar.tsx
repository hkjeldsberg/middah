'use client'

import Link from 'next/link'

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-center h-14">
        <Link
          href="/"
          className="flex items-center justify-center font-serif text-3xl font-semibold text-gray-900 hover:text-gray-600 transition-colors"
        >
          Middah.
        </Link>
      </div>
    </nav>
  )
}
