'use client'

import { useState, useRef } from 'react'
import { normalizeIngredientKey } from '@/lib/scaling'

const CATEGORIES = [
  { value: 'middag', label: 'Middag' },
  { value: 'forrett', label: 'Forrett' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'frokost', label: 'Frokost' },
  { value: 'lunsj', label: 'Lunsj' },
  { value: 'bakst', label: 'Bakst' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'suppe', label: 'Suppe' },
]

const PROTEINS = [
  { value: 'kylling', label: 'Kylling' },
  { value: 'storfe', label: 'Storfe' },
  { value: 'svin', label: 'Svin' },
  { value: 'fisk', label: 'Fisk / Sjømat' },
  { value: 'vegetar', label: 'Vegetar' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'lam', label: 'Lam' },
  { value: 'annet', label: 'Annet' },
]

interface IngredientRow {
  ingredientKey: string
  displayName: string
  amount: string
  unit: string
}

interface IngredientGroupState {
  name: string
  ingredients: IngredientRow[]
}

interface InstructionRow {
  text: string
}

interface InstructionGroupState {
  name: string
  steps: InstructionRow[]
}

export interface RecipeFormData {
  name: string
  description: string
  category: string
  proteinSource: string
  servings: 2 | 4
  prepTime: string
  ingredientGroups: IngredientGroupState[]
  instructionGroups: InstructionGroupState[]
  imageFile: File | null
}

interface RecipeFormProps {
  initialData?: Partial<RecipeFormData>
  onSubmit: (data: RecipeFormData) => Promise<void>
  isSubmitting?: boolean
  submitLabel?: string
}

function defaultIngredientGroup(): IngredientGroupState {
  return { name: '', ingredients: [{ ingredientKey: '', displayName: '', amount: '', unit: '' }] }
}

function defaultInstructionGroup(): InstructionGroupState {
  return { name: '', steps: [{ text: '' }] }
}

