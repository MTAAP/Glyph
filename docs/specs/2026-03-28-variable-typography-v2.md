<!-- Imported from gstack: ceo-plans/2026-03-28-variable-typography-v2.md, ticklish-juggling-kettle.md -->

# Feature: Variable Typography v2 (Pretext-Inspired)

## Goal
Replace hardcoded character brightness/width tables with runtime font measurement via canvas, add a font picker for proportional mode, discrete opacity tiers, and warm color presets, so that Glyph's ASCII art adapts to any font instead of being calibrated for a single typeface.

## Requirements
- [ ] [P0] Runtime font measurement: measure character brightness (pixel coverage) and width (canvas.measureText) at runtime for the active charset x 3 weights x 2 styles, replacing static CHAR_BRIGHTNESS/CHAR_WIDTH lookup tables in variable-type.ts
- [ ] [P0] MeasuredPalette data structure: define MeasuredEntry type (char, weight, italic, brightness, width), thread palette through mapper.ts → variable-type.ts → worker → export paths
- [ ] [P0] Palette fallback: when measurement fails or is pending, fall back to existing static tables transparently
- [ ] [P0] Palette caching: cache measured palettes per font+charset key, invalidate on font or charset change
- [ ] [P0] Binary search palette lookup: replace linear scan in mapProportionalType with binary search on sorted brightness + +-3 window scan for combined brightness+width scoring
- [ ] [P1] Font picker UI: NavigableSelect dropdown with web-safe fonts (Georgia, Palatino, Times, Arial, Helvetica, IBM Plex Mono, Courier), only visible when Proportional toggle is ON
- [ ] [P1] Discrete opacity tiers: quantize continuous opacity (0.3-1.0) to 8 discrete levels (round to nearest 0.1, clamp to [0.3, 1.0])
- [ ] [P1] Color presets: add variableTypeColorPreset setting with 5 options (default, warm-gold rgb(196,163,90), cool-blue rgb(100,149,237), amber rgb(255,191,0), rose rgb(255,105,120)), override monoFgColor in variable type mode only
- [ ] [P1] Rename "Variable Weight" label to "Variable Typography" in RenderSettings.tsx
- [ ] [P1] Rename magic constant 2.5 to BRIGHTNESS_WEIGHT with explanatory comment
- [ ] [P1] Console log on measurement complete: "Font measurement: {n} entries in {ms}ms for {font}" (no emoji)
- [ ] [P1] Remove hardcoded PROPORTIONAL_FONT_FAMILY from CanvasPreview.tsx and TextPreview.tsx, read from variableTypeFont setting instead
- [ ] [P2] Measuring indicator: show subtle "measuring..." text near font picker while palette computation is in progress
- [ ] [P2] Keyboard shortcut (shift+C) to cycle through color presets when variable typography is active

## Architecture
The rendering pipeline flows: Source → extractImageData → Web Worker → sampler → mapper → variable-type → CharacterGrid → Preview/Export.

**New module:** `src/features/renderer/engine/font-measurer.ts` — pure functions for runtime measurement. Uses canvas.measureText() for width and offscreen canvas pixel-coverage scanning for brightness. Runs on main thread only (canvas text APIs unavailable in workers). Exports `measureCharsetPalette()` and `measureCharBrightness()`.

**Modified pipeline flow:**
```
useRenderer hook
  ├─ measureCharsetPalette() → MeasuredPalette (cached, async)
  ├─ extractImageData()
  └─ WorkerRequest { settings, imageData, measuredPalette? }
        ↓
      Web Worker
        └─ mapToCharacters(samples, settings, charset, ..., measuredPalette?)
              └─ buildVariableTypeGrid()
                    └─ mapProportionalType(..., measuredPalette?)
                          // uses measured palette if provided, else static tables
```

**Files affected:**
- NEW: `src/features/renderer/engine/font-measurer.ts` (~120 lines)
- MODIFY: `src/shared/types/index.ts` — add MeasuredEntry type, variableTypeFont/variableTypeColorPreset to RenderSettings, measuredPalette to WorkerRequest
- MODIFY: `src/features/settings/store/settingsSlice.ts` — add defaults
- MODIFY: `src/features/renderer/engine/variable-type.ts` — accept palette param, binary search, discrete opacity, named constant
- MODIFY: `src/features/renderer/engine/mapper.ts` — forward palette param
- MODIFY: `src/features/renderer/worker/render.worker.ts` — extract palette from request
- MODIFY: `src/features/renderer/hooks/useRenderer.ts` — measure palette, attach to request, debounce
- MODIFY: `src/features/export/collectFrames.ts` — accept palette param
- MODIFY: `src/features/settings/components/RenderSettings.tsx` — font picker, color presets, rename
- MODIFY: `src/features/preview/components/CanvasPreview.tsx` — dynamic font, color preset
- MODIFY: `src/features/preview/components/TextPreview.tsx` — dynamic font, color preset
- NEW: `src/features/renderer/engine/__tests__/font-measurer.test.ts` (~100 lines)
- MODIFY: `src/features/renderer/engine/__tests__/variable-type.test.ts` (+60 lines)

