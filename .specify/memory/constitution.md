<!--
SYNC IMPACT REPORT
==================
Version change: (template, no prior version) → 1.0.0
New constitution — initial ratification.

Principles added:
  - I. Mobile-First, Cross-Platform (new)
  - II. Simplicity & Minimalism (new)
  - III. User Experience First (new)

Sections added:
  - Platform Constraints (new)
  - Governance (new)

Sections removed (relative to template):
  - Section 3 (Development Workflow) — deferred; no workflow constraints yet

Templates reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check section generic; no changes needed
  ✅ .specify/templates/spec-template.md — no principle-specific constraints to add
  ✅ .specify/templates/tasks-template.md — no principle-driven task types removed
  ✅ .claude/commands/* — no outdated CLAUDE-only references found in constitution-relevant sections

Follow-up TODOs:
  - None. All placeholders resolved.
-->

# Middah Constitution

## Core Principles

### I. Mobile-First, Cross-Platform

Every screen and interaction MUST be designed for mobile viewports first, then
adapted to larger screens. The app MUST render correctly in both mobile and web browsers.

- Layout MUST use responsive design; no feature may be desktop-only.
- Touch targets MUST meet minimum size requirements (44×44 pt / 48×48 dp).
- No feature may depend on hover state as its sole interaction model.

**Rationale**: The product is explicitly required to run on mobile devices, but also larger desktop screens.
Designing desktop-first produces interfaces that degrade poorly on small screens
and require costly rework.

### II. Simplicity & Minimalism

Every UI element, API surface, and code abstraction MUST justify its existence.
Features MUST be reduced to their essential function before implementation begins.

- Additional complexity MUST be documented in the plan's Complexity Tracking table.
- Each new dependency MUST be evaluated against: "can this be avoided entirely?"
- Default answer to "should we add X?" is NO until a concrete user need is proven.

**Rationale**: Minimalism directly improves maintainability and user comprehension.
Accumulated complexity is the primary source of UX degradation over time.

### III. User Experience First

UX quality is a non-negotiable constraint, not a nice-to-have. Every technical
decision MUST be evaluated for its impact on the end user before implementation.

- Interactions MUST be learnable without documentation or tooltips on first use.
- Perceived performance MUST be preserved: use optimistic UI, skeletons, or
  progressive loading rather than blocking spinners where possible.
- Error states MUST be actionable — users MUST know what to do next.

**Rationale**: The product's primary differentiator is user experience. Technical
shortcuts that degrade UX undermine the core product value.

## Platform Constraints

- **Rendering targets**: Mobile browsers (iOS Safari, Android Chrome) and desktop
  browsers (Chrome, Firefox, Safari) are all first-class targets.
- **Offline behaviour**: Features that are unusable offline MUST degrade gracefully
  (informative empty state, not a broken UI).
- **Bundle size**: Front-end bundle MUST remain lean. Dependencies adding >50 KB
  (gzipped) require explicit justification in the plan's Complexity Tracking table.

## Governance

This constitution supersedes all other architectural guidelines. Amendments require:

1. A constitution update via `/speckit.constitution` with documented rationale.
2. A version bump per semantic versioning (MAJOR: principle removal/redefinition;
   MINOR: new principle or section; PATCH: clarifications and wording).
3. Propagation to affected plan, spec, and tasks artifacts before implementation
   resumes.

All plans MUST include a Constitution Check section gating Phase 0 research.
Violations discovered during `/speckit.analyze` are automatically CRITICAL severity.
Complexity exceptions MUST be logged in the plan's Complexity Tracking table —
silent violations are not permitted.

**Version**: 1.0.0 | **Ratified**: 2026-03-18 | **Last Amended**: 2026-03-18
