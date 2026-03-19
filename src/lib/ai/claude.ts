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
