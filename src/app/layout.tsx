import type { Metadata } from 'next'
import { Lora, Varela_Round } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/ui/NavBar'
import Footer from '@/components/ui/Footer'
import { SpeedInsights } from '@vercel/speed-insights/next'

const lora = Lora({ subsets: ['latin'], variable: '--font-serif' })
const varelaRound = Varela_Round({ subsets: ['latin'], weight: '400', variable: '--font-sans' })

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
    <html lang="no" className={`${lora.variable} ${varelaRound.variable}`}>
      <body className="font-sans min-h-screen flex flex-col bg-white text-gray-900 antialiased">
        <NavBar />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
          {children}
        </main>
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  )
}
