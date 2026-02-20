# Plan D: New Features — Gallery, Animation Effects & PWA

## Scope
New components and features that don't modify existing files (mostly new files). Standalone additions.

## File Ownership
This plan exclusively owns these files:
- NEW: `src/features/input/components/SampleGallery.tsx`
- NEW: `src/features/input/data/samples.ts`
- NEW: `src/features/animation/engine/effects/dissolve.ts`
- NEW: `src/features/animation/engine/effects/scroll.ts`
- NEW: `src/features/animation/engine/effects/staticNoise.ts`
- NEW: `src/features/animation/engine/effects/invertFlash.ts`
- NEW: `src/features/animation/engine/__tests__/dissolve.test.ts`
- NEW: `src/features/animation/engine/__tests__/scroll.test.ts`
- NEW: `src/features/animation/engine/__tests__/staticNoise.test.ts`
- NEW: `src/features/animation/engine/__tests__/invertFlash.test.ts`
- `src/features/animation/engine/effects/index.ts` (register new effects)
- `src/features/animation/presets.ts` (add new presets using new effects)
- `vite.config.ts` (PWA plugin only)
- NEW: `public/manifest.json`
- NEW: `public/icons/` (PWA icons)

## Changes

### 1. Sample Image Gallery (SampleGallery.tsx, samples.ts)
**New feature**: Onboarding helper — bundled sample images so new users can try the tool immediately.

**samples.ts:**
- Array of sample entries: `{ name, thumbnail, fullUrl, description, bestPreset }`
- 4-6 diverse samples: portrait, landscape, high-contrast graphic, text/logo, pixel art, photo
- Images stored in `public/samples/` as small optimized files (< 100KB each)
- Thumbnails are the same images (browser handles scaling)

**SampleGallery.tsx:**
- Grid of thumbnail cards displayed in the empty state (when no source is loaded)
- Each card: thumbnail image, name, brief description
- Click loads the sample via `setSource()` in the store
- Styled to match terminal aesthetic: monospace labels, subtle borders
- Replaces or augments the current empty state message in Canvas.tsx

**Integration point:** Canvas.tsx shows SampleGallery when no source is loaded (Canvas.tsx is owned by Plan C, so this plan creates the component and Plan C integrates it, or we add a simple conditional in Canvas.tsx after Plan C is done).

### 2. New Animation Effects

All effects implement the existing `AnimationEffect` interface from `src/features/animation/engine/types.ts`. Each gets a test file.

**dissolve.ts:**
- Characters randomly appear/disappear like particles dissolving
- At `t=0`: empty grid. At `t=1`: full grid. In between: random subset visible.
- Params: `speed` (how fast the dissolve progresses), `density` (max visible fraction)
- Uses seeded random for deterministic frame output

**scroll.ts:**
- Shifts the entire grid horizontally or vertically, wrapping at edges
- Creates a marquee/ticker effect
- Params: `direction` ('left'|'right'|'up'|'down'), `speed` (pixels per frame)
- Modifies character positions, preserves colors

**staticNoise.ts:**
- Random characters and colors fired at random positions — TV static effect
- Params: `density` (fraction of cells affected, 0-1), `intensity` (color variation range)
- At density=0: no static. At density=1: full noise.
- Uses random charset characters for the noise chars

**invertFlash.ts:**
- Brief full-grid color inversion, like a camera flash or lightning strike
- Params: `frequency` (flashes per cycle), `duration` (fraction of cycle each flash lasts)
- When flash is active: swap fg/bg colors for all cells
- When inactive: pass through unchanged

**Tests for each:**
- Test `t=0`, `t=0.5`, `t=1` behavior
- Test with empty grid
- Test parameter edge cases (density=0, density=1, speed=0)
- Test that output grid dimensions match input

### 3. New Animation Presets (presets.ts)
Add presets that showcase the new effects:

- **"Dissolve In"**: dissolve effect with gentle speed, used alone
- **"Marquee"**: scroll effect (left direction) + scanline, retro ticker feel
- **"TV Static"**: staticNoise (high density) + flicker, broken TV aesthetic
- **"Lightning Storm"**: invertFlash (low frequency) + rain, dramatic weather

### 4. Effect Registry Updates (effects/index.ts)
- Import and register all 4 new effects in the registry
- Follow existing pattern: side-effectful import that calls `registerEffect()`

### 5. PWA / Offline Support
**Post-v1 quick win**: Glyph is fully client-side — PWA adds install + offline for minimal effort.

**vite.config.ts:**
- Add `vite-plugin-pwa` to plugins
- Configure: `registerType: 'autoUpdate'`, `includeAssets: ['**/*']`
- Service worker strategy: `generateSW` (precache all static assets)

**public/manifest.json:**
- App name: "Glyph"
- Short name: "Glyph"
- Theme color matching dark mode
- Icons at 192x192 and 512x512

**public/icons/:**
- Generate simple Glyph icons (could be ASCII art rendered to PNG)
- Two sizes: 192x192, 512x512

**Note:** PWA requires the `vite-plugin-pwa` npm dependency. Install via `npm install -D vite-plugin-pwa`.

## Acceptance Criteria
- `npx tsc --noEmit` passes
- `npm test` passes (including all 4 new effect test files + typing test from Plan A)
- New effects registered and selectable in animation controls
- New presets appear in preset dropdown
- Sample gallery renders in empty state
- PWA: `npm run build` produces service worker, manifest.json is in dist/
- App installable as PWA in Chrome
