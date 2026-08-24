import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function generateMealTitles(
  cuisines: string[],
  count: number = 7
): Promise<string[]> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Generer ${count} ulike middagsforslag på norsk (bokmål). Bruk disse kjøkkenene som inspirasjon: ${cuisines.join(', ')}.

Svar kun med et JSON-objekt:
{"meals": ["Tittel 1", "Tittel 2", ...]}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Ugyldig svar fra AI')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Ugyldig JSON fra AI')

  const { meals } = JSON.parse(jsonMatch[0]) as { meals: string[] }
  return meals
}

export interface GeneratedRecipe {
  name: string
  description: string
  servings: number
  prep_time: string
  category: string
  protein_source: string
  ingredient_groups: {
    name: string
    ingredients: {
      ingredient_key: string
      display_name: string
      amount: number
      unit: string
    }[]
  }[]
  instruction_groups: {
    name: string
    steps: string[]
  }[]
}

export async function generateRecipe(mealTitle: string): Promise<GeneratedRecipe> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Generer en fullstendig oppskrift for "${mealTitle}" på norsk (bokmål).

Returner KUN et JSON-objekt med dette formatet:
{
  "name": "Oppskriftsnavn",
  "description": "Kort beskrivelse av retten",
  "servings": 4,
  "prep_time": "30 min",
  "category": "middag",
  "protein_source": "kylling",
  "ingredient_groups": [
    {
      "name": "Saus",
      "ingredients": [
        {"ingredient_key": "soyasaus", "display_name": "Soyasaus", "amount": 3, "unit": "ss"}
      ]
    }
  ],
  "instruction_groups": [
    {
      "name": "Saus",
      "steps": [
        "Bland {soyasaus} med de andre ingrediensene."
      ]
    }
  ]
}

Regler:
- ingredient_key: kun lowercase bokstaver og understrek, ingen mellomrom
- Bruk {ingredient_key} i instruksjoner for å referere til ingredienser
- category: én av: middag, forrett, dessert, frokost, lunsj, bakst, snacks, suppe
- protein_source: én av: kylling, storfe, svin, fisk, vegetar, vegan, lam, annet
- Kun JSON, ingen annen tekst`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Ugyldig svar fra AI')

  // Strip markdown code fences if present, then extract JSON object
  const stripped = content.text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`Ugyldig JSON fra AI: ${content.text.slice(0, 200)}`)

  return JSON.parse(jsonMatch[0]) as GeneratedRecipe
}

/**
 * Claude Opus 5 runs adaptive thinking by default, so the first content block is
 * usually a thinking block — always look up the text block explicitly.
 */
function firstText(message: Anthropic.Message): string {
  const block = message.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text') throw new Error('Ugyldig svar fra AI')
  return block.text
}

function parseRecipeJson(text: string): GeneratedRecipe {
  const stripped = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '')
  const jsonMatch = stripped.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error(`Ugyldig JSON fra AI: ${text.slice(0, 200)}`)

  const parsed = JSON.parse(jsonMatch[0]) as GeneratedRecipe & { error?: string }
  if (parsed.error) throw new NotARecipeError(parsed.error)
  return parsed
}

/** Thrown when the source text does not contain a recipe. */
export class NotARecipeError extends Error {}

/**
 * Turns free-form text (an Instagram reel description, a pasted caption, …) into
 * a recipe. `instructions` lets the user steer the result — scale it, swap an
 * ingredient, make it vegetarian, and so on.
 */
export async function extractRecipeFromText(
  sourceText: string,
  instructions?: string
): Promise<GeneratedRecipe> {
  const customBlock = instructions?.trim()
    ? `\n\nEGNE INSTRUKSJONER FRA BRUKEREN (disse har forrang over kildeteksten):\n"""\n${instructions.trim()}\n"""`
    : ''

  const message = await anthropic.messages.create({
    model: 'claude-opus-5',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `Du får rå tekst fra en Instagram-post eller reel. Trekk ut oppskriften og skriv den om til norsk (bokmål).

KILDETEKST:
"""
${sourceText}
"""${customBlock}

Returner KUN et JSON-objekt med dette formatet:
{
  "name": "Oppskriftsnavn",
  "description": "Kort beskrivelse av retten",
  "servings": 4,
  "prep_time": "30 min",
  "category": "middag",
  "protein_source": "kylling",
  "ingredient_groups": [
    {
      "name": "Saus",
      "ingredients": [
        {"ingredient_key": "soyasaus", "display_name": "Soyasaus", "amount": 3, "unit": "ss"}
      ]
    }
  ],
  "instruction_groups": [
    {
      "name": "Saus",
      "steps": [
        "Bland {soyasaus} med de andre ingrediensene."
      ]
    }
  ]
}

Regler:
- Oversett til norsk (bokmål) dersom kilden er på et annet språk.
- Ignorer støy: hashtags, emojier, «følg meg», lenker, kommentarer om videoen.
- Behold mengder slik de står i kilden. Regn om til metriske enheter (g, dl, ss, ts, stk).
- Mangler en mengde, anslå en rimelig verdi framfor å hoppe over ingrediensen.
- Bruk amount 0 for ingredienser uten mengde, som «salt og pepper etter smak».
- ingredient_key: kun små bokstaver a-å og understrek, ingen mellomrom eller tegnsetting.
- Hver {token} i en instruksjon MÅ matche en ingredient_key nøyaktig. Ingen tokens for
  ingredienser som ikke står i ingredient_groups.
- Del opp i grupper (f.eks. «Marinade», «Tilbehør») kun når kilden faktisk har det.
  Ellers én gruppe med tom streng som navn.
- category: én av: middag, forrett, dessert, frokost, lunsj, bakst, snacks, suppe
- protein_source: én av: kylling, storfe, svin, fisk, vegetar, vegan, lam, annet
- Finner du ingen oppskrift i teksten, returner {"error": "kort forklaring på norsk"}.
- Kun JSON, ingen annen tekst.`,
      },
    ],
  })

  return parseRecipeJson(firstText(message))
}
