# Implementation Plan: Fork and Knife Favicon

**Branch**: `003-fork-knife-favicon` | **Date**: 2026-03-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-fork-knife-favicon/spec.md`

## Summary

Add a fork-and-knife SVG icon as the application favicon. Next.js 15 App Router's file-based icon convention is used: placing `icon.svg` in `src/app/` causes Next.js to automatically generate and serve the correct `<link rel="icon">` metadata for all pages. An `apple-icon.png` (180×180) is added alongside for iOS home-screen shortcuts. No new dependencies, no schema changes, no API surface changes.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+
**Primary Dependencies**: Next.js 15.2.3, React 19, Tailwind CSS
**Storage**: N/A (static asset files only)
**Testing**: Manual browser verification across Chrome, Firefox, Safari
**Target Platform**: Mobile browsers (iOS Safari, Android Chrome) and desktop browsers (Chrome, Firefox, Safari)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Favicon files must not impact page load time meaningfully; SVG is <2 KB
**Constraints**: Icon must be recognizable at 16×16px; no new npm dependencies
**Scale/Scope**: Two static files added to repository

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Check | Notes |
|-----------|-------|-------|
| I. Mobile-First, Cross-Platform | ✅ PASS | `apple-icon.png` covers iOS home-screen. SVG scales to all sizes. No hover-only interaction. |
| II. Simplicity & Minimalism | ✅ PASS | Two files, zero new dependencies. Next.js file-based convention eliminates any code changes to `layout.tsx`. |
| III. User Experience First | ✅ PASS | Favicon improves brand recognition in browser tab. Icon design prioritizes legibility at 16×16px. |

**No violations. Gate cleared.**

## Project Structure

### Documentation (this feature)

```text
specs/003-fork-knife-favicon/
├── plan.md              # This file
├── research.md          # Phase 0 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
└── app/
    ├── icon.svg          # NEW: Fork-and-knife favicon (auto-served by Next.js App Router)
    ├── apple-icon.png    # NEW: iOS home-screen icon (180×180px, rasterized from SVG)
    ├── layout.tsx        # UNCHANGED: Next.js picks up icons automatically, no edits needed
    └── ...

public/
    └── placeholder-recipe.svg   # Existing — unchanged
```

**Structure Decision**: Single Next.js web application. Files go directly into `src/app/` to use the App Router file-based icon convention. No new directories.

## Phase 0: Research

See [research.md](./research.md) for full decision log. Summary:

- **Favicon delivery**: Next.js App Router file-based convention (`src/app/icon.svg`)
- **Format**: SVG primary + `apple-icon.png` 180×180 for iOS
- **Design**: Single-color fork-and-knife on transparent background, legible at 16×16
- **Dependencies**: None added

All NEEDS CLARIFICATION items resolved. Gate cleared for Phase 1.

## Phase 1: Design

### Icon Design Specification

The fork-and-knife SVG must meet these design constraints:

- **Viewbox**: `0 0 100 100` (square, scales to any size)
- **Background**: Transparent or solid filled circle/square in brand warm tone
- **Foreground**: White or contrasting stroke fork and knife, centered and balanced
- **Stroke approach**: Simple geometric paths — not an illustration. Two distinct utensils visually separated.
- **Color**: Use warm tone from app palette. The existing app uses warm food-photography tones; a terracotta/burnt-orange or warm green works well as a background circle with white utensils.
- **Legibility test**: At 16×16px the fork and knife must be distinguishable as two separate utensils.

### apple-icon.png Specification

- Derived from the same SVG source
- Dimensions: 180×180 pixels
- Format: PNG with transparency or solid background
- Generated at implementation time (can use browser-based SVG-to-PNG, Inkscape, or sharp CLI — no new runtime dependency)

### No Data Model

This feature involves no database entities, user data, or state. `data-model.md` is not applicable and is omitted.

### No API Contracts

This feature exposes no new endpoints, functions, or interfaces. `contracts/` is not applicable and is omitted.

### Quickstart

See [quickstart.md](./quickstart.md).
