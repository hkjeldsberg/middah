'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import RecipeCard from './RecipeCard'
import type { Recipe } from '@/types'

function SortableRecipeCard({ recipe }: { recipe: Recipe }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: recipe.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <RecipeCard recipe={recipe} />
    </div>
  )
}

interface RecipeGridProps {
  initialRecipes: Recipe[]
}

export default function RecipeGrid({ initialRecipes }: RecipeGridProps) {
  const [recipes, setRecipes] = useState(initialRecipes)

  useEffect(() => {
    setRecipes(initialRecipes)
  }, [initialRecipes])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = recipes.findIndex((r) => r.id === active.id)
      const newIndex = recipes.findIndex((r) => r.id === over.id)
      const reordered = arrayMove(recipes, oldIndex, newIndex)

      // Optimistic update
      setRecipes(reordered)

      // Persist to server
      const payload = reordered.map((r, i) => ({ id: r.id, sortOrder: i }))
      try {
        await fetch('/api/recipes/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } catch {
        // Revert on error
        setRecipes(recipes)
      }
    },
    [recipes]
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={recipes.map((r) => r.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <SortableRecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
