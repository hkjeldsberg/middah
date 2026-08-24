#!/usr/bin/env node
// Importerer oppskrifter fra enkle tekstfiler til Middah.
//
//   node scripts/add-recipe.mjs oppskrifter/*.txt
//   node scripts/add-recipe.mjs --dry oppskrifter/kjottboller.txt
//
// Krever at `npm run dev` kjører (eller sett MIDDAH_URL mot produksjon).

import { readFile } from 'node:fs/promises'
import { basename, dirname, extname, resolve } from 'node:path'

const BASE_URL = (process.env.MIDDAH_URL ?? 'http://localhost:3000').replace(/\/$/, '')

const CATEGORIES = ['middag', 'forrett', 'dessert', 'frokost', 'lunsj', 'bakst', 'snacks', 'suppe']
const PROTEINS = ['kylling', 'storfe', 'svin', 'fisk', 'vegetar', 'vegan', 'lam', 'annet']

// Måleenheter som gjenkjennes rett etter mengden.
const UNITS = new Set([
  'g', 'gram', 'kg', 'hg', 'mg',
  'ml', 'cl', 'dl', 'l', 'liter',
  'ss', 'ts', 'kryddermål', 'krm',
  'stk', 'boks', 'bokser', 'pk', 'pakke', 'pakker', 'pose', 'poser',
  'fedd', 'neve', 'never', 'klype', 'klyper', 'bunt', 'kopp', 'kopper',
  'skive', 'skiver', 'ark', 'plate', 'plater', 'porsjon', 'porsjoner',
  'boksen', 'glass', 'flaske', 'flasker', 'terning', 'terninger',
])

const FRACTIONS = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75,
  '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1 / 6, '⅛': 0.125,
}

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
}

// Må holdes i synk med normalizeIngredientKey i src/lib/scaling.ts
function normalizeIngredientKey(value) {
  return value
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function parseAmount(token) {
  if (!token) return null
  const t = token.replace(',', '.')
  if (FRACTIONS[t] !== undefined) return FRACTIONS[t]
  const range = t.match(/^(\d+(?:\.\d+)?)\s*[-–]\s*\d+(?:\.\d+)?$/)
  if (range) return Number(range[1])
  const frac = t.match(/^(\d+)\/(\d+)$/)
  if (frac) return Number(frac[1]) / Number(frac[2])
  if (/^\d+(?:\.\d+)?$/.test(t)) return Number(t)
  return null
}

function capitalize(s) {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1)
}

// "400 g kjøttdeig" -> { amount: 400, unit: 'g', displayName: 'Kjøttdeig' }
// "salt og pepper"  -> { amount: 0, unit: '', displayName: 'Salt og pepper' }
function parseIngredient(line) {
  // Tillat sammenskrevet mengde og enhet: "300g" -> "300 g"
  const tokens = line.replace(/^(\d+(?:[.,]\d+)?)([a-zæøå]+)\b/i, '$1 $2').split(/\s+/)
  let i = 0
  let amount = parseAmount(tokens[0])

  if (amount !== null) {
    i = 1
    // Blandet tall: "1 1/2 dl fløte"
    const extra = parseAmount(tokens[1])
    if (extra !== null && extra < 1 && Number.isInteger(amount)) {
      amount += extra
      i = 2
    }
  } else {
    return { amount: 0, unit: '', displayName: capitalize(line) }
  }

  let unit = ''
  const maybeUnit = (tokens[i] ?? '').replace(/\.$/, '').toLowerCase()
  if (UNITS.has(maybeUnit) && tokens.length > i + 1) {
    unit = maybeUnit
    i += 1
  }

  const displayName = tokens.slice(i).join(' ')
  if (!displayName) throw new Error(`Mangler navn på ingrediens: "${line}"`)

  return { amount, unit, displayName: capitalize(displayName) }
}

const HEADER_ALIASES = {
  navn: 'name', name: 'name',
  beskrivelse: 'description', description: 'description',
  kategori: 'category', category: 'category',
  proteinkilde: 'protein', protein: 'protein', protein_source: 'protein',
  porsjoner: 'servings', servings: 'servings',
  tid: 'prepTime', preptime: 'prepTime', prep_time: 'prepTime',
  bilde: 'image', image: 'image',
}

const SECTIONS = {
  ingredienser: 'ingredients', ingredients: 'ingredients',
  fremgangsmåte: 'steps', fremgangsmate: 'steps', instruksjoner: 'steps',
  steps: 'steps', instructions: 'steps',
}

