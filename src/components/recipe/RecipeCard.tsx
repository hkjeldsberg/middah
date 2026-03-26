import Link from 'next/link'
import Image from 'next/image'
import type { Recipe } from '@/types'

interface RecipeCardProps {
  recipe: Recipe
}

function getImageUrl(imagePath: string | null): string {
  if (!imagePath) return '/placeholder-recipe.svg'
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/recipe-images/${imagePath}`
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group block rounded-xl overflow-hidden border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all bg-white"
    >
      <div className="relative w-full aspect-[4/3] bg-gray-100">
        <Image
          src={getImageUrl(recipe.imagePath)}
          alt={recipe.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-recipe.svg'
          }}
        />
      </div>
      <div className="p-3">
        <h3 className="font-serif font-semibold text-gray-900 leading-tight line-clamp-2 mb-1 group-hover:text-gray-600 transition-colors">
          {recipe.name}
        </h3>
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {recipe.prepTime}
        </p>
      </div>
    </Link>
  )
}
