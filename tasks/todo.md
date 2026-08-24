# Instagram-reel → oppskrift (import-side)

## Mål
Sub-side `/recipes/import` som tar en Instagram reel-URL + valgfrie egendefinerte
instruksjoner, henter reel-beskrivelsen med yt-dlp, lar Claude bygge en oppskrift,
viser forhåndsvisning, genererer bilde på forespørsel, og lar bruker lagre eller forkaste.

## Oppgaver
- [x] `src/lib/reel.ts` — yt-dlp-wrapper (execFile, ingen shell), URL-validering, binærsøk
- [x] `src/lib/ai/claude.ts` — `extractRecipeFromText(sourceText, instructions)`
- [x] `src/lib/ai/image.ts` — la bildeprompt bruke beskrivelse i tillegg til tittel
- [x] `src/lib/generatedToRecipe.ts` — flytt ut delt mapper (brukes av preview + import)
- [x] `src/app/api/recipes/import/extract/route.ts` — POST {url, instructions}
- [x] `src/app/api/recipes/import/image/route.ts` — POST {name, description}
- [x] `src/app/recipes/import/page.tsx` — steg-UI: skjema → forhåndsvisning → bilde → lagre
- [x] Inngang fra forsiden (knapp ved siden av "+ Ny oppskrift")
- [x] `npm run typecheck` + `npm run lint`

## Designvalg
- yt-dlp kjøres via `execFile` med argument-array — ingen shell-interpolering.
- URL valideres mot streng Instagram-regex før den sendes til yt-dlp.
- Binær løses: `YTDLP_PATH` → `<repo>/.venv/bin/yt-dlp` → `yt-dlp` på PATH.
- Bilde genereres *etter* forhåndsvisning (brukerens ønskede rekkefølge) og bruker
  oppskriftens navn + beskrivelse som prompt — bedre treff enn tittel alene.
- Ingenting lagres i Supabase før brukeren trykker "Lagre".
- Uttrekk bruker `claude-opus-5`. Merk: adaptiv tenkning er på som standard,
  så svaret må plukke ut *text*-blokken, ikke `content[0]`.

## Review

Alt implementert. `npm run typecheck` er grønn. `npm run lint` er brutt fra før
(eslint-config-next klarer ikke å patche ESLint 9) — urelatert til denne endringen.

Verifisert:
- `claude-opus-5` fungerer på SDK 0.39.0, og svaret starter med en `thinking`-blokk.
  Derfor plukker `firstText()` ut text-blokken i stedet for `content[0]` — uten det
  hadde uttrekket kastet «Ugyldig svar fra AI» hver gang.
- `extractRecipeFromText` kjørt mot en realistisk reel-caption med instruksjonen
  «gjør den vegetarisk-vennlig og skaler til 2 porsjoner»: riktig halvering av alle
  mengder, parmesan byttet til vegetarisk variant, alle {tokens} matcher
  ingredient_key, salt/pepper fikk amount 0.
- `/recipes/import` svarer 200.
- Ugyldig lenke → norsk valideringsfeil, yt-dlp kjøres aldri.
- Gyldig lenkeformat → yt-dlp kjøres fra `.venv/bin/`, og Instagrams
  innloggingskrav mappes til en beskjed som forteller hvilken env-variabel som mangler.

Ikke verifisert (krever en ekte, offentlig reel-URL): hele kjeden fra lenke til
lagret oppskrift. Instagram svarte med innloggingskrav på test-ID-en.

## Kjente begrensninger
- Virker lokalt. På Vercel finnes ikke yt-dlp-binæren, så `/recipes/import` vil
  feile der med «Fant ikke yt-dlp».
- Oppskrifter som ligger i en festet kommentar i stedet for beskrivelsen hentes ikke
  automatisk. Feilmeldingen ber brukeren lime teksten inn i instruksjonsfeltet.
- `@anthropic-ai/sdk` står på 0.39.0. Den er gammel nok til at `output_config`
  (effort, structured outputs) ikke finnes, så uttrekket bruker samme
  prompt-og-parse-mønster som resten av kodebasen.


---

# Bildegenerering: OpenAI → Gemini

OPENAI_API_KEY er utgått. Byttet til Google Gemini.

## Oppgaver
- [x] Research gjeldende Gemini-bilde-API (modell-ID-er, pakke, responsform)
- [x] `@google/genai` installert, `openai` fjernet
- [x] `src/lib/ai/image.ts` skrevet om
- [x] `.env.local.example` oppdatert (Gemini + yt-dlp-variabler)
- [x] pnpm-lock.yaml synket (npm i rørte bare package-lock.json)
- [x] `npm run typecheck`

