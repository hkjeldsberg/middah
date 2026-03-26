# Quickstart: UI & Filter Improvements

**Branch**: `002-ui-filter-improvements`

---

## Prerequisites

- Node.js 20+
- npm or pnpm
- `.env.local` with Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)

## Running Locally

```bash
cd /Users/hkjeldsberg/ProjectsSpec/middah-app-v2
npm install
npm run dev
```

Open http://localhost:3000

## Verifying Each Change

| Change | How to verify |
|--------|---------------|
| Frontend filtering | Open DevTools Network tab → apply a category filter → confirm no new XHR/fetch requests fire |
| Hide empty filters | Filter dropdowns only show categories/proteins that exist in your recipe data |
| Delete recipe | Open any recipe → click "Slett oppskrift" → confirm dialog → verify redirect to `/` and recipe gone from list |
| Hidden meal planner nav | Nav shows only "Oppskrifter" link — no "Middagsplan" visible; but `/meal-planner` still loads |
| Button alignment | Visually inspect all buttons: text centered top-to-bottom and left-to-right |
| Geist font | Compare font rendering with middah.no — geometric sans-serif Geist applied throughout |

## Key Files Modified

```
src/
├── app/
│   ├── page.tsx                          # Remove filter params from Supabase query; pass all recipes to RecipeList
│   ├── layout.tsx                        # Add Geist font via next/font/google
│   └── globals.css                       # Add button flex-centering rule
├── components/
│   ├── ui/NavBar.tsx                     # Remove meal planner link
│   └── recipe/
│       ├── RecipeFilters.tsx             # Accept available options as props; hide empty options
│       ├── RecipeDetail.tsx              # Add delete button with confirm + redirect
│       └── RecipeList.tsx               # NEW: client component for client-side filtering
└── tailwind.config.ts                    # Add Geist font variable
```