export default function RecipeForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Lagre oppskrift',
}: RecipeFormProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [category, setCategory] = useState(initialData?.category ?? 'middag')
  const [proteinSource, setProteinSource] = useState(initialData?.proteinSource ?? 'kylling')
  const [servings, setServings] = useState<2 | 4>(initialData?.servings ?? 2)
  const [prepTime, setPrepTime] = useState(initialData?.prepTime ?? '')
  const [ingredientGroups, setIngredientGroups] = useState<IngredientGroupState[]>(
    initialData?.ingredientGroups ?? [defaultIngredientGroup()]
  )
  const [instructionGroups, setInstructionGroups] = useState<InstructionGroupState[]>(
    initialData?.instructionGroups ?? [defaultInstructionGroup()]
  )
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      name, description, category, proteinSource, servings, prepTime,
      ingredientGroups, instructionGroups, imageFile,
    })
  }

  // Ingredient group helpers
  const updateIngredient = (gi: number, ii: number, field: keyof IngredientRow, value: string) => {
    const updated = ingredientGroups.map((g, gIdx) =>
      gIdx !== gi ? g : {
        ...g,
        ingredients: g.ingredients.map((ing, iIdx) =>
          iIdx !== ii ? ing : { ...ing, [field]: value }
        ),
      }
    )
    // Auto-fill ingredientKey from displayName
    if (field === 'displayName') {
      const key = normalizeIngredientKey(value)
      updated[gi].ingredients[ii].ingredientKey = key
    }
    setIngredientGroups(updated)
  }

  const addIngredient = (gi: number) => {
    setIngredientGroups(g => g.map((group, i) =>
      i !== gi ? group : { ...group, ingredients: [...group.ingredients, { ingredientKey: '', displayName: '', amount: '', unit: '' }] }
    ))
  }

  const removeIngredient = (gi: number, ii: number) => {
    setIngredientGroups(g => g.map((group, i) =>
      i !== gi ? group : { ...group, ingredients: group.ingredients.filter((_, idx) => idx !== ii) }
    ))
  }

  const addIngredientGroup = () => setIngredientGroups(g => [...g, defaultIngredientGroup()])
  const removeIngredientGroup = (gi: number) => setIngredientGroups(g => g.filter((_, i) => i !== gi))

  // Instruction group helpers
  const updateStep = (gi: number, si: number, value: string) => {
    setInstructionGroups(g => g.map((group, i) =>
      i !== gi ? group : { ...group, steps: group.steps.map((s, idx) => idx !== si ? s : { text: value }) }
    ))
  }

  const addStep = (gi: number) => {
    setInstructionGroups(g => g.map((group, i) =>
      i !== gi ? group : { ...group, steps: [...group.steps, { text: '' }] }
    ))
  }

  const removeStep = (gi: number, si: number) => {
    setInstructionGroups(g => g.map((group, i) =>
      i !== gi ? group : { ...group, steps: group.steps.filter((_, idx) => idx !== si) }
    ))
  }

  const addInstructionGroup = () => setInstructionGroups(g => [...g, defaultInstructionGroup()])
  const removeInstructionGroup = (gi: number) => setInstructionGroups(g => g.filter((_, i) => i !== gi))

  const inputClass = 'w-full h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic info */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Grunnleggende info</h2>

        <div>
          <label className={labelClass} htmlFor="name">Navn *</label>
          <input id="name" required value={name} onChange={e => setName(e.target.value)} className={inputClass} placeholder="Oppskriftens navn" />
        </div>

        <div>
          <label className={labelClass} htmlFor="description">Beskrivelse</label>
          <textarea id="description" value={description} onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            rows={2} placeholder="Kort beskrivelse" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass} htmlFor="category">Kategori *</label>
            <select id="category" required value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="protein">Proteinkilde *</label>
            <select id="protein" required value={proteinSource} onChange={e => setProteinSource(e.target.value)} className={inputClass}>
              {PROTEINS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Porsjoner *</label>
            <div className="flex gap-3">
              {([2, 4] as const).map(n => (
                <label key={n} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value={n} checked={servings === n} onChange={() => setServings(n)} className="accent-gray-900" />
                  <span className="text-sm">{n} porsjoner</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="prepTime">Tilberedningstid *</label>
            <input id="prepTime" required value={prepTime} onChange={e => setPrepTime(e.target.value)} className={inputClass} placeholder="f.eks. 30 min" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Bilde</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-900 file:text-white hover:file:bg-gray-700" />
        </div>
      </section>

      {/* Ingredient groups */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Ingredienser</h2>
          <button type="button" onClick={addIngredientGroup}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
            + Legg til gruppe
          </button>
        </div>

        {ingredientGroups.map((group, gi) => (
          <div key={gi} className="mb-6 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <input value={group.name} onChange={e => setIngredientGroups(g => g.map((x, i) => i !== gi ? x : { ...x, name: e.target.value }))}
                className="flex-1 h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder={`Gruppenavn (f.eks. Saus)`} />
              {ingredientGroups.length > 1 && (
                <button type="button" onClick={() => removeIngredientGroup(gi)} className="text-red-500 hover:text-red-700 text-sm">Fjern</button>
              )}
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-1 text-xs text-gray-500 px-1">
                <span className="col-span-4">Navn</span>
                <span className="col-span-3">Mengde</span>
                <span className="col-span-3">Enhet</span>
                <span className="col-span-2" />
              </div>
              {group.ingredients.map((ing, ii) => (
                <div key={ii} className="grid grid-cols-12 gap-1">
                  <input value={ing.displayName} onChange={e => updateIngredient(gi, ii, 'displayName', e.target.value)}
                    className="col-span-4 h-9 px-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="Ingrediens" />
                  <input type="number" min="0" step="0.1" value={ing.amount} onChange={e => updateIngredient(gi, ii, 'amount', e.target.value)}
                    className="col-span-3 h-9 px-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="0" />
                  <input value={ing.unit} onChange={e => updateIngredient(gi, ii, 'unit', e.target.value)}
                    className="col-span-3 h-9 px-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="g / stk" />
                  <button type="button" onClick={() => removeIngredient(gi, ii)}
                    className="col-span-2 h-9 text-gray-400 hover:text-red-500 text-lg leading-none">×</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addIngredient(gi)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-900">+ Legg til ingrediens</button>
          </div>
        ))}
      </section>

      {/* Instruction groups */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Fremgangsmåte</h2>
          <button type="button" onClick={addInstructionGroup}
            className="text-sm text-gray-600 hover:text-gray-900">+ Legg til seksjon</button>
        </div>

        {instructionGroups.map((group, gi) => (
          <div key={gi} className="mb-6 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <input value={group.name} onChange={e => setInstructionGroups(g => g.map((x, i) => i !== gi ? x : { ...x, name: e.target.value }))}
                className="flex-1 h-9 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Seksjonsnavn (f.eks. Saus)" />
              {instructionGroups.length > 1 && (
                <button type="button" onClick={() => removeInstructionGroup(gi)} className="text-red-500 hover:text-red-700 text-sm">Fjern</button>
              )}
            </div>

            <div className="space-y-2">
              {group.steps.map((step, si) => (
                <div key={si} className="flex gap-2">
                  <span className="mt-2 text-sm text-gray-400 w-5 text-right shrink-0">{si + 1}.</span>
                  <textarea value={step.text} onChange={e => updateStep(gi, si, e.target.value)}
                    className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
                    rows={2} placeholder="Beskriv steget… Bruk {ingrediensnøkkel} for skalering" />
                  {group.steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(gi, si)}
                      className="mt-1 text-gray-400 hover:text-red-500 text-lg leading-none h-9">×</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addStep(gi)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-900">+ Legg til steg</button>
          </div>
        ))}
      </section>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? 'Lagrer…' : submitLabel}
      </button>
    </form>
  )
}
