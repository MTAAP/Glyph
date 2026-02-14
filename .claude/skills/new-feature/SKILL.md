---
name: new-feature
description: Scaffold a new feature module following Glyph's architecture patterns
disable-model-invocation: true
---

# New Feature Scaffolding

Create a new feature module at `src/features/<name>/` following the project's established patterns.

## Arguments

The user provides the feature name as an argument: `/new-feature <name>`

## Directory Structure

Create the following structure based on what the feature needs:

```
src/features/<name>/
  components/       # React components (if UI needed)
  engine/            # Pure functions (if processing logic needed)
    __tests__/       # Unit tests for engine functions
  hooks/             # React hooks (if state/lifecycle needed)
  worker/            # Web Worker (if heavy computation needed — use relative imports only)
```

## Rules

1. Only create the subdirectories that the feature actually needs — ask the user which ones
2. Engine functions must be **pure** (no DOM, no React, no side effects)
3. Worker files must use **relative imports only** — never `@/` aliases
4. Test files go in `engine/__tests__/<module>.test.ts` using vitest globals (`describe`, `it`, `expect`)
5. Components use TypeScript + Tailwind CSS 4 classes
6. If the feature has state, add its slice to the Zustand store at `src/features/settings/store.ts`
7. Follow existing naming conventions: camelCase files for modules, PascalCase for components

## Reference Examples

- Simple engine feature: `src/features/renderer/engine/` (sampler, mapper, etc.)
- Full feature with UI + engine + hooks + export: `src/features/animation/`
- Components-only feature: `src/features/preview/`
