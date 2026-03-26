# Research: Fork and Knife Favicon

**Feature**: 003-fork-knife-favicon
**Date**: 2026-03-26

## Decision 1: Favicon delivery mechanism in Next.js 15 App Router

**Decision**: Use Next.js App Router file-based favicon convention — place `icon.svg` in `src/app/`.

**Rationale**: Next.js 15 App Router automatically serves any file named `icon.svg`, `icon.png`, `favicon.ico`, or `apple-icon.png` placed directly in `src/app/`. No metadata configuration needed; Next.js generates the correct `<link rel="icon">` tags automatically. This is the zero-config, framework-native path.

**Alternatives considered**:
- Manual `<link>` tags in `layout.tsx` `<head>` — works but bypasses the App Router convention; more boilerplate.
- `metadata.icons` in `layout.tsx` — also valid but adds code when the file-based approach is equivalent.
- Placing files in `public/` with manual links — works but requires manual `<link>` tags and doesn't benefit from Next.js automatic icon handling.

---

## Decision 2: Icon format

**Decision**: SVG as the primary source, with a generated `apple-icon.png` (180×180) for iOS home-screen shortcuts.

**Rationale**: SVG scales perfectly to all sizes (16×16 browser tab up to 512×512 home-screen icon) without quality loss. Next.js App Router natively supports `icon.svg` and auto-generates appropriate `<link>` metadata. For Apple touch icons, a rasterized PNG at 180×180 is required — this can be derived from the SVG.

**Alternatives considered**:
- ICO file only — limited to raster sizes; requires separate tooling; does not scale well.
- PNG at multiple sizes — more files to maintain; SVG source is cleaner and more maintainable.
- Emoji favicon (🍴) via `data:` URI in metadata — works in modern browsers but unreliable across all targets and cannot be used as a home-screen icon.

---

## Decision 3: Fork and knife SVG design

**Decision**: A simple, single-color SVG using the app's existing warm color palette (based on `globals.css` and Tailwind config), with a white or transparent background and a centered fork-and-knife motif using clean geometric paths.

**Rationale**: The icon must be legible at 16×16px. Complex multi-color designs lose fidelity at small sizes. A single foreground color on a transparent or solid background is the standard approach for application favicons. Matching the existing brand colors (warm tones visible in the app) ensures visual coherence.

**Alternatives considered**:
- Multi-color illustration — too complex at small sizes; fails the 16×16 recognizability requirement.
- Using a third-party icon library icon — adds a dependency; a simple SVG path is self-contained and zero-dependency.

---

## Decision 4: Files to create

| File | Location | Purpose |
|------|----------|---------|
| `icon.svg` | `src/app/` | Primary favicon (browser tab, bookmarks) — served automatically by Next.js |
| `apple-icon.png` | `src/app/` | iOS home-screen shortcut icon (180×180px) |

No new npm dependencies are required. No schema changes. No API changes.
