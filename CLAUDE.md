# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Speckit v0.3.1** spec-driven development project. The repository uses a design-first workflow where feature specifications, technical plans, and task breakdowns are created before any implementation code is written.

There is no application code yet — the framework is ready for the first feature to be specified.

## Speckit Workflow

Features progress through phases in order. Each command produces artifacts that the next command depends on:

```
/speckit.specify   → specs/<NNN-feature-name>/spec.md
/speckit.clarify   → updates spec.md with clarified requirements
/speckit.plan      → plan.md, research.md, data-model.md, contracts/, quickstart.md
/speckit.tasks     → tasks.md (phased, dependency-ordered tasks)
/speckit.analyze   → read-only consistency report (no file changes)
/speckit.implement → executes tasks.md phase by phase
/speckit.checklist → domain-specific quality checklist
/speckit.taskstoissues → converts tasks.md to GitHub issues
```

## Feature Branch Naming

Features use the naming convention `NNN-short-name` (e.g., `001-user-auth`). All design artifacts for a feature live under `specs/NNN-feature-name/`.

The bash utility scripts auto-detect the current feature from the git branch name. Environment variable `SPECIFY_FEATURE` can override detection.

## Key Architecture Concepts

**Gate-based progression**: Each command validates prerequisites before running. Constitution constraints are checked before Phase 0 of planning. Tasks cannot be generated without an existing `plan.md`.

**Independent user story delivery**: Specs define P1/P2/P3 priority user stories. Each story must be independently testable and deployable. P1 stories are MVP; P2/P3 are additive.

**Task phases**: `tasks.md` groups work into phases (Phase 1: Setup → Phase 2: Foundational → Phase 3+: User Stories). Tasks tagged `[P]` can run in parallel.

**Constitution**: `.specify/memory/constitution.md` defines non-negotiable project constraints (currently a template, not yet filled). Design decisions that violate constitution require explicit justification.

## Bash Utility Scripts

Located in `.specify/scripts/bash/`:

- `check-prerequisites.sh` — validates workflow state; supports `--json`, `--require-tasks`, `--paths-only` flags
- `create-new-feature.sh` — scaffolds a new feature branch and `spec.md`; supports `--short-name`, `--number`, `--json`
- `setup-plan.sh` — prepares planning phase, copies plan template
- `update-agent-context.sh` — manages agent context files during implementation
- `common.sh` — shared utilities (repo root detection, branch parsing, path resolution)

Scripts use POSIX `sh` (not bash) for portability.

## Settings

`.claude/settings.local.json` contains minimal permissions. As features are implemented and build/test tooling is added, update permissions here to allow relevant commands.

## Active Technologies
- TypeScript 5.x / Node.js 20+ + Next.js 15, @supabase/supabase-js, @supabase/ssr, (001-recipe-meal-planner)
- Supabase PostgreSQL (recipes, meal plans) + Supabase Storage public bucke (001-recipe-meal-planner)

## Recent Changes
- 001-recipe-meal-planner: Added TypeScript 5.x / Node.js 20+ + Next.js 15, @supabase/supabase-js, @supabase/ssr,
