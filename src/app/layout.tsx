import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/ui/NavBar'
import Footer from '@/components/ui/Footer'

export const metadata: Metadata = {
  title: 'Middah – Oppskrifter og middagsplan',
  description: 'Organiser dine oppskrifter og planlegg ukens middager',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <body className="min-h-screen flex flex-col bg-white text-gray-900 antialiased">
        <NavBar />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
