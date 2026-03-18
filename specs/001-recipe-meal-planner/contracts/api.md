# API Contracts: Recipe Manager & Meal Planner

**Branch**: `001-recipe-meal-planner` | **Phase**: 1 | **Date**: 2026-03-18

All endpoints are Next.js Route Handlers under `src/app/api/`. All responses are JSON.
All write operations use the Supabase service role key (server-side only).

---

## Recipes

### `GET /api/recipes`

List all recipes, optionally filtered and ordered.

**Query parameters**:
| Param           | Type   | Description                              |
|-----------------|--------|------------------------------------------|
| `category`      | string | Filter by category (e.g. `middag`)       |
| `proteinSource` | string | Filter by protein source (e.g. `kylling`)|

**Response `200`**:
```json
[
  {
    "id": "uuid",
    "name": "Wok med kylling",
    "description": "...",
    "servings": 2,
    "prepTime": "Under 30 min",
    "category": "middag",
    "proteinSource": "kylling",
    "imagePath": "recipes/uuid.png",
    "source": "manual",
    "sortOrder": 0,
    "createdAt": "2026-03-18T00:00:00Z"
  }
]
```

*Note*: Does not include ingredient/instruction groups. Use `GET /api/recipes/[id]` for full detail.

---

### `POST /api/recipes`

Create a new recipe (without image — upload image separately).

**Request body**:
```json
{
  "name": "Wok med kylling",
  "description": "...",
  "servings": 2,
  "prepTime": "Under 30 min",
  "category": "middag",
  "proteinSource": "kylling",
  "source": "manual",
  "ingredientGroups": [
    {
      "name": "Woksaus",
      "displayOrder": 0,
      "ingredients": [
        { "ingredientKey": "soyasaus", "displayName": "Soyasaus", "amount": 2, "unit": "ss", "displayOrder": 0 }
      ]
    }
  ],
  "instructionGroups": [
    {
      "name": "Woksaus",
      "displayOrder": 0,
      "steps": [
        { "stepOrder": 0, "text": "Bland {soyasaus} godt." }
      ]
    }
  ]
}
```

**Response `201`**: Created recipe object (same shape as GET list item, without groups).

**Response `400`**: `{ "error": "Validation message" }`

---

### `GET /api/recipes/[id]`

Get a single recipe with full ingredient and instruction data.

**Response `200`**:
```json
{
  "id": "uuid",
  "name": "Wok med kylling",
  "servings": 2,
  "prepTime": "Under 30 min",
  "category": "middag",
  "proteinSource": "kylling",
  "imagePath": "recipes/uuid.png",
  "source": "manual",
  "sortOrder": 0,
  "createdAt": "2026-03-18T00:00:00Z",
  "ingredientGroups": [
    {
      "id": "uuid",
      "name": "Woksaus",
      "displayOrder": 0,
      "ingredients": [
        { "id": "uuid", "ingredientKey": "soyasaus", "displayName": "Soyasaus", "amount": 2, "unit": "ss", "displayOrder": 0 }
      ]
    }
  ],
  "instructionGroups": [
    {
      "id": "uuid",
      "name": "Woksaus",
      "displayOrder": 0,
      "steps": [
        { "id": "uuid", "stepOrder": 0, "text": "Bland {soyasaus} godt." }
      ]
    }
  ]
}
```

**Response `404`**: `{ "error": "Ikke funnet" }`

---

### `PUT /api/recipes/[id]`

Update a recipe. Replaces ingredient and instruction groups in full.

**Request body**: Same shape as `POST /api/recipes`.

**Response `200`**: Updated recipe (same shape as GET list item).

**Response `404`**: `{ "error": "Ikke funnet" }`

---

### `DELETE /api/recipes/[id]`

Delete a recipe and all related rows (cascades). Also deletes the image from storage if present.

**Response `204`**: No content.

**Response `404`**: `{ "error": "Ikke funnet" }`

---

### `PATCH /api/recipes/reorder`

Bulk update `sort_order` after a drag-and-drop reorder. Accepts only the changed entries.

**Request body**:
```json
[
  { "id": "uuid-a", "sortOrder": 0 },
  { "id": "uuid-b", "sortOrder": 1 },
  { "id": "uuid-c", "sortOrder": 2 }
]
```

**Response `200`**: `{ "updated": 3 }`

---

### `POST /api/recipes/[id]/image`

Upload a thumbnail image for a recipe. Stores in Supabase Storage and updates `image_path`.

**Request**: `multipart/form-data` with field `file` (JPEG or PNG, max 5 MB).

**Response `200`**:
```json
{
  "imagePath": "recipes/uuid.png",
  "imageUrl": "https://<project>.supabase.co/storage/v1/object/public/recipe-images/recipes/uuid.png"
}
```

**Response `400`**: `{ "error": "Ugyldig fil" }`

---

## Meal Plans

### `GET /api/meal-plans/current`

Get the meal plan for the current week (week containing today). Creates an empty plan with
7 `empty` day slots if none exists.

**Response `200`**:
```json
{
  "id": "uuid",
  "weekStart": "2026-03-16",
  "createdAt": "2026-03-18T00:00:00Z",
  "days": [
    { "id": "uuid", "planId": "uuid", "weekday": 0, "status": "empty", "mealTitle": null, "recipeId": null },
    { "id": "uuid", "planId": "uuid", "weekday": 1, "status": "suggested", "mealTitle": "Indisk kyllingcurry", "recipeId": null }
  ]
}
```

---

### `POST /api/meal-plans/generate`

Generate meal titles for all non-skipped days in a plan using Claude Haiku.

**Request body**:
```json
{
  "planId": "uuid",
  "cuisines": ["indisk", "thai", "italiensk"]
}
```

**Response `200`**: Updated plan object (same shape as GET current).

**Response `400`**: `{ "error": "Ingen matretter valgt" }`

**Response `502`**: `{ "error": "AI-generering feilet. Prøv igjen." }`

---

### `PATCH /api/meal-plans/[planId]/days/[dayId]`

Update a single day in a plan: skip it, or swap it with another day.

**Request body** (skip):
```json
{ "action": "skip" }
```

**Request body** (swap):
```json
{ "action": "swap", "withDayId": "uuid-of-other-day" }
```

**Response `200`**: Updated plan object.

**Response `400`**: `{ "error": "Ugyldig handling" }`

---

### `POST /api/meal-plans/[planId]/days/[dayId]/generate-recipe`

Generate a full recipe for the meal title on a given day using Claude Sonnet.
Does **not** automatically save to the recipe list — user must confirm.

**Response `200`**:
```json
{
  "recipe": {
    "name": "Indisk kyllingcurry",
    "description": "...",
    "servings": 4,
    "prepTime": "45 min",
    "category": "middag",
    "proteinSource": "kylling",
    "source": "ai-generated",
    "ingredientGroups": [...],
    "instructionGroups": [...]
  }
}
```

**Response `502`**: `{ "error": "AI-generering feilet. Prøv igjen." }`

---

## Seed (Development Only)

### `POST /api/seed`

Seeds the database with the 38 pre-existing recipes from `src/recipe-data/recipes.json`
and uploads images to Supabase Storage. **Only available when `NODE_ENV !== 'production'`.**

**Response `200`**: `{ "seeded": 38 }`

**Response `403`**: `{ "error": "Ikke tilgjengelig i produksjon" }`
