# CLAUDE.md

## Project

Glyph is a browser-based ASCII art converter for images and video. Fully client-side, no backend. See `ascii-art-converter-spec.md` for the full product specification.

## Commands

```bash
npm run dev          # Start dev server (Vite, HMR)
npm run build        # tsc + vite build → dist/
npm test             # vitest run (147 tests across 15 files)
npm run test:watch   # vitest watch mode
npm run lint         # eslint
```

Always run `npx tsc --noEmit` and `npm test` before considering work complete.

## Tech Stack

- React 19 + TypeScript (strict mode, noUnusedLocals, noUnusedParameters)
- Vite 7 with `@tailwindcss/vite` plugin
- Tailwind CSS 4 (v4 uses `@import "tailwindcss"` in CSS, not a config file)
- Zustand for state management
- Radix UI primitives (accordion, slider, switch, select)
- Vitest + jsdom for testing

## Path Aliases

`@/` maps to `src/` — configured in both `vite.config.ts` and `tsconfig.app.json`.

**Critical**: Worker files (`src/features/renderer/worker/`) must use **relative imports**, not `@/` aliases. Vite workers don't resolve TypeScript path aliases.

## Architecture

### Rendering Pipeline

```
Source → extractImageData() → Web Worker → sampler → mapper → CharacterGrid → Preview
```

- **Engine** (`src/features/renderer/engine/`): Pure functions — sampler, luminance, edge-detect, dither, braille, mapper. No DOM dependencies. All have unit tests.
- **Worker** (`src/features/renderer/worker/`): `render.worker.ts` receives `ArrayBuffer` via `Transferable`, runs the engine pipeline, posts back `CharacterGrid`.
- **Hooks** (`src/features/renderer/hooks/`): `useRenderer` manages worker lifecycle, dispatches renders on state changes (debounced), falls back to main thread after 3 worker crashes.

### State

Single Zustand store at `src/features/settings/store.ts`. Contains source media refs, settings, render result, video playback state, theme, and toast queue. Access outside React via `useAppStore.getState()`.

### Rendering Modes

Controlled by boolean flags (`enableLuminance`, `enableEdge`, `enableDithering`), not an enum. Edge and dithering are mutually exclusive — enforced in the store's `updateSettings`.

### Preview

- **TextPreview**: Used for mono mode. Renders `<pre>` with CSS `transform: scale()` to fit container.
- **CanvasPreview**: Used for foreground/full color modes. Renders to `<canvas>` with per-character coloring.
- Both use `usePreviewScale` hook with `ResizeObserver` for fit-to-container scaling.

### Animation

- **Engine** (`src/features/animation/engine/`): Pipeline applies effects to a `CharacterGrid` per-frame. Effects are registered in a central registry.
- **Effects** (8): colorPulse, scanline, glitch, rain, flicker, colorWave, typing, blackwall — all in `engine/effects/`.
- **Presets**: Predefined effect+palette combos (Cyberpunk Neon, Matrix, Blade Runner, VHS Glitch, Typewriter, Neon Wave).
- **State**: `AnimationSettings` in the Zustand store. `animationPlaying` is separate from video `isPlaying`.
- **Preview**: `useAnimationLoop` hook drives frame updates; paused frame uses `useMemo`.
- **Export**: `collectAnimationFrames` for GIF/WebM; `formatAnimatedHtml` for self-contained HTML with JS runtime.

### Crop

`src/features/crop/` — interactive crop tool with drag handles. Components, hooks, and types for selecting a sub-region of the source before rendering.

### Input

`src/features/input/` — file picker, drag-and-drop, and keyboard handler (`KeyboardHandler.tsx`). Manages source media loading and terminal-style keyboard navigation.

### Export

Formatters are in `src/features/export/formatters/`. PNG, GIF, WebM, and frames are lazy-imported (`await import(...)`) to keep the initial bundle small.

### Shared Layer

`src/shared/` contains reusable UI primitives split across `ui/`, `hooks/`, `types/`, and `utils/`:
- **Navigable controls** (`NavigableSlider`, `NavigableSwitch`, `NavigableSelect`, etc.) — form components that integrate with keyboard navigation.
- **SettingControls** (`SettingSwitch`, `SettingSlider`) — compound label+control components used across sidebar sections.
- **FormatModal** — export format picker modal.
- **Toast** — toast notification component.

## UI / Terminal Navigation

The sidebar uses a terminal-style keyboard navigation system:
- `SidebarNavigationContext` (`src/features/settings/context/`) tracks the focused control index.
- `KeyboardHandler` (`src/features/input/components/`) captures arrow keys, Enter, Escape for navigating and adjusting controls without a mouse.
- All interactive sidebar controls use `Navigable*` wrappers from `src/shared/ui/` that register with the navigation context.

## Key Patterns

- Presets defined in `src/features/settings/presets.ts` — `getActiveCharset()` resolves preset name to character string
- Braille uses sub-pixel dot encoding (2x4 grid per character, U+2800-U+28FF) — separate code path in the mapper
- `CharacterGrid` is `CharacterCell[][]` where each cell has `{ char, fg?, bg? }`
- Color quantization options: 8, 16, 256, or truecolor

## Testing

Tests live in `__tests__/` directories adjacent to the code they test:
- `src/features/renderer/engine/__tests__/` — sampler, luminance, edge-detect, dither, braille, adjustments, mapper
- `src/features/animation/engine/__tests__/` — pipeline, colorPulse, scanline, glitch, rain, flicker, colorWave, blackwall

All tests target pure engine functions (no DOM, no React). Test files are excluded from `tsconfig.app.json` — vitest runs them separately with its own config (`vitest.config.ts` with `globals: true` and jsdom environment).

## Gotchas

- `useRef` needs explicit initial value (`useRef<T>(undefined)`) with TypeScript strict mode
- Worker files: relative imports only, no `@/` alias
- Test files excluded from `tsconfig.app.json` to avoid vitest global type conflicts with `tsc`
- Tailwind CSS 4 uses CSS-based config (`@theme` blocks in `src/index.css`), not `tailwind.config.js`
