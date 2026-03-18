// Seed data mappings: back-fills category and protein_source for the 38 pre-existing recipes
// Key = recipe id from recipes.json
export const SEED_MAPPINGS: Record<number, { category: string; protein_source: string }> = {
  1:  { category: 'middag',  protein_source: 'kylling' },  // Wok med kylling
  2:  { category: 'middag',  protein_source: 'fisk' },     // Stekt Laks med Feta-salat
  3:  { category: 'middag',  protein_source: 'kylling' },  // Cæsarsalat med kylling og egg
  4:  { category: 'middag',  protein_source: 'fisk' },     // Ovnsbakt kveite i folie
  5:  { category: 'middag',  protein_source: 'storfe' },   // Lasagne
  6:  { category: 'middag',  protein_source: 'svin' },     // Dumplings
  7:  { category: 'suppe',   protein_source: 'svin' },     // Ramen
  8:  { category: 'middag',  protein_source: 'kylling' },  // Tiktok-pasta med kylling
  9:  { category: 'suppe',   protein_source: 'fisk' },     // Fiskesuppe
  10: { category: 'middag',  protein_source: 'vegetar' },  // Kremet pasta med sopp
  11: { category: 'middag',  protein_source: 'fisk' },     // Fiskeboller i hvit saus
  12: { category: 'middag',  protein_source: 'fisk' },     // Panert fisk og ertestuing
  13: { category: 'middag',  protein_source: 'svin' },     // Ovnsstekte koteletter og grønnsaker
  14: { category: 'middag',  protein_source: 'annet' },    // Kaldhevet Pizza (24t)
  15: { category: 'middag',  protein_source: 'fisk' },     // Laks med Mangosalat
  16: { category: 'middag',  protein_source: 'vegetar' },  // Linsegryte med Karri
  17: { category: 'middag',  protein_source: 'storfe' },   // Kjøttgryte med Grønnsaker
  18: { category: 'middag',  protein_source: 'storfe' },   // Kjøttboller og Potetmos
  19: { category: 'forrett', protein_source: 'vegetar' },  // Grillet Paprika med Kremost
  20: { category: 'middag',  protein_source: 'storfe' },   // Fylt Paprika
  21: { category: 'middag',  protein_source: 'kylling' },  // Grillet Kylling og Waldorfsalat
  22: { category: 'middag',  protein_source: 'kylling' },  // Baconsurret Kylling
  23: { category: 'middag',  protein_source: 'vegetar' },  // Eggepizza
  24: { category: 'middag',  protein_source: 'storfe' },   // Bakt søtpotet med bacon og kjøttdeig
  25: { category: 'middag',  protein_source: 'kylling' },  // Marry Me Chicken
  26: { category: 'middag',  protein_source: 'kylling' },  // Indisk à la Ece
  27: { category: 'middag',  protein_source: 'annet' },    // Wraps med Reinsdyrskav
  28: { category: 'suppe',   protein_source: 'vegetar' },  // Gulrot og søtpotetsuppe
  29: { category: 'bakst',   protein_source: 'vegetar' },  // Hjemmebakte knekkebrød
  30: { category: 'middag',  protein_source: 'storfe' },   // Biffsnadder med potetmos
  31: { category: 'suppe',   protein_source: 'fisk' },     // Fiskesuppe med reker og karri
  32: { category: 'suppe',   protein_source: 'vegetar' },  // Heimelaget Tomatsuppe
  33: { category: 'dessert', protein_source: 'vegetar' },  // Pistasjkuler med sjokoladetrekk
  34: { category: 'dessert', protein_source: 'vegetar' },  // Eplewrap med brunostsaus
  35: { category: 'suppe',   protein_source: 'kylling' },  // Tom Kha Gai
  36: { category: 'bakst',   protein_source: 'vegetar' },  // Surdeigsstarter og surdeigsbrød
  37: { category: 'middag',  protein_source: 'kylling' },  // Kyllingkebab i pita
  38: { category: 'middag',  protein_source: 'kylling' },  // Ovnsbakt kyllinglår
}

export interface RawRecipeJson {
  id: number
  name: string
  description: string
  servings: number
  prepTime: string
  ingredients: Record<string, {
    id: string
    ingredient: string
    amount: number
    unit: string
  }[]>
  instructions: {
    name: string
    instructions: string[]
  }[]
}
