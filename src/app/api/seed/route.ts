import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { SEED_MAPPINGS, type RawRecipeJson } from '@/lib/seed'
import { readFileSync } from 'fs'
import path from 'path'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Ikke tilgjengelig i produksjon' }, { status: 403 })
  }

  const recipesPath = path.join(process.cwd(), 'src', 'recipe-data', 'recipes.json')
  const imagesDir = path.join(process.cwd(), 'src', 'recipe-data', 'recipes-img')

  let rawRecipes: RawRecipeJson[]
  try {
    rawRecipes = JSON.parse(readFileSync(recipesPath, 'utf-8'))
  } catch {
    return NextResponse.json({ error: 'Kunne ikke lese recipes.json' }, { status: 500 })
  }

  let seeded = 0

  for (let sortIndex = 0; sortIndex < rawRecipes.length; sortIndex++) {
    const raw = rawRecipes[sortIndex]
    const mapping = SEED_MAPPINGS[raw.id] ?? { category: 'middag', protein_source: 'annet' }

    // Insert recipe
    const { data: recipe, error: recipeErr } = await supabaseServer
      .from('recipes')
      .insert({
        name: raw.name,
        description: raw.description,
        servings: raw.servings,
        prep_time: raw.prepTime,
        category: mapping.category,
        protein_source: mapping.protein_source,
        source: 'manual',
        sort_order: sortIndex,
      })
      .select()
      .single()

    if (recipeErr || !recipe) continue

    const recipeId: string = recipe.id

    // Upload image
    const imagePath = path.join(imagesDir, `${raw.id}.png`)
    try {
      const imgBuffer = readFileSync(imagePath)
      const storagePath = `recipes/${recipeId}.png`
      await supabaseServer.storage
        .from('recipe-images')
        .upload(storagePath, imgBuffer, { contentType: 'image/png', upsert: true })
      await supabaseServer
        .from('recipes')
        .update({ image_path: storagePath })
        .eq('id', recipeId)
    } catch {
      // Image not critical — continue
    }

    // Insert ingredient groups
    const ingredientGroupNames = Object.keys(raw.ingredients)
    for (let gi = 0; gi < ingredientGroupNames.length; gi++) {
      const groupName = ingredientGroupNames[gi]
      const { data: ig } = await supabaseServer
        .from('ingredient_groups')
        .insert({ recipe_id: recipeId, name: groupName, display_order: gi })
        .select()
        .single()
      if (!ig) continue

      const ings = raw.ingredients[groupName]
      await supabaseServer.from('ingredients').insert(
        ings.map((ing, ii) => ({
          group_id: ig.id,
          ingredient_key: ing.id,
          display_name: ing.ingredient,
          amount: ing.amount,
          unit: ing.unit,
          display_order: ii,
        }))
      )
    }

    // Insert instruction groups
    for (let gi = 0; gi < raw.instructions.length; gi++) {
      const group = raw.instructions[gi]
      const { data: ig } = await supabaseServer
        .from('instruction_groups')
        .insert({ recipe_id: recipeId, name: group.name, display_order: gi })
        .select()
        .single()
      if (!ig) continue

      await supabaseServer.from('instruction_steps').insert(
        group.instructions.map((text, si) => ({
          group_id: ig.id,
          step_order: si,
          text,
        }))
      )
    }

    seeded++
  }

  return NextResponse.json({ seeded })
}
