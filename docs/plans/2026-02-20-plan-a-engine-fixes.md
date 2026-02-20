# Plan A: Engine Fixes, Testing & Core Quality

## Scope
Pure engine/worker/formatter fixes. No UI component changes.

## File Ownership
This plan exclusively owns these files (no other plan touches them):
- `src/features/renderer/engine/mapper.ts`
- `src/features/renderer/engine/adjustments.ts`
- `src/features/renderer/hooks/useRenderer.ts`
- `src/features/renderer/worker/render.worker.ts`
- `src/features/animation/engine/effects/glitch.ts`
- `src/features/animation/engine/effects/flicker.ts`
- `src/features/animation/engine/effects/rain.ts`
- `src/features/animation/engine/effects/colorWave.ts`
- `src/features/animation/engine/effects/typing.ts`
- `src/features/animation/engine/effects/scanline.ts`
- `src/features/animation/engine/effects/blackwall.ts`
- `src/features/animation/engine/utils.ts`
- `src/features/animation/engine/__tests__/typing.test.ts` (NEW)
- `src/features/export/formatters/gif.ts`
- `src/features/export/formatters/frames.ts`
- `src/features/export/formatters/plaintext.ts`

## Changes

### 1. Worker crash retry (useRenderer.ts)
**Bug**: When a worker crashes, the new worker is created but the in-flight render is lost. User must change a setting to re-trigger.
- After successful worker recreation in the error handler, re-dispatch the last render request.
- Store the last render params in a ref so they can be replayed.

### 2. Buffer transfer optimization (useRenderer.ts)
**Perf**: `.slice(0)` creates a redundant copy of the pixel buffer before transferring to worker.
- Transfer `imageData.data.buffer` directly instead of `imageData.data.buffer.slice(0)`.
- The imageData is not used after transfer, so detaching the buffer is safe.

### 3. Canvas reuse in extractImageData (useRenderer.ts)
**Perf**: `document.createElement('canvas')` is called on every render.
- Create a persistent canvas via `useRef`. Resize it only when source dimensions change.

### 4. Dead enableLuminance branch (mapper.ts)
**Code quality**: `mapper.ts:178-190` — the `else if (settings.enableLuminance)` and `else` branches execute identical code.
- Collapse to a single branch: `if (enableDithering) { dither path } else { luminance path }`.
- Remove the dead conditional.

### 5. Saturation + hue adjustments (adjustments.ts)
**New feature**: Currently only brightness and contrast. Add saturation and hue shift.
- Add `saturation: number` (0-200, default 100) and `hueShift: number` (0-360, default 0) to adjustment params.
- Use RGB→HSL→RGB conversion. HSL utils already exist in `src/shared/utils/color.ts`.
- Apply after brightness/contrast, before returning sample results.
- Note: store.ts changes for new settings fields are in Plan B's scope — this plan only adds the engine function.

### 6. cloneCell consistency (animation effects)
**Code quality**: 20+ occurrences of `[...cell.fg] as RGB` across animation effects. `cloneCell` utility exists in `utils.ts` but is unused.
- Replace all inline spread-cast patterns with `cloneCell()` from `../utils`.
- Files: glitch.ts, flicker.ts, rain.ts, colorWave.ts, typing.ts, scanline.ts, blackwall.ts.

### 7. typing effect tests (NEW: typing.test.ts)
**Testing gap**: Only effect of 8 without tests. Has 4 direction modes, Fisher-Yates shuffle, hold frame fraction.
- Test all 4 directions: ltr, rtl, random, column.
- Test `t=0` (empty grid), `t=0.5` (partial reveal), `t=1` (full reveal).
- Test hold frame behavior.
- Test empty grid input.
- Test seeded random consistency.

### 8. GIF large video warning (gif.ts)
**Spec gap §7.2**: No warning for >300 frames.
- Before encoding, check frame count. If > 300, emit a warning via a callback/event (the caller in useExport will show the toast).
- Return estimated file size and processing time in the warning.

### 9. Frame sequence metadata fixes (frames.ts)
**Spec gap §12.3**: Missing `version` and `duration` fields. `sourceFilename` should be `source`.
- Add `version: "1.0"` to metadata.json output.
- Rename `sourceFilename` → `source`.
- Add `duration` field (calculated from frame count / fps).
- Fix hardcoded 256-color ANSI depth — use the format options' colorDepth instead.

### 10. Markdown copy format (plaintext.ts)
**New feature**: Add a `formatMarkdownCodeBlock()` export that wraps plaintext in triple backticks.
- Export a new function from plaintext.ts: wraps output of `formatPlainText()` in `` ```\n...\n``` ``.
- The UI integration (adding the button/option) is in Plan B's scope.

## Acceptance Criteria
- `npx tsc --noEmit` passes
- `npm test` passes (including new typing.test.ts)
- No regressions in existing tests