## Designvalg
- **Imagen er avviklet** — nedstengt 2026-08-17. Bruker Nano Banana-familien.
- Modell `gemini-3.1-flash-image` (GA), 1K, sideforhold 4:3. Hero-bildet rendres
  fullbredde og beskjæres, så landskap kaster bort mindre enn DALL-E-kvadratet.
  Bytt til `gemini-3.1-flash-lite-image` for halv pris hvis kvaliteten holder.
- Interactions-API (`genai.interactions.create`), ikke det som docs merker
  «Generate Content API (Legacy)». Bekreftet mot `dist/genai.d.ts` at feltene
  faktisk er snake_case (`response_format`, `mime_type`, `aspect_ratio`) —
  uvanlig for SDK-en, og TypeDoc-siden for dette var 404.
- JPEG framfor PNG: mindre filer, og `ImageResponseFormatMimeType` i typings
  tilbyr bare `image/jpeg`. Filnavn og contentType følger faktisk mime_type
  i svaret framfor å hardkode `.png` som DALL-E-varianten gjorde.
- Signaturen på `generateAndUploadRecipeImage` er uendret, så begge kallstedene
  (import-ruten og meal-planner-ruten) er urørt.

## Verifisert
- Payloaden godtas av Google: med ugyldig nøkkel svarer API-et
  `API_KEY_INVALID` / `INVALID_ARGUMENT`, altså feiler den først på auth.
- Uten nøkkel returnerer ruten 502 med norsk feilmelding, ingen krasj.
- `npm run typecheck` grønn. Ingen referanser til openai igjen i src/.
- Begge lockfiler konsistente: openai borte, @google/genai inne.

## Ikke verifisert
- Et faktisk generert bilde. Krever en gyldig GEMINI_API_KEY, som ikke finnes
  i .env.local enda. Hent på aistudio.google.com/apikey.
- Kjent åpen bug (js-genai #1461): `gemini-3.1-flash-image` har ignorert
  image_size og alltid returnert 1K. Vi ber om 1K, så det er uten betydning her.

## Merk
- Alle Gemini-bilder har usynlig SynthID-vannmerke.
- Pris ~$0.067 per bilde på 1K (lite-modellen: ~$0.034). DALL-E standard var $0.04.


---

# Fjernet AI-bildegenerering, byttet til opplasting

Gemini bildegenerering har `limit: 0` på gratisnivå — ingen kvote uten fakturering.
Testet alle fire bildemodeller via begge API-veier, samme 429 overalt. Fjernet
funksjonen framfor å kreve fakturering.

## Oppgaver
- [x] Slettet `src/lib/ai/image.ts` og `/api/recipes/import/image`
- [x] Fjernet bildegenerering fra meal-planner-ruten (ikke lenger Promise.all)
- [x] `WeekView` og forhåndsvisningssiden sluttet å vente på imagePath
- [x] `ImagePicker` — filvelger med lokal forhåndsvisning før lagring
- [x] `uploadRecipeImage()` — laster opp etter lagring, når oppskriften har id
- [x] Koblet inn på både import-siden og meal-planner-forhåndsvisningen
- [x] `CookingLoader` — putrende kjele med damp, bobler og faseteksesr
- [x] Fjernet `@google/genai`, ryddet `.env.local.example`, synket begge lockfiler
- [x] `npm run typecheck` + `npm run build`

## Designvalg
- Ingen nytt opplastingsendepunkt. `/api/recipes/[id]/image` finnes allerede, og
  `/recipes/new` gjorde allerede lagre-så-last-opp. Import- og
  forhåndsvisningssidene speiler nøyaktig det mønsteret.
- «Senere» krevde ingen kode — RecipeForm på redigeringssiden har filvelger fra før.
- Opplasting er best-effort: feiler den, beholder brukeren oppskriften de nettopp
  lagret framfor å miste alt.
- `recipeToCreatePayload` mistet imagePath-argumentet — ingenting produserer et
  slikt path lenger, bildet kommer i et eget kall etterpå.
- Loaderen holder på siste melding framfor å loope. Looping leser som «henger».
- Sveipe-bar framfor prosenttall: vi vet ikke reell framdrift, så vi later ikke som.

## Verifisert
- `npm run build` rent. `/api/recipes/import/image` er borte fra rutelista.
- Tailwind genererte faktisk alle fire @keyframes og animate-klasser — dette er
  det som feiler stille hvis keyframes mangler i configen.
- CookingLoader rendrer: 3 dampvirvler, 3 bobler, kjele, sveipe-bar, første
  statustekst, role="status".
- Ingen referanser til genai/gemini/generateAndUploadRecipeImage igjen i src/.
- Begge lockfiler rene for openai og @google/genai.

## Ikke verifisert
- Klikket gjennom flyten i nettleser. Chrome-utvidelsen var ikke tilkoblet, så
  animasjonen er verifisert via SSR-markup og generert CSS, ikke visuelt i bevegelse.
- Faktisk bildeopplasting fra import-siden ende-til-ende (krever en reel som
  Instagram gir oss uten innlogging).