**Key patterns to follow:**
- Worker uses relative imports only (no @/ alias) — already established
- Settings changes debounce 150ms before dispatch — follow same pattern for font measurement
- NavigableSelect from `src/shared/ui/` for new dropdowns — matches existing UI pattern
- All engine functions are pure, no DOM dependencies — font-measurer is the exception (uses canvas), keep it separate from worker-safe code

## Acceptance Criteria
- When a user enables Variable Typography + Proportional and selects a font, the preview renders using runtime-measured character brightness/width values for that font
- When the font picker is changed, the palette is remeasured and the preview updates within 200ms + debounce time
- When measurement fails or is pending, the preview renders using the existing static fallback tables with no user-visible error
- When discrete opacity is active, all opacity values in the CharacterGrid are multiples of 0.1 between 0.3 and 1.0
- When a color preset is selected (not 'default'), the mono foreground color in the preview matches the preset's RGB value
- When variable type is disabled, the color preset has no effect on rendering
- When exporting as HTML/SVG/PNG with variable typography active, the exported output includes correct font-weight, font-style, and opacity attributes matching the preview
- The font picker is only visible when the Proportional toggle is ON
- Existing tests continue to pass with no modifications to their assertions (deterministic via palette injection)
- Binary search palette lookup produces identical results to linear scan for all test inputs

## Metric
Command: `npm test 2>&1 | tail -1`
Direction: higher is better (more tests passing)
Baseline: 147 tests passing (current)

## Guards
- `npx tsc --noEmit` — TypeScript strict mode passes
- `npm test` — all existing 147 tests pass
- `npm run lint` — ESLint passes
- `npm run build` — production build succeeds

## Verify Command
`npm test 2>&1 | tail -1`

## Test Strategy
- **Unit tests for:** font-measurer.ts (mock canvas context for deterministic testing), variable-type.ts changes (inject known palettes), discrete opacity quantization, color preset resolution
- **Integration tests for:** palette threading through worker request → mapper → variable-type, settings persistence with new fields
- **Framework:** Vitest + jsdom (existing project setup, vitest.config.ts with globals: true)
- **Mocks needed:** canvas 2D context mock for font-measurer tests (measureText, fillText, getImageData)
- **Test determinism:** All variable-type tests inject known MeasuredPalette directly, bypassing canvas measurement. Font-measurer tests use mocked canvas. No browser-dependent test results.

## Risk Assessment
- Blast radius: modifies existing renderer pipeline (adds optional parameter, no breaking changes)
- Risk level: low (graceful fallback to static tables on any failure)
- Affected systems: renderer engine, worker protocol, preview components, export formatters, settings store

## Open Questions
- Should the measurement canvas size (28x28) be configurable or is it a good default for all fonts?
- Should we persist the measured palette to localStorage for faster startup, or always remeasure?

## Loop Config
- max_outer_cycles: 3
- max_builder_iterations: 8
- require_plan_approval: true
- skip_baseline: false

## Verification
- Run `npx tsc --noEmit` and expect 0 errors
- Run `npm test` and expect all tests pass (existing + new)
- Run `npm run build` and expect success
- Run `npm run dev` and manually verify: enable variable type, enable proportional, pick a font, verify preview updates with measured palette

## User Journeys

App entry: http://localhost:5173
Dev server: `npm run dev`
Auth: none

### Journey 1: Enable variable typography with measured font
- [ ] Step 1 — Navigate: Scroll sidebar to find "Variable Typography" toggle
  Checkpoint: Toggle visible, labeled "Variable Typography", OFF by default
- [ ] Step 2 — Action: Toggle "Variable Typography" ON
  Checkpoint: Sub-controls appear (Italic, Opacity, Proportional toggles)
- [ ] Step 3 — Action: Toggle "Proportional" ON
  Checkpoint: Font picker dropdown appears below Proportional toggle
- [ ] Step 4 — Action: Select "Palatino" from font picker
  Checkpoint: Preview updates with remeasured palette (may flash briefly)
- [ ] Step 5 — Action: Select "warm-gold" color preset
  Checkpoint: Preview renders in warm gold tone (rgb(196,163,90)) instead of default gray

### Journey 2: Export with variable typography
- [ ] Step 1 — Navigate: With variable typography + proportional ON, open export modal
  Checkpoint: Export modal appears with format options
- [ ] Step 2 — Action: Select HTML format, export
  Checkpoint: Downloaded HTML contains spans with font-weight, font-style, opacity inline styles

## Out of Scope
- Font-size as rendering dimension (deferred — requires layout rewrite across 6 files, tracked in TODOS.md)
- Side-by-side comparison mode (deferred, tracked in TODOS.md)
- Particle/attractor brightness field (separate branch/plan)
- Google Fonts async loading (defer to follow-up — web-safe fonts first)
- Custom font upload (.ttf/.woff files)
- Variable font support (font-variation-settings CSS)
- Server-side rendering