function parseRecipeFile(text, filePath) {
  const meta = {}
  const ingredientGroups = []
  const instructionGroups = []

  let section = null
  let group = null

  const lines = text.split(/\r?\n/)

  for (const [index, raw] of lines.entries()) {
    const line = raw.trim()
    const where = `${basename(filePath)}:${index + 1}`

    if (!line || line.startsWith('//')) continue

    const sectionMatch = line.match(/^\[(.+)\]$/)
    if (sectionMatch) {
      const key = sectionMatch[1].trim().toLowerCase()
      section = SECTIONS[key]
      if (!section) throw new Error(`${where}: ukjent seksjon "[${sectionMatch[1]}]"`)
      group = null
      continue
    }

    if (section === null) {
      const headerMatch = line.match(/^([\wåøæÅØÆ_]+)\s*:\s*(.*)$/)
      if (!headerMatch) throw new Error(`${where}: forventet "nøkkel: verdi", fikk "${line}"`)
      const key = HEADER_ALIASES[headerMatch[1].toLowerCase()]
      if (!key) throw new Error(`${where}: ukjent felt "${headerMatch[1]}"`)
      meta[key] = headerMatch[2].trim()
      continue
    }

    if (line.startsWith('#')) {
      const name = line.replace(/^#+\s*/, '').trim()
      group = { name, ingredients: [], steps: [] }
      ;(section === 'ingredients' ? ingredientGroups : instructionGroups).push(group)
      continue
    }

    if (!group) {
      group = {
        name: section === 'ingredients' ? 'Ingredienser' : 'Fremgangsmåte',
        ingredients: [],
        steps: [],
      }
      ;(section === 'ingredients' ? ingredientGroups : instructionGroups).push(group)
    }

    if (section === 'ingredients') {
      try {
        group.ingredients.push(parseIngredient(line))
      } catch (err) {
        throw new Error(`${where}: ${err.message}`)
      }
    } else {
      group.steps.push({ text: line })
    }
  }

  // Validering
  const missing = ['name', 'category', 'protein'].filter((k) => !meta[k])
  if (missing.length > 0) throw new Error(`mangler påkrevde felt: ${missing.join(', ')}`)
  if (!CATEGORIES.includes(meta.category)) {
    throw new Error(`ugyldig kategori "${meta.category}". Gyldige: ${CATEGORIES.join(', ')}`)
  }
  if (!PROTEINS.includes(meta.protein)) {
    throw new Error(`ugyldig proteinkilde "${meta.protein}". Gyldige: ${PROTEINS.join(', ')}`)
  }
  if (ingredientGroups.length === 0) throw new Error('ingen ingredienser funnet')
  if (instructionGroups.length === 0) throw new Error('ingen fremgangsmåte funnet')

  const payload = {
    name: meta.name,
    description: meta.description || null,
    category: meta.category,
    protein_source: meta.protein,
    servings: meta.servings ? Number(meta.servings) : 4,
    prep_time: meta.prepTime || 'Ukjent',
    source: 'manual',
    ingredientGroups: ingredientGroups.map((g) => ({
      name: g.name,
      ingredients: g.ingredients.map((ing) => ({
        ingredientKey: normalizeIngredientKey(ing.displayName),
        displayName: ing.displayName,
        amount: ing.amount,
        unit: ing.unit,
      })),
    })),
    instructionGroups: instructionGroups.map((g) => ({ name: g.name, steps: g.steps })),
  }

  if (!Number.isFinite(payload.servings) || payload.servings < 1) {
    throw new Error(`ugyldig antall porsjoner: "${meta.servings}"`)
  }

  return { payload, image: meta.image ?? null }
}

// Advarer om {token} i fremgangsmåten som ikke matcher en ingrediens.
function checkTokens(payload) {
  const known = new Set()
  for (const g of payload.ingredientGroups) {
    for (const ing of g.ingredients) {
      known.add(normalizeIngredientKey(ing.ingredientKey))
      known.add(normalizeIngredientKey(ing.displayName))
    }
  }

  const unknown = new Set()
  for (const g of payload.instructionGroups) {
    for (const step of g.steps) {
      for (const [, token] of step.text.matchAll(/\{([^}]+)\}/g)) {
        if (!known.has(normalizeIngredientKey(token))) unknown.add(token)
      }
    }
  }
  return [...unknown]
}

async function uploadImage(recipeId, imagePath) {
  const buffer = await readFile(imagePath)
  const ext = extname(imagePath).toLowerCase()
  const file = new File([buffer], basename(imagePath), {
    type: MIME[ext] ?? 'application/octet-stream',
  })

  const form = new FormData()
  form.append('file', file)

  const res = await fetch(`${BASE_URL}/api/recipes/${recipeId}/image`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`bildeopplasting feilet (${res.status}): ${body}`)
  }
}

async function importFile(filePath, { dryRun }) {
  const text = await readFile(filePath, 'utf8')
  const { payload, image } = parseRecipeFile(text, filePath)

  const unknownTokens = checkTokens(payload)
  for (const token of unknownTokens) {
    console.warn(`  ⚠ {${token}} matcher ingen ingrediens — vises som råtekst`)
  }

  if (dryRun) {
    console.log(JSON.stringify({ ...payload, _image: image }, null, 2))
    return
  }

  const res = await fetch(`${BASE_URL}/api/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`POST /api/recipes feilet (${res.status}): ${body}`)
  }

  const recipe = await res.json()
  let imageNote = ''
  if (image) {
    await uploadImage(recipe.id, resolve(dirname(filePath), image))
    imageNote = ' + bilde'
  }

  const ingredientCount = payload.ingredientGroups.reduce((n, g) => n + g.ingredients.length, 0)
  const stepCount = payload.instructionGroups.reduce((n, g) => n + g.steps.length, 0)
  console.log(
    `  ✓ ${payload.name} — ${ingredientCount} ingredienser, ${stepCount} steg${imageNote}`
  )
  console.log(`    ${BASE_URL}/recipes/${recipe.id}`)
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry')
  const files = args.filter((a) => !a.startsWith('--'))

  if (files.length === 0) {
    console.error('Bruk: node scripts/add-recipe.mjs [--dry] <fil.txt> [fil2.txt ...]')
    process.exit(1)
  }

  let failed = 0
  for (const file of files) {
    console.log(`\n${file}`)
    try {
      await importFile(file, { dryRun })
    } catch (err) {
      failed += 1
      console.error(`  ✗ ${err.message}`)
    }
  }

  console.log(`\n${files.length - failed}/${files.length} importert.`)
  if (failed > 0) process.exit(1)
}

main()
