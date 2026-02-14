---
name: gen-engine-test
description: Generate unit tests for engine modules following Glyph's test patterns
disable-model-invocation: true
---

# Engine Test Generator

Generate unit tests for pure engine functions following the project's established test patterns.

## Arguments

The user provides the module path: `/gen-engine-test <path-to-module>`

Example: `/gen-engine-test src/features/renderer/engine/dither.ts`

## Workflow

1. **Read the target module** to understand its exports, function signatures, and edge cases
2. **Read an existing test** in the same `__tests__/` directory (or `src/features/renderer/engine/__tests__/` as reference) to match the style
3. **Generate the test file** at `<module-dir>/__tests__/<module-name>.test.ts`

## Test Conventions

Follow these patterns from the existing test suite:

- **Imports**: Use relative imports from the parent module (`import { fn } from '../module'`)
- **Structure**: One `describe` block per exported function, `it` blocks for each behavior
- **Helpers**: Create local helper functions for test data (e.g., `createTestImage`, `createGrid`)
- **No DOM**: Engine tests never touch the DOM — they test pure functions only
- **Globals**: vitest globals are available (`describe`, `it`, `expect`, `beforeEach`) — no imports needed
- **Naming**: Test file matches module name: `module.ts` -> `module.test.ts`

## What to Test

For each exported function, cover:
1. **Happy path** with typical inputs
2. **Edge cases**: empty inputs, zero dimensions, boundary values
3. **Correctness**: verify numeric outputs against hand-calculated expected values
4. **Type contracts**: ensure output shape matches the expected type (correct array lengths, required properties)

## Reference

See `src/features/renderer/engine/__tests__/sampler.test.ts` for the canonical test style — helper functions for test data, clear assertions, descriptive test names.
