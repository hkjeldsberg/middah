# Quickstart: Fork and Knife Favicon

## What this feature does

Adds a fork-and-knife icon to the browser tab, bookmarks, and mobile home-screen shortcuts for the Middah app.

## How it works

Next.js 15 App Router automatically detects icon files placed in `src/app/` and generates the correct HTML `<link>` tags for all pages — no code changes to `layout.tsx` required.

| File | What it does |
|------|-------------|
| `src/app/icon.svg` | Browser tab icon, bookmarks (all pages) |
| `src/app/apple-icon.png` | iOS home-screen shortcut icon |

## Verifying the feature

1. Run `npm run dev`
2. Open `http://localhost:3000` in Chrome, Firefox, and Safari
3. Check the browser tab — the fork-and-knife icon should appear
4. Bookmark the page — the icon should appear in the bookmarks bar
5. On an iOS device or simulator: open the app in Safari → Share → Add to Home Screen → verify the icon

## Files changed

- `src/app/icon.svg` — new file
- `src/app/apple-icon.png` — new file
- No other files are modified
