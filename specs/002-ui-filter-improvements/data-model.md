# Data Model: UI & Filter Improvements

**Branch**: `002-ui-filter-improvements` | **Date**: 2026-03-26

---

## No Schema Changes Required

This feature introduces no new database tables, columns, or relationships. All changes are in the presentation layer.

---

## Existing Entity: Recipe

The `recipes` table is used by the delete feature. No schema changes are made — the existing `DELETE` API route already handles cascading cleanup of related rows (ingredient groups, instruction groups) and removes images from Supabase Storage before deleting the recipe row.

**Relevant fields for filtering (client-side)**:

| Field | Type | Used for |
|-------|------|----------|
| `category` | `text` | Category filter options (derived set) |
| `protein_source` | `text` | Protein filter options (derived set) |
| `id` | `uuid` | Delete operation target |
| `image_path` | `text \| null` | Image cleanup on delete |

---

## Client-Side Data Flow (Post-Change)

```
Supabase → RSC (fetch ALL recipes, no filter) → RecipeList (client component)
                                                     │
                                                     ├─ useMemo: derive availableCategories
                                                     ├─ useMemo: derive availableProteins
                                                     ├─ useMemo: filteredRecipes (from URL params)
                                                     └─ Renders RecipeFilters + RecipeGrid
```

The URL still carries filter state (`?category=X&proteinSource=Y`) so that links remain shareable and back/forward navigation works correctly. The filter application moves from the server query to client-side array filtering.

---

## Delete Cascade (Existing Behaviour, No Changes)

The existing `DELETE /api/recipes/[id]` handler performs:
1. Fetch `image_path` for the recipe
2. If `image_path` exists → delete from Supabase Storage (`recipe-images` bucket)
3. Delete the recipe row (Supabase cascades to `ingredient_groups` → `ingredients`, `instruction_groups` → `instruction_steps` via FK constraints)

No changes to this behaviour. UI simply calls the existing endpoint.
